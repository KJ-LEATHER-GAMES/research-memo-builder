---
title: "Research Memo Builder M4 Implementation Report"
status: active
version: 1.0.0
created: 2026-06-22
updated: 2026-06-22
milestone: M4
source_documents:
  - docs/requirements/research-memo-builder-p0-requirements.md
  - docs/design/research-memo-builder-p0-design.md
  - docs/implementation/research-memo-builder-m3-implementation-report.md
  - src/domain/normalizedSearchResult.ts
  - src/domain/researchExitCode.ts
  - src/domain/researchRunResult.ts
  - src/application/runResearchUseCase.ts
  - src/cli/research.ts
  - src/utils/csvEscape.ts
  - src/renderers/csvRenderer.ts
  - src/output/csvResearchResultWriter.ts
---

# Research Memo Builder M4 実装レポート

## 1. 概要

M4では、M3で実装済みの複数クエリ検索・検索結果正規化・URL完全一致重複排除の結果をもとに、CSV出力機能を実装した。

M4の主目的は、重複排除後の `NormalizedSearchResult[]` を、P0要件で定義した固定列のCSVファイルとして出力することである。

出力ファイルは `search-results.csv` とし、UTF-8 with BOMで出力する。これにより、Excel等で開いた場合にも日本語が文字化けしにくい形式とした。

## 2. 実装対象

M4で実装した主な内容は以下のとおり。

- CSVエスケープ処理
- CSVレンダリング処理
- UTF-8 with BOM付きCSVファイル書き込み
- 出力先ディレクトリ作成
- `--out` 指定時の出力先反映
- `generatedFiles` へのCSVファイルパス格納
- CLI表示のM4対応
- CSV出力失敗時の Exit Code `5`
- 一部API失敗時の成功分CSV出力
- 全API失敗時のヘッダーのみCSV出力
- dry-run時のCSV未出力維持

## 3. 追加・修正ファイル

### 3.1 新規追加ファイル

| ファイル                                | 内容                                           |
| --------------------------------------- | ---------------------------------------------- |
| `src/utils/csvEscape.ts`                | CSVセル値のエスケープ処理を追加                |
| `src/renderers/csvRenderer.ts`          | `NormalizedSearchResult[]` からCSV文字列を生成 |
| `src/output/csvResearchResultWriter.ts` | CSVファイルの書き込み処理を追加                |

### 3.2 修正ファイル

| ファイル                                | 内容                                                    |
| --------------------------------------- | ------------------------------------------------------- |
| `src/application/runResearchUseCase.ts` | 重複排除後の結果をCSV出力処理へ接続                     |
| `src/cli/research.ts`                   | M4向けのCLI表示、出力ファイル表示、出力エラー表示に対応 |
| `src/domain/researchExitCode.ts`        | CSV出力失敗用の Exit Code `5` を利用                    |
| `src/domain/researchRunResult.ts`       | `generatedFiles` を通じてCSV出力結果をCLIへ返却         |

## 4. CSV出力仕様

### 4.1 出力ファイル

| 項目             | 仕様                                 |
| ---------------- | ------------------------------------ |
| ファイル名       | `search-results.csv`                 |
| 出力先           | `resolvedInput.output.dir`           |
| `--out` 指定時   | `--out` で指定したディレクトリを優先 |
| 既存ファイル     | 上書き                               |
| 出力ディレクトリ | 存在しない場合は作成                 |
| 文字コード       | UTF-8 with BOM                       |
| 改行コード       | LF                                   |
| dry-run          | CSV出力しない                        |

### 4.2 CSVヘッダー

CSVヘッダーは以下の固定列とした。

```csv
Keyword,Platform,Title,Url,Snippet,ExtraSnippets,Rank,Query,RetrievedAt
```

### 4.3 CSV列マッピング

