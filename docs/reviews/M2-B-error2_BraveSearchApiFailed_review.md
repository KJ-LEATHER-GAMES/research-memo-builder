# 実行結果

Brave Search API request failed.となりました。何が原因でしょうか？

```bash
C:\Users\monsi\AppProjects\research_memo_builder>npm run typecheck

> research-memo-builder@0.1.0 typecheck
> tsc --noEmit


C:\Users\monsi\AppProjects\research_memo_builder>npm run format

> research-memo-builder@0.1.0 format
> prettier --write "src/**/*.ts" "research/**/*.yaml" "docs/**/*.md" "*.json"

src/adapters/braveSearchClient.ts 38ms (unchanged)
src/application/runResearchUseCase.ts 5ms (unchanged)
src/cli/research.ts 17ms (unchanged)
src/config/env.ts 2ms (unchanged)
src/domain/outputOptions.ts 1ms (unchanged)
src/domain/researchExitCode.ts 1ms (unchanged)
src/domain/researchInput.ts 1ms (unchanged)
src/domain/searchExecution.ts 2ms (unchanged)
src/domain/searchOptions.ts 1ms (unchanged)
src/domain/searchPlatform.ts 1ms (unchanged)
src/domain/searchQuery.ts 1ms (unchanged)
src/input/researchInputLoader.ts 3ms (unchanged)
src/input/researchInputSchema.ts 13ms (unchanged)
src/services/searchQueryBuilder.ts 2ms (unchanged)
src/utils/safePath.ts 2ms (unchanged)
research/inputs/ats-rule-spec.yaml 10ms (unchanged)
docs/conversation_summary/conversation_summary-001.md 61ms (unchanged)
docs/conversation_summary/conversation_summary-002.md 26ms (unchanged)
docs/conversation_summary/conversation_summary-003.md 39ms (unchanged)
docs/conversation_summary/conversation_summary-004.md 28ms (unchanged)
docs/design/research-memo-builder-p0-design.md 82ms (unchanged)
docs/implementation/research-memo-builder-m2-a-implementation-record.md 22ms (unchanged)
docs/memo/initial_requirement.md 9ms (unchanged)
docs/memo/Zod.md 26ms (unchanged)
docs/proposal/proposal_ver.0.0.1.md 36ms (unchanged)
docs/proposal/proposal_ver.0.0.2.md 44ms (unchanged)
docs/proposal/research-memo-builder_proposal.md 46ms (unchanged)
docs/requirements/research-memo-builder-p0-requirements_Ver.0.0.1.md 35ms (unchanged)
docs/requirements/research-memo-builder-p0-requirements.md 53ms (unchanged)
docs/reviews/design_ver.0.1.0_review.md 15ms (unchanged)
docs/reviews/design_ver.0.1.0-draft.2.md 17ms (unchanged)
docs/reviews/M2-A-error1_review.md 18ms (unchanged)
docs/reviews/M2-A-implementation-record_review.md 11ms (unchanged)
docs/reviews/M2-A-result1_review.md 18ms (unchanged)
docs/reviews/M2-A-result2_review.md 25ms (unchanged)
docs/reviews/M2-B-error1_review.md 9ms
docs/reviews/proposal_ver.0.0.1_review.md 20ms (unchanged)
docs/reviews/research-memo-builder-p0-requirements_Ver.0.0.1_review.md 26ms (unchanged)
docs/reviews/research-memo-builder-p0-requirements_Ver.0.1.0_review.md 15ms (unchanged)
package-lock.json 4ms (unchanged)
package.json 0ms (unchanged)
tsconfig.json 1ms (unchanged)

C:\Users\monsi\AppProjects\research_memo_builder>npm run check

> research-memo-builder@0.1.0 check
> npm run typecheck && npm run format:check


> research-memo-builder@0.1.0 typecheck
> tsc --noEmit


> research-memo-builder@0.1.0 format:check
> prettier --check "src/**/*.ts" "research/**/*.yaml" "docs/**/*.md" "*.json"

Checking formatting...
All matched files use Prettier code style!

C:\Users\monsi\AppProjects\research_memo_builder>npm run research -- --input research/inputs/ats-rule-spec.yaml --dry-run

> research-memo-builder@0.1.0 research
> tsx src/cli/research.ts --input research/inputs/ats-rule-spec.yaml --dry-run

Research Memo Builder dry-run completed.

Input
  File: research/inputs/ats-rule-spec.yaml
  Topic: 家庭内ルールを書き出したら、仕様書になっていた話
  Article types: devDiary

Search options
  countPerQuery: 10
  country: JP
  searchLang: ja
  uiLang: ja-JP
  extraSnippets: true

Output
  Planned output dir: output/research/ats-rule-spec
  CSV output: skipped in dry-run
  Markdown output: skipped in dry-run

Planned requests
  15

Generated queries
  1. [note] site:note.com 家庭内ルール 仕様書 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
  2. [note] site:note.com 家庭内ルール 要件定義 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
  3. [note] site:note.com 家庭内 ポイント制度 設計 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
  4. [note] site:note.com 子育て 仕組み化 note (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
  5. [note] site:note.com 家庭内ルール プロダクト設計 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
  6. [Qiita] site:qiita.com 家庭内ルール 仕様書 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
  7. [Qiita] site:qiita.com 家庭内ルール 要件定義 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
  8. [Qiita] site:qiita.com 家庭内 ポイント制度 設計 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
  9. [Qiita] site:qiita.com 子育て 仕組み化 note (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
  10. [Qiita] site:qiita.com 家庭内ルール プロダクト設計 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
  11. [Zenn] site:zenn.dev 家庭内ルール 仕様書 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
  12. [Zenn] site:zenn.dev 家庭内ルール 要件定義 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
  13. [Zenn] site:zenn.dev 家庭内 ポイント制度 設計 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
  14. [Zenn] site:zenn.dev 子育て 仕組み化 note (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
  15. [Zenn] site:zenn.dev 家庭内ルール プロダクト設計 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)

No Brave Search API calls were made.
No CSV or Markdown files were written.

C:\Users\monsi\AppProjects\research_memo_builder>npm run research -- --input research/inputs/ats-rule-spec.yaml

> research-memo-builder@0.1.0 research
> tsx src/cli/research.ts --input research/inputs/ats-rule-spec.yaml

Config error
BRAVE_API_KEY is required. Please set BRAVE_API_KEY in .env.

C:\Users\monsi\AppProjects\research_memo_builder>echo %ERRORLEVEL%
3

C:\Users\monsi\AppProjects\research_memo_builder>npm run research -- --input research/inputs/ats-rule-spec.yaml

> research-memo-builder@0.1.0 research
> tsx src/cli/research.ts --input research/inputs/ats-rule-spec.yaml

Brave Search API request failed.
Query: site:note.com 家庭内ルール 仕様書
Failure type: http_error
HTTP status: 422
Message: Brave Search API returned HTTP 422.
```

