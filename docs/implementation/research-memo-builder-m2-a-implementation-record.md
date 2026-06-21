---
title: Research Memo Builder M2-A 実装記録
document_id: research-memo-builder-m2-a-implementation-record
status: active
version: 1.0.0
updated: 2026-06-21
project: Research Memo Builder
milestone: M2-A
file_path: docs/implementation/research-memo-builder-m2-a-implementation-record.md
source_documents:
  - docs/research/research-memo-builder-p0-requirements.md
  - docs/research/research-memo-builder-p0-design.md
---

# Research Memo Builder M2-A 実装記録

## 1. 対象マイルストーン

M2-A：入力YAML読み込み + Zod検証 + dry-run

## 2. 実装日

2026-06-21

## 3. 実装対象

M2-Aでは、以下の11ファイルを実装・修正対象とした。

- `src/domain/researchInput.ts`
- `src/domain/searchPlatform.ts`
- `src/domain/searchOptions.ts`
- `src/domain/outputOptions.ts`
- `src/domain/searchQuery.ts`
- `src/domain/researchExitCode.ts`
- `src/input/researchInputSchema.ts`
- `src/input/researchInputLoader.ts`
- `src/services/searchQueryBuilder.ts`
- `src/utils/safePath.ts`
- `src/cli/research.ts`

## 4. 実装内容

### 4.1 Domain DTO / 型定義

`src/domain/*` に、M2-Aで必要なDTO・型定義を追加した。

主な追加対象は以下。

- `RawResearchInput`
- `ResolvedResearchInput`
- `ArticleType`
- `SearchPlatform`
- `SearchOptions`
- `OutputOptions`
- `SearchQuery`
- `ResearchExitCode`

### 4.2 入力YAML読み込み

`src/input/researchInputLoader.ts` に、YAMLファイル読み込み処理を追加した。

実装内容は以下。

- `fs/promises.readFile` によるファイル読み込み
- `yaml.parse` によるYAMLパース
- 入力ファイル未存在時のエラー化
- YAMLパース失敗時のエラー化
- 読み込み失敗を `ResearchInputLoadError` として扱う処理

### 4.3 Zodによる入力検証

`src/input/researchInputSchema.ts` に、Zodによる入力検証処理を追加した。

主な検証内容は以下。

- `topic` の空文字チェック
- `articleType` のbooleanチェック
- `articleType` 3項目のうち最低1つが `true` であることのチェック
- `keywords` の1〜5件チェック
- `keywords` 各要素の空文字チェック
- `platforms` の1〜3件チェック
- `platforms[].name` の空文字チェック
- `platforms[].site` のドメイン形式チェック
- `platforms[].site` の重複チェック
- `search` 配下のデフォルト補完
- `output.csv` / `output.markdownMemo` のP0必須チェック
- `output.json` / `output.runReport` / `output.chatgptPrompt` が `true` の場合の入力不正化

### 4.4 search配下のデフォルト補完

入力YAMLの `search` 配下は省略可能とし、未指定時は以下のP0既定値を補完するようにした。

| 項目                   |  既定値 |
| ---------------------- | ------: |
| `search.countPerQuery` |    `10` |
| `search.country`       |    `JP` |
| `search.searchLang`    |    `ja` |
| `search.uiLang`        | `ja-JP` |
| `search.extraSnippets` |  `true` |

実装上は、Zodの `.default({})` ではなく、以下の方針を採用した。

```ts
z.preprocess((value) => value ?? {}, schema);
```

理由は、`.default({})` では最終出力型と一致せず、TypeScript上の型エラーが発生したためである。

### 4.5 検索クエリ生成

`src/services/searchQueryBuilder.ts` に、検索クエリ生成処理を追加した。

生成ルールは以下。

```text
site:{platform.site} {keyword}
```

生成順は以下とした。

```text
platforms順 × keywords順
```

5キーワード × 3媒体の場合、15クエリが生成されることを確認した。

### 4.6 安全な相対パス判定

`src/utils/safePath.ts` に、出力先として安全な相対パスかを判定する処理を追加した。

不正とする条件は以下。

- 空文字
- null文字
- Unix絶対パス
- Windows絶対パス
- `../` を含むパス

`./output/...` のようなカレントディレクトリ起点の相対パスは許可する方針とする。

### 4.7 CLI接続

`src/cli/research.ts` をM2-A用に接続した。

対応したCLI引数は以下。