| CSV列           | `NormalizedSearchResult` | 備考                                 |
| --------------- | ------------------------ | ------------------------------------ |
| `Keyword`       | `keyword`                | 検索キーワード                       |
| `Platform`      | `platform`               | 検索対象媒体名                       |
| `Title`         | `title`                  | 検索結果タイトル                     |
| `Url`           | `url`                    | 検索結果URL                          |
| `Snippet`       | `snippet`                | 検索結果スニペット                   |
| `ExtraSnippets` | `extraSnippets`          | `/` 区切りで1セルに連結              |
| `Rank`          | `rank`                   | Brave Search APIレスポンス内の元順位 |
| `Query`         | `query`                  | 実際に送信した検索クエリ             |
| `RetrievedAt`   | `retrievedAt`            | 取得日時                             |

### 4.4 `ExtraSnippets` の扱い

`extraSnippets` は複数要素を `/` で連結し、CSV上では1セルに格納する。

また、CSVの視認性を保つため、`extraSnippets` 内の改行は半角スペースに置換する。

### 4.5 CSVエスケープ

CSVセル値に以下が含まれる場合は、値全体をダブルクォートで囲む。

- カンマ
- ダブルクォート
- LF
- CR

ダブルクォートは `""` にエスケープする。

## 5. Exit Code 方針

M4時点のExit Code方針は以下のとおり。

| 状態        | Exit Code |
| ----------- | --------: |
| 全成功      |       `0` |
| 一部API失敗 |       `1` |
| 入力不正    |       `2` |
| APIキー不備 |       `3` |
| 全API失敗   |       `4` |
| CSV出力失敗 |       `5` |

CSV出力失敗が発生した場合は、検索処理の成功・失敗状態にかかわらず、最終Exit Codeを `5` とする。

## 6. 確認結果

### 6.1 typecheck / format / check

以下を実行し、すべて成功した。

```bat
npm run typecheck
npm run format
npm run check
```

最終確認でも `npm run check` は成功した。

```text
Checking formatting...
All matched files use Prettier code style!
```

### 6.2 正常系確認

実行コマンド：

```bat
npm run research -- --input research/inputs/ats-rule-spec.yaml
echo %ERRORLEVEL%
```

確認結果：

| 項目                    | 結果 |
| ----------------------- | ---: |
| Generated query count   |   15 |
| Executed query count    |   15 |
| Succeeded query count   |   15 |
| Failed query count      |    0 |
| Raw item count          |  150 |
| Normalized item count   |  150 |
| Deduplicated item count |  138 |
| Removed duplicate count |   12 |
| Exit Code               |    0 |
| CSV出力                 | あり |

出力ファイル：

```text
output\research\ats-rule-spec\search-results.csv
```

判定：OK。

### 6.3 `--out` 指定確認

実行コマンド：

```bat
npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/m4-csv-test
echo %ERRORLEVEL%
```

確認結果：

| 項目                    | 結果 |
| ----------------------- | ---: |
| Generated query count   |   15 |
| Executed query count    |   15 |
| Succeeded query count   |   15 |
| Failed query count      |    0 |
| Raw item count          |  150 |
| Normalized item count   |  150 |
| Deduplicated item count |  138 |
| Removed duplicate count |   12 |
| Exit Code               |    0 |
| CSV出力                 | あり |

出力ファイル：

```text
output\research\m4-csv-test\search-results.csv
```

判定：OK。

### 6.4 dry-run確認

実行コマンド：

```bat
npm run research -- --input research/inputs/ats-rule-spec.yaml --dry-run
echo %ERRORLEVEL%
```

確認結果：

- Brave Search API呼び出しなし
- CSV出力なし
- Markdown出力なし
- Exit Code `0`

出力：

```text
No Brave Search API calls were made.
No CSV or Markdown files were written.
```

判定：OK。

### 6.5 BOM確認

PowerShell互換コマンドでCSV先頭3バイトを確認した。

実行コマンド：

```powershell
$bytes = Get-Content -Path "output\research\m4-csv-test\search-results.csv" -Encoding Byte -TotalCount 3
($bytes | ForEach-Object { $_.ToString("X2") }) -join " "
```

確認結果：

```text
EF BB BF
```

UTF-8 with BOMで出力されていることを確認した。

判定：OK。

### 6.6 出力エラー Exit Code `5` 確認

実行コマンド：

```bat
npm run research -- --input research/inputs/ats-rule-spec.yaml --out package.json
echo %ERRORLEVEL%
```

確認結果：