# 結論

`Brave Search API request failed.` の直接原因は、Brave Search API が **HTTP 422 Unprocessable Entity** を返していることです。

HTTP 422 は、通信失敗ではなく、**リクエストはAPIに届いたが、送ったパラメータのどれかがAPI仕様に合っていない** という系統のエラーです。

今回のログではここまで成功しています。

| 確認項目                      |       結果 |
| ----------------------------- | ---------: |
| `typecheck`                   |         OK |
| `format`                      |         OK |
| `check`                       |         OK |
| `dry-run`                     |         OK |
| APIキー未設定時 Exit Code `3` |         OK |
| APIキー設定後のAPI到達        |         OK |
| Brave Search APIレスポンス    | HTTP `422` |

つまり、**APIキー読み込みやCLI接続は成功しています。**
問題は `braveSearchClient.ts` が送っている **クエリパラメータ** 側にある可能性が高いです。

---

# 公式仕様から見た確認ポイント

Brave Web Search API は `GET /res/v1/web/search` を使い、`q` は必須です。`q` は空文字不可、最大400文字・50語までです。([Brave][1])

また、`count` は `1`〜`20` が仕様範囲です。今回の `count=10` は範囲内です。([Brave][1])

Brave API側は `country`、`search_lang`、`ui_lang`、`extra_snippets` をクエリパラメータとして受け付けます。([Brave][1])
一方で、Brave APIは 422 を正式なレスポンスとして定義しています。つまり、パラメータ形式が合わない場合に今回のような結果になります。([Brave][1])

---

# 最も疑わしい原因

今回送っている値は以下です。

```text
q=site:note.com 家庭内ルール 仕様書
count=10
country=JP
search_lang=ja
ui_lang=ja-JP
extra_snippets=true
```

このうち、疑わしい順に並べると以下です。

## 1. `ui_lang=ja-JP`

最有力候補です。

Brave APIの `ui_lang` は enum、つまり許可値リストの中から選ぶ形式です。仕様に合わない値を送ると 422 になります。([Brave][1])

ただし、今のログではBrave APIのエラーボディを捨てているため、**本当に `ui_lang` が原因かはまだ確定できません。**

## 2. `search_lang=ja`

これも候補です。

Brave APIの `search_lang` も enum です。([Brave][1])
公式ページの表示上、全候補が展開されていないため、`ja` が実際に通るかはレスポンスボディを見ないと確定できません。

## 3. `extra_snippets=true`

可能性は低めですが候補です。

