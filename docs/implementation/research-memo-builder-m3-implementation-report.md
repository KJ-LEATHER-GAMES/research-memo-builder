---

title: Research Memo Builder M3 実装レポート
document_id: research-memo-builder-m3-implementation-report
status: active
version: 1.0.0
updated: 2026-06-21
project: Research Memo Builder
milestone: M3
file_path: docs/implementation/research-memo-builder-m3-implementation-report.md
source_documents:

* docs/requirements/research-memo-builder-p0-requirements.md
* docs/design/research-memo-builder-p0-design.md
* docs/implementation/research-memo-builder-m2-b-implementation-record.md
* docs/implementation/M3-planning.md

---

# Research Memo Builder M3 実装レポート

## 1. このドキュメントの目的

このドキュメントは、Research Memo Builder の M3 実装結果を記録するための実装レポートである。

M3では、M2-Bで実装した「Brave Search API単一検索」を拡張し、複数キーワード・複数媒体に対する検索実行、検索結果の正規化、URL完全一致による重複排除、部分失敗・全失敗時のExit Code制御を実装した。

このレポートでは、以下を記録する。

- M3実装対象
- 追加・修正ファイル
- 正常系確認結果
- dry-run確認結果
- 一部失敗 Exit Code `1` 確認結果
- 全失敗 Exit Code `4` 確認結果
- CSV/Markdown未出力確認
- 一時フォルト注入の扱い
- M3完了判定
- M4以降の未対応事項

---

## 2. M3実装対象

M3の実装対象は、複数キーワード・複数媒体検索の実行制御である。

M2-B時点では、生成された検索クエリのうち最初の1件だけをBrave Search APIへ送信していた。
M3では、生成された全クエリを逐次実行し、成功分の検索結果を内部標準形式へ正規化したうえで、URL完全一致による重複排除を行う。

### 2.1 M3で実装したこと

- 5キーワード × 3媒体 = 15クエリの逐次実行
- 各クエリの成功/失敗集計
- 一部クエリ失敗時の継続実行
- Brave Search APIレスポンスの正規化
- URLなし/titleなし検索結果の除外
- `snippet` なし時の空文字補完
- `extra_snippets` なし時の空配列補完
- URL完全一致による重複排除
- 重複排除前後の件数表示
- 一部失敗時の Exit Code `1`
- 全失敗時の Exit Code `4`
- M3時点ではCSV/Markdownを出力しない制御
- CLI表示のM3対応

### 2.2 M3で実装しないこと

以下はM3の対象外とした。

- CSV出力
- Markdownメモ出力
- JSON出力
- run-report出力
- ChatGPTプロンプト出力
- キャッシュ利用
- 自動リトライ
- 並列検索
- 高度なURL正規化
- タイトル類似判定
- 検索結果URLへのHTTPアクセス

---

## 3. 追加・修正ファイル

### 3.1 追加ファイル

M3では、検索結果の正規化・重複排除・実行結果整理のため、以下のファイルを追加した。

| ファイル                                 | 目的                                                             |
| ---------------------------------------- | ---------------------------------------------------------------- |
| `src/domain/normalizedSearchResult.ts`   | Brave Search APIレスポンスを内部で扱う標準検索結果型を定義する   |
| `src/domain/deduplicationResult.ts`      | 重複排除結果の戻り値型を定義する                                 |
| `src/domain/researchRunResult.ts`        | M3以降の検索実行結果をCLIへ返すための型を定義する                |
| `src/services/searchResultNormalizer.ts` | Brave Search APIレスポンスを `NormalizedSearchResult` に変換する |
| `src/services/deduplicationService.ts`   | URL完全一致による重複排除を行う                                  |

### 3.2 修正ファイル

| ファイル                                | 修正内容                                                               |
| --------------------------------------- | ---------------------------------------------------------------------- |
| `src/application/runResearchUseCase.ts` | 全クエリ逐次実行、成功/失敗集計、正規化、重複排除、Exit Code判定を実装 |
| `src/cli/research.ts`                   | M3向けのCLI表示に変更し、一部失敗時も成功分の件数を表示するよう修正    |

### 3.3 削除した不要ファイル

実装途中で以下の不要ファイルが存在していたため、削除した。

| ファイル                             | 判断                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| `src/domain/deduplicationService.ts` | service層に置くべき責務のため不要。`src/services/deduplicationService.ts` を正とする |

削除後、`npm run check` を実行し、エラーがないことを確認した。

---