| 項目                    |              結果 |
| ----------------------- | ----------------: |
| Generated query count   |                15 |
| Executed query count    |                15 |
| Succeeded query count   |                15 |
| Failed query count      |                 0 |
| Raw item count          |               150 |
| Normalized item count   |               150 |
| Deduplicated item count |               139 |
| Removed duplicate count |                11 |
| Generated files         |              None |
| Warning                 | CSV output failed |
| Exit Code               |                 5 |

出力：

```text
M4 search completed, but CSV output failed.

Warnings
  - CSV output failed: Failed to write CSV output: package.json\search-results.csv
```

判定：OK。

### 6.7 一部API失敗時のCSV出力確認

一時フォルト注入により、1クエリのみAPI失敗扱いにして確認した。

実行コマンド：

```bat
set RMB_FORCE_FAILURE_QUERY_INDEX=1
npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/m4-partial-failure
echo %ERRORLEVEL%
set RMB_FORCE_FAILURE_QUERY_INDEX=
```

確認結果：

| 項目                    | 結果 |
| ----------------------- | ---: |
| Generated query count   |   15 |
| Executed query count    |   15 |
| Succeeded query count   |   14 |
| Failed query count      |    1 |
| Raw item count          |  140 |
| Normalized item count   |  140 |
| Deduplicated item count |  132 |
| Removed duplicate count |    8 |
| CSV出力                 | あり |
| CSVデータ行数           |  132 |
| Exit Code               |    1 |

出力ファイル：

```text
output\research\m4-partial-failure\search-results.csv
```

CSV行数確認：

```powershell
$rows = Import-Csv "output\research\m4-partial-failure\search-results.csv"
$rows.Count
```

結果：

```text
132
```

判定：OK。

### 6.8 全API失敗時のCSV出力確認

一時フォルト注入により、全15クエリをAPI失敗扱いにして確認した。

実行コマンド：

```bat
set RMB_FORCE_ALL_FAILURES=1
npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/m4-all-failure
echo %ERRORLEVEL%
set RMB_FORCE_ALL_FAILURES=
```

確認結果：

| 項目                    | 結果 |
| ----------------------- | ---: |
| Generated query count   |   15 |
| Executed query count    |   15 |
| Succeeded query count   |    0 |
| Failed query count      |   15 |
| Raw item count          |    0 |
| Normalized item count   |    0 |
| Deduplicated item count |    0 |
| Removed duplicate count |    0 |
| CSV出力                 | あり |
| CSVデータ行数           |    0 |
| Exit Code               |    4 |

出力ファイル：

```text
output\research\m4-all-failure\search-results.csv
```

CSV内容：

```csv
Keyword,Platform,Title,Url,Snippet,ExtraSnippets,Rank,Query,RetrievedAt
```

CSV行数確認：

```powershell
$rows = Import-Csv "output\research\m4-all-failure\search-results.csv"
$rows.Count
```

結果：

```text
0
```

判定：OK。

### 6.9 0件CSV確認

全API失敗時に、検索結果0件のCSVレンダリングとしてヘッダーのみCSVが出力されることを確認した。

出力内容：

```csv
Keyword,Platform,Title,Url,Snippet,ExtraSnippets,Rank,Query,RetrievedAt
```

判定：OK。

### 6.10 一時フォルト注入コード削除確認

一時フォルト注入コードを削除した後、以下を確認した。

```bat
npm run check
findstr /S /N /I "RMB_FORCE" src\*.ts
```

確認結果：

- `npm run check` 成功
- `findstr /S /N /I "RMB_FORCE" src\*.ts` は出力なし

判定：OK。

### 6.11 フォルト注入削除後の正常復帰確認

実行コマンド：

```bat
npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/m4-final-check
echo %ERRORLEVEL%
```

確認結果：

| 項目                    | 結果 |
| ----------------------- | ---: |
| Generated query count   |   15 |
| Executed query count    |   15 |
| Succeeded query count   |   15 |
| Failed query count      |    0 |
| Raw item count          |  150 |
| Normalized item count   |  150 |
| Deduplicated item count |  140 |
| Removed duplicate count |   10 |
| Exit Code               |    0 |
| CSV出力                 | あり |

出力ファイル：

