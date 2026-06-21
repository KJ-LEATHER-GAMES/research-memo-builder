---
title: Research Memo Builder M2-B 実装レポート
document_id: research-memo-builder-m2-b-implementation-record
status: active
version: 1.0.0
updated: 2026-06-21
project: Research Memo Builder
milestone: M2-B
file_path: docs/implementation/research-memo-builder-m2-b-implementation-record.md
source_documents:
  - docs/implementation/research-memo-builder-m2-a-implementation-record.md
  - docs/requirements/research-memo-builder-p0-requirements.md
  - docs/design/research-memo-builder-p0-design.md
---

# Research Memo Builder M2-B 実装レポート

## 1. 対象マイルストーン

M2-B：`.env` 読み込み + Brave Search API単一検索

## 2. 実装日

2026-06-21

## 3. 実装目的

M2-Bでは、M2-Aで実装した入力YAML読み込み、Zod検証、dry-run、検索クエリ生成を前提に、Brave Search APIへ最初の1クエリを送信できる状態を作ることを目的とした。

M2-Bでは、まだ複数クエリ実行、検索結果正規化、CSV出力、Markdown出力は行わない。

## 4. 実装対象

M2-Bでは、以下のファイルを作成・修正した。

### 4.1 新規作成

- `src/config/env.ts`
- `src/domain/searchExecution.ts`
- `src/adapters/braveSearchClient.ts`
- `src/application/runResearchUseCase.ts`

### 4.2 修正

- `src/cli/research.ts`
- `research/inputs/ats-rule-spec.yaml`

## 5. 実装内容

### 5.1 `src/config/env.ts`

`.env` から `BRAVE_API_KEY` を読み込む処理を実装した。

主な実装内容は以下。

- `dotenv.config()` による `.env` 読み込み
- `BRAVE_API_KEY` の取得
- 未設定・空文字時の `EnvConfigError`
- APIキー値を標準出力・標準エラーに表示しない設計

M2-Bでは、APIキー不備を `EnvConfigError` として表現し、CLI層で Exit Code `3` に変換する方針とした。

### 5.2 `src/domain/searchExecution.ts`

Brave Search APIの1クエリ実行結果を表す型を追加した。

主な型は以下。

- `SearchQueryFailureType`
- `SearchQueryFailure`
- `SearchQueryExecutionResult<TItem>`

`SearchQueryExecutionResult<TItem>` は、成功・失敗を判別できるUnion型とした。

成功時は以下を持つ。

- `status: "success"`
- `query`
- `items`
- `retrievedAt`

失敗時は以下を持つ。

- `status: "failure"`
- `query`
- `failure`
- `retrievedAt`

`TItem` をジェネリックにすることで、domain層がBrave API固有のレスポンス型に直接依存しないようにした。

### 5.3 `src/adapters/braveSearchClient.ts`

Brave Search APIへ1クエリ送信するアダプタを追加した。

主な実装内容は以下。

- Node標準 `fetch` を使用
- Brave Web Search API endpointへGETリクエストを送信
- `X-Subscription-Token` ヘッダーでAPIキーを送信
- `q`
- `count`
- `country`
- `search_lang`
- `ui_lang`
- `extra_snippets`
- HTTPエラー時の `http_error` 化
- ネットワークエラー時の `network_error` 化
- レスポンス形式不正時の `invalid_response` 化
- APIキー値をログ・エラーメッセージに含めない制御

Brave APIレスポンスからM2-Bで扱う最小型として、以下を定義した。

- `BraveSearchResultItem`

  - `title`
  - `url`
  - `description`
  - `extra_snippets`

M2-Bでは、検索結果の正規化はまだ行わない。

### 5.4 HTTPエラー本文の表示

HTTP 422 の原因特定のため、HTTPエラー時にBrave APIのレスポンス本文を安全に読み取る処理を追加した。

追加した処理は以下。

- `readSafeErrorBody(response)`
- `sanitizeErrorBody(text)`

エラーボディは、空白を圧縮し、最大500文字に制限して表示する方針とした。

これにより、APIキーを表示せずに、Brave APIが返すバリデーションエラー内容を確認できるようになった。

