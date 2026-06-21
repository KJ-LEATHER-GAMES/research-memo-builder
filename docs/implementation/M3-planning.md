# M3 実装方針提案

結論から言うと、M3は **「複数検索の実行制御」＋「検索結果の内部標準形式化」＋「URL完全一致重複排除」** までを実装対象にするのがよいです。

CSV/Markdown出力はM4/M5へ残し、M3では **標準出力で検索・正規化・重複排除の結果を確認できる状態** をExit条件にします。

---

## 1. M3のゴール

M3の到達点は以下です。

| 項目                    | M3でやる | M3でやらない |
| ----------------------- | -------: | -----------: |
| 15クエリ生成            |        ○ |              |
| 15クエリ逐次実行        |        ○ |              |
| 1クエリ失敗しても継続   |        ○ |              |
| 成功/失敗クエリ数の集計 |        ○ |              |
| Braveレスポンス正規化   |        ○ |              |
| URL完全一致重複排除     |        ○ |              |
| 一部失敗 Exit Code `1`  |        ○ |              |
| 全失敗 Exit Code `4`    |        ○ |              |
| CSV出力                 |          |           M4 |
| Markdown出力            |          |           M5 |
| JSON / run-report       |          |       P1以降 |

要件上も、M3は「クエリ生成、逐次実行、正規化、重複排除」を担当する位置づけになっています。
設計書側でも、M3のタスクは複数クエリ生成、逐次実行、`searchResultNormalizer.ts`、`deduplicationService.ts`、部分失敗、全失敗制御に分解されています。

---

## 2. 推奨アーキテクチャ

M3では、既存のM2-B構成を大きく壊さず、以下のように拡張するのがよいです。

```text
CLI
  ↓
runResearchUseCase
  ↓
buildSearchQueries
  ↓
BraveSearchClient.search を逐次実行
  ↓
searchResultNormalizer
  ↓
deduplicationService
  ↓
ResearchRunResult を返す
  ↓
CLIで結果表示・exitCode反映
```

ポイントは、**CLIに検索制御ロジックを置かないこと** です。

`src/cli/research.ts` は、引き続き以下に限定するのが安全です。

- CLI引数パース
- 入力読み込み
- dry-run表示
- UseCase呼び出し
- 結果表示
- `process.exitCode` 反映

検索の逐次実行、正規化、重複排除、Exit Code判定は `runResearchUseCase.ts` 側に寄せます。

---

## 3. M3で作成・修正するファイル

### 新規作成

```text
src/domain/normalizedSearchResult.ts
src/domain/deduplicationResult.ts
src/domain/researchRunResult.ts
src/services/searchResultNormalizer.ts
src/services/deduplicationService.ts
```

設計書でも `NormalizedSearchResult`、`DeduplicationResult`、`ResearchRunResult` はDTOとして定義候補になっており、`searchResultNormalizer.ts` と `deduplicationService.ts` も責務分担に含まれています。

### 修正

```text
src/application/runResearchUseCase.ts
src/cli/research.ts
```

必要に応じて微修正：

```text
src/domain/searchExecution.ts
src/domain/researchExitCode.ts
```

ただし、`ResearchExitCode` はすでに `SUCCESS = 0`、`PARTIAL_API_FAILURE = 1`、`INPUT_ERROR = 2`、`CONFIG_ERROR = 3`、`ALL_API_FAILURE = 4`、`OUTPUT_ERROR = 5`、`UNEXPECTED_ERROR = 9` が定義済みなので、M3では基本的に追加不要です。

また、`tsconfig.json` は `module` / `moduleResolution` が `NodeNext` なので、M3で追加する相対importも **`.js` 付き** に統一してください。

---

## 4. DTO設計案

### 4.1 `NormalizedSearchResult`

設計書の型に合わせて、M3では以下で確定してよいです。

```ts
export type NormalizedSearchResult = {
  keyword: string;
  platform: string;
  query: string;
  rank: number;
  title: string;
  url: string;
  snippet: string;
  extraSnippets: string[];
  retrievedAt: string;
};
```