```text
output\research\m4-final-check\search-results.csv
```

添付された `search-results.csv` について、以下を確認した。

| 項目       |                                                                      結果 |
| ---------- | ------------------------------------------------------------------------: |
| BOM        |                                                                `EF BB BF` |
| 総行数     |                                                                       141 |
| データ行数 |                                                                       140 |
| 列数       |                                                                         9 |
| ヘッダー   | `Keyword,Platform,Title,Url,Snippet,ExtraSnippets,Rank,Query,RetrievedAt` |

CLI表示の `Deduplicated item count: 140` とCSVデータ行数140が一致している。

判定：OK。

## 7. 決定事項

M4で確定した仕様は以下のとおり。

- CSVファイル名は `search-results.csv` とする。
- CSV出力先は `output.dir` とする。
- CLIで `--out` が指定された場合は、`--out` の値を優先する。
- CSVはUTF-8 with BOMで出力する。
- CSVヘッダーは以下の固定列とする。

```csv
Keyword,Platform,Title,Url,Snippet,ExtraSnippets,Rank,Query,RetrievedAt
```

- `extraSnippets` は `/` 区切りで1セルに格納する。
- `extraSnippets` 内の改行は半角スペースに置換する。
- CSVは既存ファイルを確認なしで上書きする。
- 出力ディレクトリが存在しない場合は作成する。
- 0件時はヘッダーのみCSVを出力する。
- 一部API失敗時は成功分のみCSV出力し、Exit Codeは `1` とする。
- 全API失敗時はヘッダーのみCSV出力し、Exit Codeは `4` とする。
- CSV出力失敗時は Exit Code `5` とする。
- dry-run時はCSVを出力しない。
- M4ではMarkdown出力は行わない。

## 8. M4完了判定

M4は完了と判定する。

理由は以下のとおり。

- 正常系でCSV出力できた。
- `--out` 指定時に指定先へCSV出力できた。
- dry-runでCSVが出力されないことを確認した。
- CSVがUTF-8 with BOMで出力されることを確認した。
- CSVヘッダーが固定列順で出力されることを確認した。
- 重複排除後件数とCSVデータ行数が一致することを確認した。
- 出力エラー時に Exit Code `5` となることを確認した。
- 一部API失敗時に成功分CSVが出力され、Exit Code `1` となることを確認した。
- 全API失敗時にヘッダーのみCSVが出力され、Exit Code `4` となることを確認した。
- 一時フォルト注入コード削除後に `npm run check` が成功した。
- `findstr /S /N /I "RMB_FORCE" src\*.ts` で一時フォルト注入コードの残存がないことを確認した。
- フォルト注入削除後の通常実行で正常復帰を確認した。

## 9. 未対応事項

M4完了時点で、以下は未対応である。

### 9.1 M5：Markdownメモ出力

- Markdownメモレンダラーの実装
- Markdownファイル書き込み処理
- Markdown章構成の実装
- 検索条件サマリー出力
- 類似タイトル一覧出力
- スニペット出力
- P0注意書きの出力
- 一部失敗時のMarkdown注意書き
- 全失敗時のMarkdown出力方針の最終確認

### 9.2 P0対象外出力フラグの制御

以下のP0対象外出力は、P0では未実装または入力エラー扱いとする方針のため、実装対象外である。

- `output.notion`
- `output.googleDocs`
- `output.pdf`

### 9.3 テスト自動化

M4では手動確認で実装検証を行った。
CSVエスケープ、CSVレンダリング、CSV書き込み、Exit Code分岐については、将来的にユニットテスト化する余地がある。

## 10. 次アクション

次はM5として、Markdownメモ出力仕様の確定と実装に進む。

推奨順は以下のとおり。

1. Markdown出力仕様を再確認する。
2. Markdown章構成を確定する。
3. `NormalizedSearchResult[]` からMarkdownメモへ変換するレンダラーを作成する。
4. Markdownファイル書き込み処理を作成する。
5. `runResearchUseCase.ts` にMarkdown出力を接続する。
6. CLI表示にMarkdown生成ファイルを追加する。
7. 正常系・0件・一部API失敗・全API失敗を確認する。
8. M5実装レポートを作成する。