- `--input`
- `--out`
- `--dry-run`
- `--help`

P0対象外として拒否するCLI引数は以下。

- `--use-cache`
- `--json`
- `--run-report`
- `--chatgpt-prompt`

`--dry-run` 指定時は、以下を実行する。

1. CLI引数パース
2. 入力YAML読み込み
3. Zodによる入力検証
4. `search` 配下のデフォルト補完
5. 検索クエリ生成
6. 予定リクエスト数表示
7. 出力予定ディレクトリ表示
8. 生成クエリ一覧表示

`--dry-run` 指定時は、以下を行わない。

- Brave Search API呼び出し
- CSV出力
- Markdown出力

## 5. 確認結果

### 5.1 実行コマンド確認

| 確認           | コマンド                                                                                                   | 結果        |
| -------------- | ---------------------------------------------------------------------------------------------------------- | ----------- |
| format         | `npm run format`                                                                                           | OK          |
| typecheck      | `npm run typecheck`                                                                                        | OK          |
| check          | `npm run check`                                                                                            | OK          |
| help           | `npm run research -- --help`                                                                               | OK          |
| inputなし      | `npm run research -- --dry-run`                                                                            | Exit Code 2 |
| 正常dry-run    | `npm run research -- --input research/inputs/ats-rule-spec.yaml --dry-run`                                 | Exit Code 0 |
| `--out` 上書き | `npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/tmp-check --dry-run` | OK          |
| `--out` 不正   | `npm run research -- --input research/inputs/ats-rule-spec.yaml --out ../tmp --dry-run`                    | Input error |

### 5.2 正常dry-run確認

正常dry-runでは、以下を確認した。

- `topic` が表示されること
- `articleType` が表示されること
- `search` 設定が表示されること
- 出力予定ディレクトリが表示されること
- 予定リクエスト数 `15` が表示されること
- 15件の検索クエリが表示されること
- Brave Search APIを呼ばないこと
- CSVを出力しないこと
- Markdownを出力しないこと
- Exit Code `0` で終了すること

### 5.3 `--input` なしの異常系確認

実行コマンドは以下。

```bash
npm run research -- --dry-run
```

結果は以下。

- `Input error` が表示される
- `--input is required` が表示される
- Exit Code `2` で終了する
- Brave Search APIを呼ばない
- CSV/Markdownを出力しない

### 5.4 `search` 省略時の補完確認

`research/inputs/ats-rule-spec.yaml` から `search:` を一時的に削除し、以下が補完されることを確認した。

| 項目                   |  補完値 |
| ---------------------- | ------: |
| `search.countPerQuery` |    `10` |
| `search.country`       |    `JP` |
| `search.searchLang`    |    `ja` |
| `search.uiLang`        | `ja-JP` |
| `search.extraSnippets` |  `true` |

### 5.5 P0対象外出力フラグの異常系確認

`output.json: true` を指定した場合、入力不正として停止することを確認した。

表示例は以下。

```text
Research input validation failed.
- output.json: output.json must be false in P0
```

### 5.6 `--out` 上書き確認

実行コマンドは以下。

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/tmp-check --dry-run
```

結果は以下。

```text
Planned output dir: output/research/tmp-check
```

`--out` が入力YAMLの `output.dir` より優先されることを確認した。

### 5.7 `--out` 不正確認

実行コマンドは以下。

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml --out ../tmp --dry-run
```

結果は以下。

- `Input error` が表示される
- `--out is invalid: use a relative path without absolute path notation or '../'` が表示される
- Exit Code `2` で終了する
- Brave Search APIを呼ばない
- CSV/Markdownを出力しない

## 6. 発生した問題と対応

### 6.1 TypeScript undefined判定

#### 発生内容

`src/cli/research.ts` で、以下のTypeScriptエラーが発生した。

- `argv[index]` が `undefined` の可能性あり
- `cliArgs.input` が `string | undefined` のまま扱われている

#### 対応

以下の方針で修正した。

- `argv[index]` 取得後に `current === undefined` を明示チェックする
- `run()` 内で `inputPath` の存在を再チェックする
- `undefined` の可能性を排除した後に処理を進める

#### 結果

`npm run typecheck` が成功することを確認した。

### 6.2 Zod default指定

#### 発生内容

`src/input/researchInputSchema.ts` で、Zodの `.default({})` が最終出力型と一致せず、型エラーが発生した。

#### 対応

`searchOptionsSchema` では `.default({})` を使わず、以下の方針に変更した。