## 4. 実装内容詳細

### 4.1 複数クエリ逐次実行

`runResearchUseCase.ts` で、`buildSearchQueries()` により生成された全クエリを `for...of` で逐次実行するようにした。

M3では並列実行は行わない。
理由は以下である。

- レート制限リスクを抑えるため
- ログ順序を読みやすくするため
- 失敗クエリの特定を容易にするため
- P0ではシンプルな逐次実行で十分なため

### 4.2 成功/失敗集計

各クエリ実行結果に応じて、以下を集計する。

- `queryCount`
- `executedQueryCount`
- `succeededQueryCount`
- `failedQueryCount`
- `rawResultCount`
- `normalizedResultCount`
- `deduplicatedResultCount`
- `removedDuplicateCount`

### 4.3 正規化

`searchResultNormalizer.ts` により、Brave Search APIの検索結果を `NormalizedSearchResult` に変換する。

正規化方針は以下。

| Brave Search API側    | 正規化後               |
| --------------------- | ---------------------- |
| `title` あり          | `title` に設定         |
| `title` なし/空文字   | 対象外として除外       |
| `url` あり            | `url` に設定           |
| `url` なし/空文字     | 対象外として除外       |
| `description` あり    | `snippet` に設定       |
| `description` なし    | `snippet: ""`          |
| `extra_snippets` あり | `extraSnippets` に設定 |
| `extra_snippets` なし | `extraSnippets: []`    |

`rank` はBrave Search APIレスポンス内の順位を維持する。
URLなし/titleなし結果を除外しても、rankの再採番は行わない。

### 4.4 URL完全一致重複排除

`deduplicationService.ts` により、正規化後の検索結果をURL完全一致で重複排除する。

M3では以下のみを対象とする。

- 完全に同じURL文字列の重複排除
- 最初に取得した結果を採用
- 2回目以降に出現した同一URLを除外
- 除外件数を `removedDuplicateCount` として返す
- 除外URL一覧を `removedDuplicateUrls` として返す

以下はM3では行わない。

- 末尾スラッシュの正規化
- クエリパラメータ除去
- `http` / `https` の統一
- タイトル類似判定
- 本文類似判定
- note記事ID単位での重複判定

### 4.5 Exit Code判定

M3では、API実行結果に応じて以下のExit Codeを返す。

| 状態             | Exit Code | 意味                                    |
| ---------------- | --------: | --------------------------------------- |
| 全成功           |       `0` | すべてのAPI実行が成功                   |
| 一部失敗         |       `1` | 1件以上失敗したが、成功クエリも存在する |
| 全失敗           |       `4` | すべてのAPI実行が失敗                   |
| 入力エラー       |       `2` | 入力YAML、CLI引数、パス指定などのエラー |
| 設定エラー       |       `3` | APIキー未設定などの設定エラー           |
| 出力エラー       |       `5` | M4以降の出力処理エラー                  |
| 予期しないエラー |       `9` | 想定外の例外                            |

M3で新たに重点確認したのは、Exit Code `1` と Exit Code `4` である。

---

## 5. 静的確認結果

### 5.1 TypeScript型チェック

実行コマンド:

```bash
npm run typecheck
```

結果:

```text
tsc --noEmit
```

エラーなし。

### 5.2 format

実行コマンド:

```bash
npm run format
```

結果:

```text
prettier --write "src/**/*.ts" "research/**/*.yaml" "docs/**/*.md" "*.json"
```

エラーなし。

### 5.3 check

実行コマンド:

```bash
npm run check
```

結果:

```text
npm run typecheck && npm run format:check
```

`typecheck` 成功。
`format:check` も以下の結果で成功した。

```text
All matched files use Prettier code style!
```

---

## 6. 正常系確認結果

### 6.1 実行コマンド

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml
```

### 6.2 実行結果

```text
M3 search completed.

Search execution
  Generated query count: 15
  Executed query count: 15
  Succeeded query count: 15
  Failed query count: 0

Results
  Raw item count: 150
  Normalized item count: 150
  Deduplicated item count: 139
  Removed duplicate count: 11

Output
  CSV/Markdown output is skipped in M3.