M3では、`snippet` と `extraSnippets` を必ず値ありに寄せるのがよいです。

| Brave側               | 正規化後                 |
| --------------------- | ------------------------ |
| `description` あり    | `snippet` に入れる       |
| `description` なし    | `snippet: ""`            |
| `extra_snippets` あり | `extraSnippets` に入れる |
| `extra_snippets` なし | `extraSnippets: []`      |

これにより、M4のCSV出力、M5のMarkdown出力がかなり楽になります。

---

### 4.2 `DeduplicationResult`

```ts
import type { NormalizedSearchResult } from "./normalizedSearchResult.js";

export type DeduplicationResult = {
  results: NormalizedSearchResult[];
  removedCount: number;
  removedUrls: string[];
};
```

M3では **URL完全一致のみ** でよいです。

やらないこと：

- URL末尾 `/` の統一
- クエリパラメータ除去
- `http` / `https` の統一
- タイトル類似判定
- note記事ID単位の判定

P0要件でも、高度な重複判定はP1以降であり、P0はURL完全一致のみです。

---

### 4.3 `ResearchRunResult`

M3時点では、出力ファイル情報はまだ空配列でよいです。

```ts
import type { ResearchExitCode } from "./researchExitCode.js";
import type { SearchQueryExecutionResult } from "./searchExecution.js";
import type { NormalizedSearchResult } from "./normalizedSearchResult.js";
import type { BraveSearchResultItem } from "../adapters/braveSearchClient.js";

export type ResearchRunResult = {
  exitCode: ResearchExitCode;
  queryCount: number;
  executedQueryCount: number;
  succeededQueryCount: number;
  failedQueryCount: number;
  rawResultCount: number;
  normalizedResultCount: number;
  deduplicatedResultCount: number;
  removedDuplicateCount: number;
  removedDuplicateUrls: string[];
  results: NormalizedSearchResult[];
  executionResults: SearchQueryExecutionResult<BraveSearchResultItem>[];
  warnings: string[];
  generatedFiles: string[];
};
```

ただし、domain層から adapter型である `BraveSearchResultItem` へ依存するのが気になる場合は、`ResearchRunResult` を `src/application/runResearchUseCase.ts` 内に置く選択もあります。

私の推奨は以下です。

| 選択肢                                           | 判定 | 理由                                |
| ------------------------------------------------ | ---: | ----------------------------------- |
| `researchRunResult.ts` をdomainに作る            |    ○ | M4/M5でも使い回せる                 |
| `BraveSearchResultItem` を含める                 |    △ | domainがadapter型を知るため少し濁る |
| `executionResults` は成功/失敗サマリーだけにする |    ◎ | domainをきれいに保てる              |

よりきれいにするなら、M3ではこうです。

```ts
export type FailedSearchQuerySummary = {
  query: string;
  failureType: string;
  httpStatus?: number;
  message: string;
};

export type ResearchRunResult = {
  exitCode: ResearchExitCode;
  queryCount: number;
  executedQueryCount: number;
  succeededQueryCount: number;
  failedQueryCount: number;
  rawResultCount: number;
  normalizedResultCount: number;
  deduplicatedResultCount: number;
  removedDuplicateCount: number;
  removedDuplicateUrls: string[];
  results: NormalizedSearchResult[];
  failures: FailedSearchQuerySummary[];
  warnings: string[];
  generatedFiles: string[];
};
```

**こちらを推奨します。**

---

## 5. 実装順序

### Step 1：`NormalizedSearchResult` を作る

```text
src/domain/normalizedSearchResult.ts
```

```ts
export type NormalizedSearchResult = {
  keyword: string;
  platform: string;
  query: string;
  rank: number;
  title: string;
  url: string;
  snippet: string;
  extraSnippets: string[];
  retrievedAt: string;
};
```

---

### Step 2：`searchResultNormalizer.ts` を作る

```text
src/services/searchResultNormalizer.ts
```

役割：