```ts
z.preprocess((value) => value ?? {}, schema);
```

#### 結果

`search` 配下が省略された場合でも、P0既定値を補完できるようになった。

## 7. 仕様上の注意

### 7.1 M2-AではAPIを呼ばない

M2-Aは、入力YAML読み込み、Zod検証、dry-runまでを対象とする。

そのため、M2-AではBrave Search APIを呼び出さない。

### 7.2 M2-AではCSV/Markdownを出力しない

M2-Aのdry-runでは、CSV/Markdownの出力予定は確認するが、実ファイルは生成しない。

CSV出力はM4、Markdown出力はM5で扱う。

### 7.3 `--out` の安全ルール

`--out` はP0正式仕様として扱う。

`--out` が指定された場合は、入力YAMLの `output.dir` より優先する。

不正とする条件は以下。

- 空文字
- null文字
- Unix絶対パス
- Windows絶対パス
- `../` を含むパス

許可する例は以下。

```text
output/research/tmp-check
./output/research/tmp-check
```

### 7.4 P0対象外フラグの扱い

P0では、以下の出力フラグは省略可能とする。

- `output.json`
- `output.runReport`
- `output.chatgptPrompt`

ただし、`true` が指定された場合は入力不正として停止する。

## 8. 未対応

### 8.1 M2-Bで対応するもの

- `.env` 読み込み
- `BRAVE_API_KEY` 検証
- APIキー未設定時の Exit Code `3`
- Brave Search API単一検索
- APIキー値を標準出力・標準エラーに表示しない制御
- 最初の1クエリの取得件数表示

### 8.2 M3以降で対応するもの

- 複数クエリ実行
- Brave Search APIレスポンスの正規化
- `NormalizedSearchResult` への変換
- URL完全一致による重複排除
- 一部API失敗時の継続制御
- 全API失敗時の Exit Code `4`

### 8.3 M4以降で対応するもの

- `search-results.csv` 出力
- CSVエスケープ
- UTF-8 with BOM出力
- 0件時のヘッダー行のみ出力
- 既存CSVの上書き

### 8.4 M5以降で対応するもの

- `research-memo.md` 出力
- 指定章構成でのMarkdown生成
- 「似たタイトルがあるか」へのタイトル、URL、媒体、キーワード、スニペット出力
- P0注意書き出力
- 0件時のMarkdown出力

### 8.5 P1以降で対応するもの

- JSON出力
- run-report出力
- ChatGPT分析プロンプト出力
- キャッシュ
- 高度な重複判定
- LLM API連携
- Mnemosyne連携

## 9. 次アクション

M2-B：`.env` 読み込み + Brave Search API単一検索へ進む。

M2-Bの推奨実装順は以下。

1. `src/config/env.ts` を作成する

   - `.env` 読み込み
   - `BRAVE_API_KEY` 検証
   - APIキー値をログに出さない

2. `src/domain/searchExecution.ts` を作成する

   - `SearchQueryExecutionResult`
   - `SearchQueryFailure`

3. `src/adapters/braveSearchClient.ts` を作成する

   - Node標準 `fetch` を使用する
   - Brave Search APIへ1クエリ送信する
   - レスポンス最小型を定義する

4. `src/application/runResearchUseCase.ts` を作成する

   - M2-Bでは最初の1クエリだけ実行する

5. `src/cli/research.ts` を修正する

   - `--dry-run` は従来どおりAPIを呼ばない
   - dry-runなしの場合はM2-B通常実行へ接続する

6. APIキー未設定時の Exit Code `3` を確認する

7. APIキー設定時に、1キーワード×1媒体の検索結果取得件数を表示する

## 10. M2-A完了判定

M2-Aは、以下を満たしたため完了とする。

- 入力YAMLを読み込める
- Zodで入力検証できる
- `search` 配下を省略してもP0既定値を補完できる
- P0対象外出力フラグが `true` の場合、入力不正にできる
- 5キーワード×3媒体から15クエリを生成できる
- `--dry-run` で予定リクエスト数と検索クエリ一覧を確認できる
- `--dry-run` ではBrave Search APIを呼ばない
- `--dry-run` ではCSV/Markdownを出力しない
- `--input` 未指定時に Exit Code `2` で終了できる
- `--out` で出力先を上書きできる
- 不正な `--out` を入力不正として扱える
- `npm run format` が成功する
- `npm run typecheck` が成功する
- `npm run check` が成功する
