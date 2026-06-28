---

title: research-memo-builder M5 Implementation Report
status: active
version: 1.0.0
created_at: 2026-06-28
updated_at: 2026-06-28
milestone: M5
scope: Markdown research memo output
------------------------------------

# research-memo-builder M5 Implementation Report

## 1. 概要

M5では、`research_memo_builder` のP0出力として、既存のCSV出力に加えてMarkdown形式のリサーチメモ出力を実装した。

M4時点では、検索結果の取得・正規化・重複排除・CSV出力までを対象としていた。M5では、重複排除後の検索結果をもとに、note記事作成前の人間レビューに使うための `research-memo.md` を生成する機能を追加した。

M5で生成するMarkdownは、最終記事ではなく、既存記事調査のための一次整理メモである。本文取得、記事内容の要約、有料部分の確認、価格の正確な判定はP0対象外とし、Brave Search APIから取得できるタイトル、URL、スニペット、追加スニペットのみを使用する。

M5完了時点で、以下を確認済みである。

* 正常系でCSVとMarkdownの両方が生成されること
* 一部API失敗時に成功分のみでCSVとMarkdownが生成され、Exit Code `1` になること
* 全API失敗時に空CSVと空Markdownメモが生成され、Exit Code `4` になること
* CSV出力失敗、Markdown出力失敗、両方失敗時にExit Code `5` になること
* MarkdownがUTF-8 without BOM、LFで出力されること
* 一時的な障害注入コードが最終的に削除されていること

## 2. 実装内容

### 2.1 追加・更新した主なファイル

M5で主に扱ったファイルは以下である。

| ファイル                                             | 内容                                |
| ------------------------------------------------ | --------------------------------- |
| `src/utils/markdownEscape.ts`                    | Markdownインライン文字列用のエスケープ処理を追加      |
| `src/renderers/markdownResearchMemoRenderer.ts`  | `research-memo.md` の本文レンダリング処理を追加 |
| `src/output/markdownResearchMemoWriter.ts`       | Markdownファイル書き込み処理を追加             |
| `src/application/runResearchUseCase.ts`          | CSV出力に加えてMarkdown出力を接続            |
| `src/cli/research.ts`                            | M5向けにCLI表示を更新                     |
| `docs/design/research-memo-builder-p0-design.md` | M5 Markdown出力仕様の設計元               |

### 2.2 Markdownエスケープ処理

`src/utils/markdownEscape.ts` を追加し、Markdown内で使用する文字列を安全に表示するためのユーティリティを実装した。

主な方針は以下。

* `null` / `undefined` は空文字として扱う
* 改行はスペースへ変換する
* 連続するスペース・タブは単一スペースへ正規化する
* Markdown上で構文崩れにつながりやすい文字をエスケープする
* `-` はインライン文字列では原則エスケープ不要とし、最終的に過剰エスケープ対象から除外した

これにより、以下のような表示が過剰にエスケープされないようにした。

```md
- Output Dir: output/research/m5-final-check-2
- UI Lang: ja-JP
- Generated At: 2026-06-27T22:09:42.469Z
```

### 2.3 Markdownレンダラー

`src/renderers/markdownResearchMemoRenderer.ts` を追加し、重複排除後の検索結果から `research-memo.md` を生成する処理を実装した。

主な出力章は以下。

```md
# 既存記事リサーチメモ

## 対象記事候補
## 検索条件
## 1. 検索したキーワード
## 2. 似たタイトルがあるか
## 3. どんな切り口が多いか
## 4. 無料部分で何を約束しているか
## 5. 価格帯はいくらか
## 6. 自分ならどこで差別化できるか
## 7. 記事化判断
## 8. 次に作るなら
## P0生成メモ
```

検索結果は、以下の単位でグルーピングして表示する。

```md
### {Platform} / {Keyword}

1. [{Title}]({Url})
   - Rank: {Rank}
   - Snippet: {Snippet}
   - ExtraSnippets: {ExtraSnippets}
```

並び順は以下とした。

1. 入力で指定されたplatform順
2. 入力で指定されたkeyword順
3. rank昇順

### 2.4 Markdown writer

`src/output/markdownResearchMemoWriter.ts` を追加し、Markdownファイルを書き込む処理を実装した。

主な仕様は以下。