- `BraveSearchResultItem[]` を `NormalizedSearchResult[]` に変換する
- URLなし結果を除外する
- titleなし結果を除外する
- `rank` を1始まりで付与する
- `description` を `snippet` に変換する
- `extra_snippets` を `extraSnippets` に変換する

関数案：

```ts
import type { BraveSearchResultItem } from "../adapters/braveSearchClient.js";
import type { NormalizedSearchResult } from "../domain/normalizedSearchResult.js";
import type { SearchQuery } from "../domain/searchQuery.js";

export function normalizeSearchResults(params: {
  query: SearchQuery;
  items: BraveSearchResultItem[];
  retrievedAt: string;
}): NormalizedSearchResult[] {
  const results: NormalizedSearchResult[] = [];

  for (const [index, item] of params.items.entries()) {
    if (!item.url || !item.title) {
      continue;
    }

    results.push({
      keyword: params.query.keyword,
      platform: params.query.platform.name,
      query: params.query.query,
      rank: index + 1,
      title: item.title,
      url: item.url,
      snippet: item.description ?? "",
      extraSnippets: item.extra_snippets ?? [],
      retrievedAt: params.retrievedAt,
    });
  }

  return results;
}
```

---

### Step 3：`DeduplicationResult` を作る

```text
src/domain/deduplicationResult.ts
```

```ts
import type { NormalizedSearchResult } from "./normalizedSearchResult.js";

export type DeduplicationResult = {
  results: NormalizedSearchResult[];
  removedCount: number;
  removedUrls: string[];
};
```

---

### Step 4：`deduplicationService.ts` を作る

```text
src/services/deduplicationService.ts
```

関数案：

```ts
import type { DeduplicationResult } from "../domain/deduplicationResult.js";
import type { NormalizedSearchResult } from "../domain/normalizedSearchResult.js";

export function deduplicateByExactUrl(
  results: NormalizedSearchResult[],
): DeduplicationResult {
  const seenUrls = new Set<string>();
  const deduplicated: NormalizedSearchResult[] = [];
  const removedUrls: string[] = [];

  for (const result of results) {
    if (seenUrls.has(result.url)) {
      removedUrls.push(result.url);
      continue;
    }

    seenUrls.add(result.url);
    deduplicated.push(result);
  }

  return {
    results: deduplicated,
    removedCount: removedUrls.length,
    removedUrls,
  };
}
```

---

### Step 5：`ResearchRunResult` を作る

```text
src/domain/researchRunResult.ts
```

推奨型：

```ts
import type { ResearchExitCode } from "./researchExitCode.js";
import type { NormalizedSearchResult } from "./normalizedSearchResult.js";
import type { SearchQueryFailureType } from "./searchExecution.js";

export type FailedSearchQuerySummary = {
  query: string;
  failureType: SearchQueryFailureType;
  httpStatus?: number;
  message: string;
};

export type ResearchRunResult = {
  exitCode: ResearchExitCode;
  queryCount: number;
  executedQueryCount: number;
  succeededQueryCount: number;
  failedQueryCount: number;
  rawResultCount: number;
  normalizedResultCount: number;
  deduplicatedResultCount: number;
  removedDuplicateCount: number;
  removedDuplicateUrls: string[];
  results: NormalizedSearchResult[];
  failures: FailedSearchQuerySummary[];
  warnings: string[];
  generatedFiles: string[];
};
```

---

### Step 6：`runResearchUseCase.ts` を複数実行対応にする

現在のM2-Bでは最初の1クエリだけ実行する構造ですが、M3では以下に変えます。

```ts
const queries = buildSearchQueries(input);

for (const query of queries) {
  const executionResult = await client.search(query);

  if (executionResult.status === "failure") {
    failures.push(...);
    continue;
  }

  succeededQueryCount += 1;
  rawResults.push(...executionResult.items);
  normalizedResults.push(
    ...normalizeSearchResults({
      query: executionResult.query,
      items: executionResult.items,
      retrievedAt: executionResult.retrievedAt,
    }),
  );
}

const deduplicationResult = deduplicateByExactUrl(normalizedResults);
```

Exit Code判定は以下。