### 5.5 `src/application/runResearchUseCase.ts`

M2-B用のUseCaseを追加した。

主な実装内容は以下。

- `ResolvedResearchInput` から検索クエリ一覧を生成
- M2-Bでは最初の1クエリのみ実行
- `.env` から `BRAVE_API_KEY` を読み込み
- `BraveSearchClient` を生成
- 検索成功時に取得件数を返す
- 検索失敗時に `ALL_API_FAILURE` 相当の結果を返す

M2-Bでは、以下はまだ行わない。

- 複数クエリ実行
- 検索結果正規化
- URL重複排除
- CSV出力
- Markdown出力

### 5.6 `src/cli/research.ts`

既存のM2-A版CLIをベースに、M2-B通常実行へ接続した。

主な修正内容は以下。

- M2-Aの `--dry-run` 必須制限を削除
- `--dry-run` 指定時は従来どおりAPIを呼ばない
- `--dry-run` なしの場合のみ `runResearchUseCase()` を呼ぶ
- M2-B成功時に以下を表示

  - 生成クエリ数
  - 実行クエリ数
  - 最初に実行したクエリ
  - 取得件数
  - CSV/Markdownを出力しない旨

- `EnvConfigError` を Exit Code `3` に変換
- API失敗時に以下を表示

  - 対象クエリ
  - failure type
  - HTTP status
  - message

### 5.7 `research/inputs/ats-rule-spec.yaml`

Brave Search APIの `search_lang` 仕様に合わせて、`search.searchLang` を修正した。

修正前は以下。

```yaml
searchLang: ja
```

修正後は以下。

```yaml
searchLang: jp
```

Brave Search APIのHTTP 422レスポンスにより、`search_lang` の許可値として `jp` が必要であることを確認した。

## 6. 発生した問題と対応

### 6.1 TypeScript import拡張子エラー

#### 発生内容

以下のTypeScriptエラーが発生した。

```text
TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'.
```

対象ファイルは以下。

- `src/adapters/braveSearchClient.ts`
- `src/application/runResearchUseCase.ts`
- `src/domain/searchExecution.ts`

#### 原因

既存プロジェクトでは、Node ESM / `node16` または `nodenext` の解決方式に合わせ、相対importに `.js` 拡張子を付ける必要がある。

今回追加したファイルでは、相対importに `.js` が付いていなかった。

#### 対応

相対importをすべて `.js` 付きに修正した。

例：

```ts
import type { SearchQuery } from "./searchQuery.js";
```

#### 結果

`npm run typecheck` が成功した。

### 6.2 APIキー未設定時の確認

#### 発生内容

`.env` の `BRAVE_API_KEY` が未設定の場合、通常実行で以下が表示された。

```text
Config error
BRAVE_API_KEY is required. Please set BRAVE_API_KEY in .env.
```

#### 判定

これは想定どおり。

#### 結果

Exit Code `3` で終了することを確認した。

### 6.3 Brave Search API HTTP 422

#### 発生内容

APIキー設定後、Brave Search APIへリクエストは到達したが、以下のエラーが発生した。

```text
Brave Search API request failed.
Query: site:note.com 家庭内ルール 仕様書
Failure type: http_error
HTTP status: 422
Message: Brave Search API returned HTTP 422.
```

HTTPエラー本文を表示する修正後、レスポンス本文から以下が確認できた。

```text
loc: ["query","search_lang"]
```

#### 原因

入力YAMLでは以下を指定していた。

```yaml
searchLang: ja
```

しかし、Brave Search APIの `search_lang` では `jp` が期待されていた。

#### 対応

`research/inputs/ats-rule-spec.yaml` を以下のように修正した。

```yaml
searchLang: jp
```

#### 結果

Brave Search API単一検索が成功し、取得件数10件を確認した。

## 7. 確認結果

### 7.1 typecheck

実行コマンドは以下。

```bash
npm run typecheck
```

結果は成功。

```text
tsc --noEmit
```

TypeScriptエラーなし。

### 7.2 format

実行コマンドは以下。

```bash
npm run format
```

結果は成功。

Prettierにより対象ファイルが整形された。

### 7.3 check