| 項目       | 内容                                                 |
| -------- | -------------------------------------------------- |
| ファイル名    | `research-memo.md`                                 |
| 出力先      | `resolvedInput.output.dir`。CLIの `--out` 指定時はその値を優先 |
| エンコーディング | UTF-8 without BOM                                  |
| 改行コード    | LF                                                 |
| 既存ファイル   | 上書き                                                |
| dry-run  | 出力しない                                              |
| 書き込み失敗時  | Exit Code `5` の対象                                  |

### 2.5 UseCase接続

`src/application/runResearchUseCase.ts` にMarkdown出力処理を接続した。

M5時点の出力順序は以下。

1. 検索クエリ生成
2. Brave Search API実行
3. 検索結果正規化
4. URL完全一致による重複排除
5. CSV出力
6. Markdown出力
7. `generatedFiles` / `warnings` / `exitCode` を返却

出力失敗時は、対象の出力だけwarningに追加し、最終的なExit Codeを `ResearchExitCode.OUTPUT_ERROR = 5` にする。

CSVとMarkdownは独立しているため、一方が失敗しても、もう一方の出力は可能な限り実行する。

### 2.6 CLI表示更新

`src/cli/research.ts` をM5向けに更新した。

M4時点の以下の文言は削除した。

```text
M4 search and CSV output completed.
Markdown output is skipped in M4.
```

M5では、CSVとMarkdownの生成結果を個別に表示する。

正常時の表示例は以下。

```text
M5 search and research outputs completed.

Output
  CSV output: generated
  Markdown memo output: generated
  Generated files:
    - output\research\m5-final-check-2\search-results.csv
    - output\research\m5-final-check-2\research-memo.md
```

出力失敗時は以下のように表示する。

```text
M5 search completed, but one or more output files failed.

Output
  CSV output: not generated
  Markdown memo output: generated

Warnings
  - CSV output failed: Forced CSV output failure
```

## 3. Markdown出力仕様

### 3.1 位置づけ

`research-memo.md` は、note記事作成前のリサーチメモであり、最終記事ではない。

M5のMarkdownは、以下を目的とする。

* 既存記事タイトルの確認
* 検索キーワードごとの競合候補の整理
* 記事化前に人間が見るべき論点の提示
* P0の制約を明示したレビュー用メモの生成

### 3.2 使用する情報

Markdown生成に使う情報は以下。

| 情報             | 使用            |
| -------------- | ------------- |
| topic          | 使用する          |
| articleType    | 使用する          |
| keywords       | 使用する          |
| platforms      | 使用する          |
| search options | 使用する          |
| title          | 使用する          |
| url            | 使用する          |
| snippet        | 使用する          |
| extraSnippets  | 使用する          |
| rank           | 使用する          |
| query          | 使用する          |
| retrievedAt    | 間接的に実行情報として扱う |

### 3.3 P0対象外

M5では以下を行わない。

* 検索結果URLへのHTTPアクセス
* 記事本文の取得
* 有料部分の取得
* 価格の正確な取得
* AIによる本文要約
* 競合記事の内容評価
* note記事本文の自動生成

Markdown内にも以下の注意書きを出力する。

```md
> このメモは検索結果のタイトル・URL・スニペットをもとにしたP0下書きです。  
> 記事本文、有料部分、正確な価格情報は取得していません。  
> 切り口、無料部分の約束、価格帯は人間レビューで確認してください。
```

### 3.4 0件時メッセージ

検索結果0件時は、状況に応じて以下を表示する。

| 状況          | メッセージ                                 |
| ----------- | ------------------------------------- |
| 正常に検索したが0件  | `検索結果候補はありませんでした。`                    |
| 一部成功したが候補0件 | `成功した検索クエリからは検索結果候補が生成されませんでした。`      |
| すべて失敗       | `すべての検索クエリが失敗したため、検索結果候補は生成されませんでした。` |

## 4. CLI表示更新

M5では、CLI表示をCSV単独前提から、CSV / Markdownの複数出力前提に変更した。

### 4.1 正常系

```text
M5 search and research outputs completed.
```

### 4.2 一部API失敗

```text
M5 search completed with partial API failures. Research outputs were generated from succeeded results when possible.
```

### 4.3 全API失敗

```text
M5 search failed because all API requests failed. Empty research outputs were generated when possible.
```

### 4.4 出力失敗

```text
M5 search completed, but one or more output files failed.
```

### 4.5 出力状態表示

M5では、以下のようにCSVとMarkdownの生成状態を個別に表示する。

```text
Output
  CSV output: generated
  Markdown memo output: generated
```

また、`generatedFiles` に含まれるファイルパスを表示する。