```ts
if (succeededQueryCount === 0 && failedQueryCount > 0) {
  exitCode = ResearchExitCode.ALL_API_FAILURE;
} else if (failedQueryCount > 0) {
  exitCode = ResearchExitCode.PARTIAL_API_FAILURE;
} else {
  exitCode = ResearchExitCode.SUCCESS;
}
```

0件は成功扱いです。

```text
全クエリ成功 + 結果0件 = SUCCESS 0
一部失敗 + 成功クエリあり = PARTIAL_API_FAILURE 1
全クエリ失敗 = ALL_API_FAILURE 4
```

設計書でも、一部失敗はExit Code `1`、全失敗はExit Code `4` とされています。

---

### Step 7：CLI表示をM3向けに変更する

今の関数名は `printM2BSuccessResult()` / `printM2BFailureResult()` なので、M3で以下へ変更するのが自然です。

```text
printResearchRunResult()
printResearchFailures()
```

M3の標準出力例：

```text
M3 search completed.

Search execution
  Generated query count: 15
  Executed query count: 15
  Succeeded query count: 15
  Failed query count: 0

Results
  Raw item count: 150
  Normalized item count: 148
  Deduplicated item count: 132
  Removed duplicate count: 16

Output
  CSV/Markdown output is skipped in M3.
```

一部失敗時の標準エラー例：

```text
Some Brave Search API requests failed.

Failures
  1. site:note.com 家庭内ルール 仕様書
     type: http_error
     HTTP status: 429
     message: Brave Search API returned HTTP 429.
```

---

## 6. M3での重要な設計判断

### 判断1：逐次実行を維持する

M3では並列実行しない方がよいです。

理由：

- レート制限リスクを抑えられる
- ログの順序が読みやすい
- 失敗箇所の特定がしやすい
- P0の実装範囲に合う

要件でもP0は逐次実行、自動リトライなしの方針です。

---

### 判断2：1クエリ失敗しても止めない

M3では、1件失敗しても残りを続行します。

```text
15クエリ中1件失敗
↓
残り14クエリは実行
↓
成功分を正規化・重複排除
↓
Exit Code 1
```

これにより、M4/M5で「成功分からCSV/Markdownを生成する」方針へ自然につながります。

---

### 判断3：全失敗だけは正常扱いにしない

全クエリ失敗は、検索結果0件とは意味が違います。

| ケース                | 意味                       | Exit Code |
| --------------------- | -------------------------- | --------: |
| 全クエリ成功・結果0件 | 検索したが見つからなかった |         0 |
| 全クエリ失敗          | 検索自体が成立していない   |         4 |

ここは明確に分けるべきです。

---

### 判断4：M3ではファイル出力しない

M3でCSV/Markdownまで入れると、責務が大きくなりすぎます。

M3の完了判定は、あくまで以下で十分です。

- API実行できた
- 正規化できた
- 重複排除できた
- 件数が表示できた
- exit codeが正しい

ファイル出力はM4/M5で分ける方が、実装レビューが楽です。

---

## 7. M3の推奨Exit条件

M3完了判定は以下でよいです。

```text
M3 Exit条件

1. 5キーワード×3媒体で15クエリが生成される
2. 15クエリを逐次実行できる
3. 1クエリが失敗しても残りのクエリを継続できる
4. 成功クエリ数・失敗クエリ数を集計できる
5. Brave Search APIレスポンスを NormalizedSearchResult に変換できる
6. URLなし結果を除外できる
7. titleなし結果を除外できる
8. snippetなし結果を空文字にできる
9. extra_snippetsなし結果を空配列にできる
10. URL完全一致重複を1件に統合できる
11. 重複排除前件数・重複排除後件数を表示できる
12. 全成功時は Exit Code 0
13. 一部失敗時は Exit Code 1
14. 全失敗時は Exit Code 4
15. M3ではCSV/Markdownを出力しない
```

---

## 8. 実装時の注意点

### 注意1：APIキーは絶対に出さない

M2-Bと同じく、以下にはAPIキーを出さないでください。