実行コマンドは以下。

```bash
npm run check
```

結果は成功。

```text
All matched files use Prettier code style!
```

### 7.4 dry-run確認

実行コマンドは以下。

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml --dry-run
```

確認結果は以下。

- Exit Code `0`
- 予定リクエスト数 `15`
- 15件の検索クエリが表示される
- Brave Search APIを呼ばない
- CSVを出力しない
- Markdownを出力しない

### 7.5 APIキー未設定時の確認

実行コマンドは以下。

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml
```

`.env` の `BRAVE_API_KEY` 未設定時、以下が表示された。

```text
Config error
BRAVE_API_KEY is required. Please set BRAVE_API_KEY in .env.
```

Exit Code確認結果は以下。

```text
3
```

### 7.6 APIキー設定時の単一検索確認

実行コマンドは以下。

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml
```

結果は以下。

```text
M2-B single search completed.

Search execution
  Generated query count: 15
  Executed query count: 1
  First query: site:note.com 家庭内ルール 仕様書
  Retrieved item count: 10

CSV/Markdown output is skipped in M2-B.
```

確認できたことは以下。

- 入力YAMLから15件の検索クエリを生成できた
- M2-Bでは最初の1クエリだけ実行された
- Brave Search APIから検索結果10件を取得できた
- CSV/Markdownは出力されなかった
- APIキー実値は標準出力・標準エラーに表示されなかった

## 8. M2-B完了判定

M2-Bは、以下を満たしたため完了とする。

- `.env` から `BRAVE_API_KEY` を読み込める
- `BRAVE_API_KEY` 未設定時にAPIを呼ばず、Exit Code `3` で停止できる
- APIキー値を標準出力・標準エラーに表示しない
- Brave Search APIへ1クエリを送信できる
- 入力YAMLから生成した15クエリのうち、最初の1クエリだけを実行できる
- APIキー設定時に検索結果取得件数を表示できる
- `--dry-run` では従来どおりAPIを呼ばない
- M2-BではCSV/Markdownを出力しない
- `npm run typecheck` が成功する
- `npm run format` が成功する
- `npm run check` が成功する

## 9. 未対応

### 9.1 M3以降で対応するもの

- 複数クエリ実行
- 5キーワード×3媒体の15クエリ逐次実行
- Brave Search APIレスポンスの正規化
- `NormalizedSearchResult` への変換
- URL完全一致による重複排除
- 一部API失敗時の継続制御
- 全API失敗時の Exit Code `4`
- 部分失敗時の Exit Code `1`

### 9.2 M4以降で対応するもの

- `search-results.csv` 出力
- CSVエスケープ
- UTF-8 with BOM出力
- 0件時のヘッダー行のみ出力
- 既存CSVの上書き

### 9.3 M5以降で対応するもの

- `research-memo.md` 出力
- 指定章構成でのMarkdown生成
- 「似たタイトルがあるか」へのタイトル、URL、媒体、キーワード、スニペット出力
- P0注意書き出力
- 0件時のMarkdown出力

### 9.4 設計・要件への反映確認

以下の反映を完了した。

- Brave Search APIの `search_lang` では `jp` を使うこと
- `search.searchLang` のデフォルト値を `ja` ではなく `jp` にすること
- `research/inputs/ats-rule-spec.yaml`
- `src/input/researchInputSchema.ts`
- `docs/requirements/research-memo-builder-p0-requirements.md`
- `docs/design/research-memo-builder-p0-design.md`

## 10. 次アクション

次は、M3：複数キーワード・複数媒体検索へ進む。

M3の推奨実装順は以下。

1. `BraveSearchClient` の単一検索を再利用し、複数クエリを逐次実行する
2. 15クエリを順番に実行できるようにする
3. 1クエリ失敗しても他クエリを継続する
4. 成功クエリ数・失敗クエリ数を集計する
5. Brave Search APIレスポンスを `NormalizedSearchResult` に変換する
6. URL完全一致の重複排除を実装する
7. 一部失敗時は Exit Code `1`
8. 全失敗時は Exit Code `4`
9. M3時点ではCSV/Markdown出力はまだ行わない