```

### 6.3 Exit Code確認

実行コマンド:

```bat
echo %ERRORLEVEL%
```

結果:

```text
0
```

### 6.4 判定

正常系は期待どおりである。

| 観点                   |   結果 | 判定 |
| ---------------------- | -----: | ---- |
| 15クエリが生成されるか |     15 | OK   |
| 15クエリが実行されるか |     15 | OK   |
| 成功数                 |     15 | OK   |
| 失敗数                 |      0 | OK   |
| raw件数                |    150 | OK   |
| 正規化件数             |    150 | OK   |
| 重複排除後件数         |    139 | OK   |
| 重複排除件数           |     11 | OK   |
| Exit Code              |      0 | OK   |
| CSV/Markdown未出力     | 未出力 | OK   |

件数整合性も以下の通り成立している。

```text
rawResultCount >= normalizedResultCount >= deduplicatedResultCount
150 >= 150 >= 139

normalizedResultCount - deduplicatedResultCount = removedDuplicateCount
150 - 139 = 11
```

---

## 7. dry-run確認結果

### 7.1 実行コマンド

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml --dry-run
```

### 7.2 実行結果

```text
Research Memo Builder dry-run completed.

Input
  File: research/inputs/ats-rule-spec.yaml
  Topic: 家庭内ルールを書き出したら、仕様書になっていた話
  Article types: devDiary

Search options
  countPerQuery: 10
  country: JP
  searchLang: jp
  uiLang: ja-JP
  extraSnippets: true

Output
  Planned output dir: output/research/ats-rule-spec
  CSV output: skipped in dry-run
  Markdown output: skipped in dry-run

Planned requests
  15
```

生成クエリは以下の構成である。

```text
3媒体 × 5キーワード = 15クエリ
```

媒体:

- note
- Qiita
- Zenn

キーワード:

- 家庭内ルール 仕様書
- 家庭内ルール 要件定義
- 家庭内 ポイント制度 設計
- 子育て 仕組み化 note
- 家庭内ルール プロダクト設計

dry-runでは、以下も表示された。

```text
No Brave Search API calls were made.
No CSV or Markdown files were written.
```

### 7.3 判定

dry-runは期待どおりである。

| 観点                              | 判定 |
| --------------------------------- | ---: |
| 入力YAMLを読み込める              |   OK |
| `searchLang: jp` が反映されている |   OK |
| 15クエリが生成される              |   OK |
| API呼び出しが行われない           |   OK |
| CSV/Markdownが出力されない        |   OK |

---

## 8. 一部失敗 Exit Code `1` 確認結果

### 8.1 確認方法

一部失敗は通常の入力YAMLだけでは再現しにくいため、一時フォルト注入により、1クエリだけ強制的にAPI失敗扱いにした。

使用した環境変数:

```bat
set RMB_FORCE_FAILURE_QUERY_INDEX=1
```

### 8.2 実行コマンド

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml
```

### 8.3 実行結果

```text
M3 search completed with partial API failures.

Search execution
  Generated query count: 15
  Executed query count: 15
  Succeeded query count: 14
  Failed query count: 1

Results
  Raw item count: 140
  Normalized item count: 140
  Deduplicated item count: 131
  Removed duplicate count: 9

Output
  CSV/Markdown output is skipped in M3.

Failed API requests
  1. [note] site:note.com 家庭内ルール 仕様書
     keyword: 家庭内ルール 仕様書
     type: http_error
     HTTP status: 599
     message: Forced API failure for M3 verification.
```

### 8.4 Exit Code確認

```bat
echo %ERRORLEVEL%
```

結果:

```text
1
```

### 8.5 環境変数解除

```bat
set RMB_FORCE_FAILURE_QUERY_INDEX=
```

### 8.6 判定

一部失敗時の挙動は期待どおりである。

| 観点                    |   結果 | 判定 |
| ----------------------- | -----: | ---- |
| Generated query count   |     15 | OK   |
| Executed query count    |     15 | OK   |
| Succeeded query count   |     14 | OK   |
| Failed query count      |      1 | OK   |
| Raw item count          |    140 | OK   |
| Normalized item count   |    140 | OK   |
| Deduplicated item count |    131 | OK   |
| Removed duplicate count |      9 | OK   |
| 失敗詳細表示            |   あり | OK   |
| Exit Code               |      1 | OK   |
| CSV/Markdown未出力      | 未出力 | OK   |

件数整合性も以下の通り成立している。

```text
rawResultCount >= normalizedResultCount >= deduplicatedResultCount
140 >= 140 >= 131