```text
Generated files:
  - output\research\m5-final-check-2\search-results.csv
  - output\research\m5-final-check-2\research-memo.md
```

## 5. 確認結果

M5で実施した確認は以下。

| 区分                 | 内容                                  | 結果 |
| ------------------ | ----------------------------------- | -- |
| 静的チェック             | `npm run typecheck`                 | OK |
| フォーマット             | `npm run format`                    | OK |
| 総合チェック             | `npm run check`                     | OK |
| 正常系                | CSV / Markdown両方生成                  | OK |
| 一部API失敗            | 成功分からCSV / Markdown生成、Exit Code `1` | OK |
| 全API失敗             | 空CSV / 空Markdownメモ生成、Exit Code `4`  | OK |
| CSV出力失敗            | Markdownのみ生成、Exit Code `5`          | OK |
| Markdown出力失敗       | CSVのみ生成、Exit Code `5`               | OK |
| CSV / Markdown両方失敗 | 生成ファイルなし、Exit Code `5`              | OK |
| BOM確認              | MarkdownがUTF-8 without BOM          | OK |
| 改行コード確認            | MarkdownがLF                         | OK |
| 障害注入コード削除          | `findstr RMB_FORCE` 出力なし            | OK |

## 6. 正常系確認

### 6.1 実行コマンド

```bat
npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/m5-final-check-2
echo %ERRORLEVEL%
```

### 6.2 実行結果

```text
M5 search and research outputs completed.

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
  CSV output: generated
  Markdown memo output: generated
  Generated files:
    - output\research\m5-final-check-2\search-results.csv
    - output\research\m5-final-check-2\research-memo.md
```

Exit Codeは `0` だった。

### 6.3 生成ファイル

```text
search-results.csv
research-memo.md
```

### 6.4 件数整合

| 対象                          |  件数 |
| --------------------------- | --: |
| CLI Deduplicated item count | 139 |
| CSV行数                       | 139 |
| Markdownリンク行数               | 139 |

### 6.5 Markdown形式確認

以下を確認した。

* `# 既存記事リサーチメモ` から始まる
* 固定章構成が出力されている
* 15グループ分の検索結果見出しが出力されている
* `research-memo.md` はUTF-8 without BOM
* 改行コードはLF
* `-` の過剰エスケープは解消済み
* `## 2. 似たタイトルがあるか` 直後の空行過多は解消済み

## 7. 準正常系確認

### 7.1 一部API失敗

一時的な障害注入により、Qiita向けクエリ5件を失敗させた。

#### 実行結果

```text
M5 search completed with partial API failures. Research outputs were generated from succeeded results when possible.

Search execution
  Generated query count: 15
  Executed query count: 15
  Succeeded query count: 10
  Failed query count: 5

Results
  Raw item count: 100
  Normalized item count: 100
  Deduplicated item count: 92
  Removed duplicate count: 8

Output
  CSV output: generated
  Markdown memo output: generated
```

Exit Codeは `1` だった。

#### 確認結果

| 項目                              | 結果 |
| ------------------------------- | -: |
| CSV行数                           | 92 |
| Markdownリンク行数                   | 92 |
| Markdown内 Exit Code             |  1 |
| Markdown内 Succeeded Query Count | 10 |
| Markdown内 Failed Query Count    |  5 |
| UTF-8 without BOM               | OK |
| LF                              | OK |

### 7.2 全API失敗

一時的な障害注入により、15クエリすべてを失敗させた。

#### 実行結果

```text
M5 search failed because all API requests failed. Empty research outputs were generated when possible.

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
  CSV output: generated
  Markdown memo output: generated
```

Exit Codeは `4` だった。

#### 確認結果

| 項目                                |   結果 |
| --------------------------------- | ---: |
| CSV行数                             |    0 |
| Markdownリンク行数                     |    0 |
| Markdown内 Exit Code               |    4 |
| Markdown内 Succeeded Query Count   |    0 |
| Markdown内 Failed Query Count      |   15 |
| Result Count Before Deduplication |    0 |
| Result Count After Deduplication  |    0 |
| 全失敗メッセージ                          | 出力あり |
| UTF-8 without BOM                 |   OK |
| LF                                |   OK |

Markdownには以下のメッセージが出力された。

```text
すべての検索クエリが失敗したため、検索結果候補は生成されませんでした。
```

## 8. 出力失敗系確認

### 8.1 CSV出力失敗

CSV writerに一時的な障害注入を行い、CSV出力のみを失敗させた。