- 標準出力
- 標準エラー
- エラーメッセージ
- warnings
- 将来のCSV/Markdown

### 注意2：エラーボディ表示は短く制限する

M2-Bで入れた `sanitizeErrorBody()` はM3でも有効です。

ただし、全15クエリ失敗時に長文が大量表示される可能性があるので、CLI表示では以下のどちらかがよいです。

- 各失敗は最大300〜500文字
- 失敗一覧は最大5件まで詳細表示し、残りは件数のみ

M3ではまず全件表示でもよいですが、ログが膨らむ可能性はあります。

### 注意3：`rank` はBraveレスポンス内順位を維持する

重複排除後にrankを振り直さない方がよいです。

理由：

- `rank` は「そのクエリ内での順位」を表すため
- 重複排除後の一覧順位とは意味が違うため

### 注意4：URL重複時は最初の1件を採用する

現在のクエリ生成順は `platforms` 順 × `keywords` 順です。

そのため、重複時は以下の優先順位になります。

```text
入力YAMLの platforms 順
↓
keywords 順
↓
Braveレスポンス順位
```

これはP0では十分妥当です。

### 注意5：`npm run check` で確認する

`package.json` には `typecheck`、`format:check`、`check` が用意されているため、M3実装後は最低限 `npm run check` まで通すのがよいです。

---

## 9. 先に直した方がよい小さな命名

M3に入るタイミングで、CLI表示名だけ直すのがおすすめです。

現在：

```ts
printM2BSuccessResult;
printM2BFailureResult;
```

M3以降：

```ts
printResearchRunResult;
printResearchFailures;
```

M2-B固有名が残ると、M3/M4/M5で混乱しやすくなります。

---

## 10. 実装順の最終提案

おすすめ順はこれです。

```text
1. normalizedSearchResult.ts を作成
2. searchResultNormalizer.ts を作成
3. deduplicationResult.ts を作成
4. deduplicationService.ts を作成
5. researchRunResult.ts を作成
6. runResearchUseCase.ts を複数クエリ逐次実行へ変更
7. exitCode判定を SUCCESS / PARTIAL_API_FAILURE / ALL_API_FAILURE に拡張
8. cli/research.ts の表示関数をM3向けに変更
9. npm run typecheck
10. npm run format
11. npm run check
12. 実APIで通常実行
13. M3実装レポートを作成
```

---

## 次のアクション

まずは **Step 1〜4のドメイン型＋サービス2つ** から実装するのがよいです。
具体的には、次に以下4ファイルのコード案を作る流れを推奨します。

```text
src/domain/normalizedSearchResult.ts
src/domain/deduplicationResult.ts
src/services/searchResultNormalizer.ts
src/services/deduplicationService.ts
```

その後、`runResearchUseCase.ts` の複数実行対応に進むのが一番安全です。

# まとめ / Summary

## 日本語

- M3は、複数クエリ逐次実行、正規化、URL完全一致重複排除、部分失敗/全失敗制御までを対象にするのがよいです。
- CSV/Markdown出力はM4/M5へ残し、M3では標準出力で件数とExit Codeを確認できれば十分です。
- 新規作成は `normalizedSearchResult.ts`、`deduplicationResult.ts`、`researchRunResult.ts`、`searchResultNormalizer.ts`、`deduplicationService.ts` が中心です。
- `runResearchUseCase.ts` は、最初の1クエリだけ実行する構造から、全クエリを逐次実行する構造へ変更します。
- 一部失敗は Exit Code `1`、全失敗は Exit Code `4`、0件は成功扱いの Exit Code `0` にします。

## English

- M3 should cover multiple sequential searches, normalization, exact URL deduplication, and partial/all failure handling.
- CSV and Markdown output should stay in M4 and M5.
- In M3, it is enough to show counts and exit codes in the console.
- Main new files are `normalizedSearchResult.ts`, `deduplicationResult.ts`, `researchRunResult.ts`, `searchResultNormalizer.ts`, and `deduplicationService.ts`.
- `runResearchUseCase.ts` should change from one-query execution to all-query sequential execution.