normalizedResultCount - deduplicatedResultCount = removedDuplicateCount
140 - 131 = 9
```

一部失敗時でも、失敗した1クエリで処理を停止せず、残り14クエリの成功分を正規化・重複排除できている。

---

## 9. 全失敗 Exit Code `4` 確認結果

### 9.1 確認方法

全失敗は、一時フォルト注入により15クエリすべてを強制的にAPI失敗扱いにして確認した。

使用した環境変数:

```bat
set RMB_FORCE_ALL_FAILURES=1
```

無効なAPIキーによる全失敗確認は実施していない。
M3で確認したい主目的は、UseCase側の成功/失敗集計、全失敗判定、Exit Code `4` の返却であるため、フォルト注入による確認を採用した。

### 9.2 実行コマンド

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml
```

### 9.3 実行結果

```text
M3 search failed because all API requests failed.

Search execution
  Generated query count: 15
  Executed query count: 15
  Succeeded query count: 0
  Failed query count: 15

Results
  Raw item count: 0
  Normalized item count: 0
  Deduplicated item count: 0
  Removed duplicate count: 0

Output
  CSV/Markdown output is skipped in M3.
```

失敗詳細として、note / Qiita / Zenn の各5キーワード、合計15クエリがすべて表示された。

代表例:

```text
Failed API requests
  1. [note] site:note.com 家庭内ルール 仕様書
     keyword: 家庭内ルール 仕様書
     type: http_error
     HTTP status: 599
     message: Forced API failure for M3 verification.
```

### 9.4 Exit Code確認

```bat
echo %ERRORLEVEL%
```

結果:

```text
4
```

### 9.5 環境変数解除

```bat
set RMB_FORCE_ALL_FAILURES=
```

### 9.6 判定

全失敗時の挙動は期待どおりである。

| 観点                    |   結果 | 判定 |
| ----------------------- | -----: | ---- |
| Generated query count   |     15 | OK   |
| Executed query count    |     15 | OK   |
| Succeeded query count   |      0 | OK   |
| Failed query count      |     15 | OK   |
| Raw item count          |      0 | OK   |
| Normalized item count   |      0 | OK   |
| Deduplicated item count |      0 | OK   |
| Removed duplicate count |      0 | OK   |
| 失敗詳細表示            |   15件 | OK   |
| Exit Code               |      4 | OK   |
| CSV/Markdown未出力      | 未出力 | OK   |

全クエリ失敗時に、検索結果0件の正常終了とは区別され、Exit Code `4` が返ることを確認した。

---

## 10. CSV/Markdown未出力確認

M3ではCSV/Markdown出力は対象外である。

以下の各ケースで、`output/research` フォルダへのファイル生成がないことを確認した。

| ケース   | CSV/Markdown出力 | 判定 |
| -------- | ---------------: | ---- |
| 正常系   |             なし | OK   |
| dry-run  |             なし | OK   |
| 一部失敗 |             なし | OK   |
| 全失敗   |             なし | OK   |

CLI表示でも、各ケースで以下が出力された。

```text
CSV/Markdown output is skipped in M3.
```

また、dry-runでは以下が出力された。

```text
No CSV or Markdown files were written.
```

---

## 11. 一時フォルト注入の扱い

一部失敗と全失敗を確認するため、一時的にフォルト注入用の環境変数を利用した。

使用した環境変数:

| 環境変数                        | 用途                              |
| ------------------------------- | --------------------------------- |
| `RMB_FORCE_FAILURE_QUERY_INDEX` | 指定した1クエリのみ失敗扱いにする |
| `RMB_FORCE_ALL_FAILURES`        | 全クエリを失敗扱いにする          |

確認後、これらの環境変数は解除した。

```bat
set RMB_FORCE_FAILURE_QUERY_INDEX=
set RMB_FORCE_ALL_FAILURES=
```

また、一時フォルト注入コードは確認後に削除した。

削除後、通常実行で正常系に戻ることを確認した。

### 11.1 フォルト注入削除後の正常系確認

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml
```

結果:

```text
M3 search completed.

Search execution
  Generated query count: 15
  Executed query count: 15
  Succeeded query count: 15
  Failed query count: 0

Results
  Raw item count: 150
  Normalized item count: 150
  Deduplicated item count: 138
  Removed duplicate count: 12

Output
  CSV/Markdown output is skipped in M3.