#### 実行結果

```text
M5 search completed, but one or more output files failed.

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
  CSV output: not generated
  Markdown memo output: generated
  Generated files:
    - output\research\m5-csv-output-failure-check\research-memo.md

Warnings
  - CSV output failed: Forced CSV output failure
```

Exit Codeは `5` だった。

#### 確認結果

| 項目                   |                    結果 |
| -------------------- | --------------------: |
| CSV output           |         not generated |
| Markdown memo output |             generated |
| Generated files      | `research-memo.md` のみ |
| Markdownリンク行数        |                   139 |
| Markdown内 Exit Code  |                     5 |
| Warning              |   `CSV output failed` |
| UTF-8 without BOM    |                    OK |
| LF                   |                    OK |

### 8.2 Markdown出力失敗

Markdown writerに一時的な障害注入を行い、Markdown出力のみを失敗させた。

#### 実行結果

```text
M5 search completed, but one or more output files failed.

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
  CSV output: generated
  Markdown memo output: not generated
  Generated files:
    - output\research\m5-markdown-output-failure-check\search-results.csv

Warnings
  - Markdown output failed: Forced Markdown output failure
```

Exit Codeは `5` だった。

#### 確認結果

| 項目                   |                       結果 |
| -------------------- | -----------------------: |
| CSV output           |                generated |
| Markdown memo output |            not generated |
| Generated files      |  `search-results.csv` のみ |
| CSV行数                |                      139 |
| Warning              | `Markdown output failed` |
| Exit Code            |                        5 |

### 8.3 CSV / Markdown両方失敗

CSV writerとMarkdown writerの両方に一時的な障害注入を行い、両方の出力を失敗させた。

#### 実行結果

```text
M5 search completed, but one or more output files failed.

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
  CSV output: not generated
  Markdown memo output: not generated
  Generated files: None

Warnings
  - CSV output failed: Forced CSV output failure
  - Markdown output failed: Forced Markdown output failure
```

Exit Codeは `5` だった。

#### 確認結果

| 項目                   |               結果 |
| -------------------- | ---------------: |
| CSV output           |    not generated |
| Markdown memo output |    not generated |
| Generated files      |             None |
| Warning              | CSV / Markdown両方 |
| Exit Code            |                5 |

## 9. 残課題

M5完了時点で、M5範囲内の実装・確認に対する未解決事項はない。

ただし、P0全体または次フェーズに向けた残課題として以下を残す。

### 9.1 M5範囲外

以下はM5では実装しない。

* 検索結果URLへのHTTPアクセス
* 記事本文の取得
* 記事本文のAI要約
* 有料部分の判定
* note価格の正確な取得
* Markdownメモからの記事本文自動生成
* Markdown内の競合分析自動記述

### 9.2 今後の改善候補

今後の改善候補は以下。

| 改善候補        | 内容                                    |
| ----------- | ------------------------------------- |
| テスト自動化      | 正常系・API失敗系・出力失敗系をJest等で自動化する          |
| レンダラー単体テスト  | Markdown章構成、0件時メッセージ、エスケープ処理をテストする    |
| writer単体テスト | UTF-8 without BOM、LF、書き込み失敗時の例外をテストする |
| CLI表示テスト    | Exit Codeごとの表示文言を固定テストする              |
| 実行レポート出力    | 将来的にrun reportを別ファイルとして出力する           |
| P1分析支援      | 競合タイトルの分類、切り口候補の半自動抽出を検討する            |

## 10. M5完了判定

M5は完了と判定する。

理由は以下。

* 設計どおり `research-memo.md` を生成できている
* CSVとMarkdownの件数整合が取れている
* CLI表示がM5向けに更新されている
* 正常系、準正常系、出力失敗系のExit Codeが期待どおりである
* Markdown出力がUTF-8 without BOM、LFになっている
* P0制約の注意書きがMarkdown内に出力されている
* 一部失敗時も成功分から出力できている
* 全失敗時も空出力とメモを生成できている
* 出力失敗時も生成できる側のファイルは生成される
* 一時的な障害注入コードは削除済み
* `findstr /S /N /I "RMB_FORCE" src\*.ts` で残骸なしを確認済み

最終確認コマンドは以下。

```bat
npm run check
findstr /S /N /I "RMB_FORCE" src\*.ts
```

結果は以下。

* `npm run check` 成功
* `findstr RMB_FORCE` 出力なし

以上により、M5は完了とする。