`extra_snippets` は boolean パラメータです。([Brave][1])
`URLSearchParams` で `true` 文字列として渡すのは一般的には妥当ですが、API側が厳密に解釈している場合は確認対象になります。

---

# まずやるべき修正

今の `braveSearchClient.ts` は、HTTP 422 の本文を読んでいません。

そのため、原因が

```text
ui_lang が不正
search_lang が不正
extra_snippets が不正
q が不正
```

のどれか判断できません。

まずは **HTTPエラー時のレスポンスボディを安全に表示**するように修正してください。APIキーはレスポンス本文には通常含まれませんが、念のため長さ制限とサニタイズを入れます。

---

# `src/adapters/braveSearchClient.ts` 修正案

`if (!response.ok)` の部分を差し替えてください。

## 修正前

```ts
if (!response.ok) {
  return {
    status: "failure",
    query,
    retrievedAt,
    failure: {
      type: "http_error",
      httpStatus: response.status,
      message: `Brave Search API returned HTTP ${response.status}.`,
    },
  };
}
```

## 修正後

```ts
if (!response.ok) {
  const errorBody = await readSafeErrorBody(response);

  return {
    status: "failure",
    query,
    retrievedAt,
    failure: {
      type: "http_error",
      httpStatus: response.status,
      message:
        errorBody.length > 0
          ? `Brave Search API returned HTTP ${response.status}. Response body: ${errorBody}`
          : `Brave Search API returned HTTP ${response.status}.`,
    },
  };
}
```

同じファイルの下部に、以下の関数を追加してください。

```ts
async function readSafeErrorBody(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return sanitizeErrorBody(text);
  } catch {
    return "";
  }
}

function sanitizeErrorBody(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 500);
}
```

---

# 追加で入れてよいヘッダー

公式のcurl例では `Accept-Encoding: gzip` も付いています。([Brave][1])
必須とは限りませんが、公式例に寄せるなら追加してよいです。

```ts
headers: {
  Accept: "application/json",
  "Accept-Encoding": "gzip",
  "X-Subscription-Token": this.apiKey,
},
```

---

# 修正後の検証手順

## 1. 静的確認

```bash
npm run typecheck
npm run format
npm run check
```

期待結果：

```text
エラーなし
```

## 2. 通常実行

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml
```

次は、以下のような詳細が出るはずです。

```text
Brave Search API request failed.
Query: site:note.com 家庭内ルール 仕様書
Failure type: http_error
HTTP status: 422
Message: Brave Search API returned HTTP 422. Response body: ...
```

ここで `Response body` の中に、原因の項目名が出る可能性が高いです。

例：

```text
loc: ["query", "ui_lang"]
```

または

```text
loc: ["query", "search_lang"]
```

のような形です。

---

# 暫定回避策

原因を早く切り分けるなら、`braveSearchClient.ts` で一時的に送信パラメータを最小化してください。

## 最小リクエスト版

```ts
url.searchParams.set("q", query.query);
url.searchParams.set("count", String(query.count));
```

一時的に以下をコメントアウトします。

```ts
// url.searchParams.set("country", query.country);
// url.searchParams.set("search_lang", query.searchLang);
// url.searchParams.set("ui_lang", query.uiLang);
// url.searchParams.set("extra_snippets", String(query.extraSnippets));
```

これで成功するなら、原因は追加パラメータ4つのどれかです。

その後、1つずつ戻します。

```text
1. country
2. search_lang
3. ui_lang
4. extra_snippets
```

この順で戻すと、どのパラメータで422になるか特定できます。

---

# 私の推定

現時点の最有力は **`ui_lang=ja-JP` または `search_lang=ja` のenum不一致**です。

ただし、これはまだ推定です。
確定するには、HTTP 422 のレスポンスボディを表示する修正が必要です。

---

# 次のアクション

まず `braveSearchClient.ts` に **HTTPエラー本文の表示**を追加してください。
その後、再実行して `Response body` を確認します。そこに出た `loc` と `msg` を見れば、修正対象を確定できます。

# まとめ / Summary

## 日本語

- `typecheck / format / check / dry-run / Exit Code 3` はすべてOKです。
- APIキー設定後はBrave APIに到達しています。
- HTTP 422 は、送信パラメータ不正の可能性が高いです。
- 最有力候補は `ui_lang` または `search_lang` です。
- まずHTTPエラーのレスポンス本文を表示して、原因項目を特定してください。

## English

- `typecheck`, `format`, `check`, `dry-run`, and Exit Code `3` are OK.
- With the API key set, the request reaches Brave API.
- HTTP 422 likely means an invalid request parameter.
- The most likely cause is `ui_lang` or `search_lang`.
- First, print the HTTP error response body to identify the exact field.

[1]: https://api-dashboard.search.brave.com/api-reference/web/search/get "Brave Search - API"