```

一時フォルト注入削除後も、15クエリ全成功、CSV/Markdown未出力の正常系へ戻っている。

なお、正常系の `Deduplicated item count` と `Removed duplicate count` は、Brave Search APIの検索結果変動により実行タイミングで変わる可能性がある。
今回も、初回正常系では `139 / 11`、フォルト注入削除後の正常系では `138 / 12` となったが、件数整合性は成立しているため問題なしと判断した。

---

## 12. M3完了判定

M3は完了と判定する。

理由は以下である。

- `npm run typecheck` が成功した
- `npm run format` が成功した
- `npm run check` が成功した
- 5キーワード × 3媒体 = 15クエリが生成される
- 15クエリを逐次実行できる
- 正常系で15クエリすべて成功する
- 最大150件の検索結果を取得できる
- Brave Search APIレスポンスを `NormalizedSearchResult` に正規化できる
- URL完全一致で重複排除できる
- 重複排除前後の件数整合性が取れている
- dry-runではAPIを呼ばない
- dry-runではファイル出力しない
- 一部失敗時に処理を継続できる
- 一部失敗時に成功分の件数を表示できる
- 一部失敗時に失敗詳細を表示できる
- 一部失敗時に Exit Code `1` を返せる
- 全失敗時に Exit Code `4` を返せる
- 正常系・dry-run・一部失敗・全失敗のすべてでCSV/Markdownを出力しない
- 一時フォルト注入コードは確認後に削除し、正常系へ戻ることを確認した

### M3完了判定文

M3では、複数キーワード・複数媒体に対する15クエリ逐次実行、成功/失敗集計、検索結果正規化、URL完全一致重複排除、一部失敗時Exit Code `1`、全失敗時Exit Code `4` を確認した。
また、M3対象外であるCSV/Markdown出力が行われないことも確認した。
以上により、M3は完了と判定する。

---

## 13. M4以降の未対応事項

### 13.1 M4：CSV出力

M4では、M3で得た `NormalizedSearchResult` をCSVへ出力する。

未対応事項:

- CSV出力サービスの作成
- CSVヘッダー定義
- UTF-8 with BOM対応
- CSVエスケープ
- `extraSnippets` のCSV表現
- 0件時のヘッダーのみCSV出力
- 既存ファイル上書き方針の実装
- 出力失敗時の Exit Code `5`
- `--out` 指定時の出力先反映
- 一部失敗時に成功分のみCSV出力するかの最終確認

想定ファイル:

- `src/services/csvEscape.ts`
- `src/services/csvRenderer.ts`
- `src/output/csvResearchResultWriter.ts`

### 13.2 M5：Markdownメモ出力

M5では、検索結果をnote記事リサーチ用のMarkdownメモへ出力する。

未対応事項:

- Markdownメモレンダラーの作成
- Markdownエスケープ
- 指定章構成の実装
- 検索条件サマリーの出力
- 類似タイトル一覧の出力
- スニペット出力
- P0注意書きの出力
- 0件時Markdown出力
- 一部失敗時の注意書き表示
- 全失敗時のMarkdown出力方針確認
- 出力失敗時の Exit Code `5`

想定ファイル:

- `src/services/markdownEscape.ts`
- `src/services/markdownResearchMemoRenderer.ts`
- `src/output/markdownResearchMemoWriter.ts`

### 13.3 M4/M5共通：出力制御

未対応事項:

- `output.csv` が `true` の場合のみCSV出力
- `output.markdownMemo` が `true` の場合のみMarkdown出力
- P0対象外出力フラグが `true` の場合の入力エラー制御
- `generatedFiles` への出力ファイルパス格納
- 出力先ディレクトリ作成
- 出力ファイル上書き
- 出力エラー時の安全なエラーメッセージ表示

### 13.4 P1以降

P1以降の候補として以下を残す。

- JSON出力
- run-report出力
- ChatGPTプロンプト出力
- キャッシュ利用
- 自動リトライ
- レート制限時の待機
- 並列検索
- URL正規化強化
- タイトル類似判定
- 本文取得
- 検索結果URLへのHTTPアクセス
- 画像・OGP取得
- note記事化支援テンプレート生成

---

## 14. 次アクション

次は M4：CSV出力に進む。

推奨順は以下。

1. CSV出力仕様を要件定義書・設計書で再確認する
2. `NormalizedSearchResult` からCSV行へのマッピングを決める
3. CSVヘッダーを固定する
4. `csvEscape.ts` を作成する
5. `csvRenderer.ts` を作成する
6. ファイル出力処理を作成する
7. `runResearchUseCase.ts` にCSV出力を接続する
8. `src/cli/research.ts` に生成ファイル表示を追加する
9. 正常系・0件・一部失敗・出力エラーを確認する
