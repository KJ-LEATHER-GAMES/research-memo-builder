---
title: Research Memo Builder P0 Completion Report
document_id: research-memo-builder-p0-completion-report
status: active
version: 1.0.0
created_at: 2026-06-28
updated_at: 2026-06-28
project: Research Memo Builder
milestone: P0
file_path: docs/implementation/research-memo-builder-p0-completion-report.md
source_documents:
  - docs/requirements/research-memo-builder-p0-requirements.md
  - docs/research/design/research-memo-builder-p0-design.md
  - docs/implementation/research-memo-builder-m2-a-implementation-record.md
  - docs/implementation/research-memo-builder-m2-b-implementation-record.md
  - docs/implementation/research-memo-builder-m3-implementation-report.md
  - docs/implementation/research-memo-builder-m4-implementation-report.md
  - docs/implementation/research-memo-builder-m5-implementation-report.md
  - output/research/p0-final-check/search-results.csv
  - output/research/p0-final-check/research-memo.md
review_status: completed
review_result: pass with minor documentation cleanup completed
---

# Research Memo Builder P0 完了レポート

## 1. このドキュメントの目的

このドキュメントは、`research_memo_builder` / `Research Memo Builder` のP0実装が完了したことを記録する完了レポートである。

P0では、note記事投稿前の既存記事リサーチを半自動化するため、入力YAMLから検索条件を読み込み、Brave Search APIで既存記事候補を取得し、CSVおよびMarkdownのリサーチメモを生成できる状態を目標とした。

本レポートでは、以下を整理する。

- P0の目的
- M1〜M5の実施内容
- 最終正常系確認結果
- 異常系確認結果
- 出力ファイル確認結果
- P0対象外に留めた判断
- P0完了判定
- P1への接続

---

## 2. P0の目的

P0の目的は、記事候補と検索キーワードを入力すると、Brave Search APIを使って既存記事候補を取得し、最低限のリサーチメモ作成に使えるCSVとMarkdownを出力できる状態を作ることである。

P0では、リサーチメモを完全自動完成させることは目的にしない。
検索結果をもとに、人間が短時間で既存記事リサーチを確認・判断できる下準備を作ることを目的とした。

P0で作る成果物は以下である。

| 成果物 | 目的 |
| --- | --- |
| `search-results.csv` | 検索結果を一覧化し、表形式で確認・加工できるようにする |
| `research-memo.md` | note記事化前の既存記事リサーチメモとして、人間が判断しやすい形式で整理する |

---

## 3. P0の完了範囲

P0では以下を完了範囲とした。

| 区分 | 完了内容 |
| --- | --- |
| 入力 | YAML入力ファイルの読み込み、Zod検証、デフォルト補完 |
| CLI | `--input`、`--out`、`--dry-run`、`--help` の扱い |
| 設定 | `.env` からの `BRAVE_API_KEY` 読み込み |
| 検索 | 検索クエリ生成、Brave Search API実行、逐次検索 |
| 正規化 | Brave Search APIレスポンスから `NormalizedSearchResult` への変換 |
| 重複排除 | URL完全一致による単純重複排除 |
| CSV出力 | `search-results.csv` の生成、UTF-8 with BOM出力 |
| Markdown出力 | `research-memo.md` の生成、P0制約付きリサーチメモ出力 |
| エラー処理 | 入力不正、設定不備、部分API失敗、全API失敗、出力失敗のExit Code制御 |
| 安全制約 | 検索結果URLへのHTTPアクセス、本文取得、有料部分取得、note非公式API利用を行わない |

---

## 4. マイルストーン別の実施内容

### 4.1 M1：プロジェクト雛形作成

M1では、Research Memo Builder のプロジェクト雛形を作成した。

主な実施内容は以下である。

- `package.json` の作成
- `tsconfig.json` の作成
- `.env.example` の作成
- `.gitignore` の作成
- `src/cli/research.ts` のCLI雛形作成
- `research/inputs/ats-rule-spec.yaml` のサンプル入力作成
- npm scripts の定義
  - `research`
  - `typecheck`
  - `format`
  - `format:check`
  - `check`

M1時点では、CLIの入口と開発用ディレクトリを用意し、M2以降の実装に進める状態を作った。

### 4.2 M1.5：P0実装設計

M1完了後、いきなりAPI接続へ進まず、P0実装設計を整理した。

主な実施内容は以下である。

- `docs/requirements/research-memo-builder-p0-requirements.md` のActive化
- `docs/research/design/research-memo-builder-p0-design.md` のActive化
- 入力YAML型の整理
- DTO設計の整理
- CLI引数仕様の整理
- 出力ファイル構成の整理
- エラーコード体系の整理
- ディレクトリ構成の整理

主な設計判断は以下である。

| ID | 判断 |
| --- | --- |
| DD-P0-001 | CSVはUTF-8 with BOMで出力する |
| DD-P0-002 | `--out` はP0正式仕様に含める |
| DD-P0-003 | `--dry-run` はP0必須機能に含める |
| DD-P0-004 | 入力バリデーションにはZodを採用する |
| DD-P0-005 | HTTPクライアントにはNode標準 `fetch` を採用する |

### 4.3 M2-A：入力YAML読み込み + Zod検証 + dry-run

M2-Aでは、入力YAML読み込み、Zod検証、検索クエリ生成、dry-runを実装した。

主な実施内容は以下である。

- `src/domain/researchExitCode.ts` の追加
- 入力DTO / 検索条件DTOの追加
- YAML読み込み処理の追加
- Zodによる入力検証の追加
- `search` 配下のデフォルト補完
- 検索クエリ生成処理の追加
- `--dry-run` 時にAPIを呼ばない制御
- P0対象外出力フラグを `true` にした場合の入力エラー化
- `--out` の安全な相対パス判定

確認した主な挙動は以下である。

| 確認項目 | 結果 |
| --- | --- |
| 正常dry-run | Exit Code `0` |
| `--input` 未指定 | Exit Code `2` |
| 入力不正 | Exit Code `2` |
| P0対象外出力フラグ指定 | Exit Code `2` |
| 検索クエリ生成 | 5キーワード × 3媒体 = 15クエリ |
| API呼び出し | dry-runでは呼び出しなし |
| CSV/Markdown出力 | dry-runでは出力なし |
| `npm run check` | 成功 |

### 4.4 M2-B：`.env` 読み込み + Brave Search API単一検索

M2-Bでは、M2-Aの入力・dry-run基盤を前提に、Brave Search APIへ最初の1クエリを送信できる状態を作った。

主な実施内容は以下である。

- `.env` から `BRAVE_API_KEY` を読み込む処理の追加
- `src/config/env.ts` の追加
- `src/adapters/braveSearchClient.ts` の追加
- `SearchQueryExecutionResult` の定義
- Brave Search APIレスポンスの最小型定義
- APIキー未設定時の Exit Code `3` 制御
- Brave Search API HTTPエラー本文の表示
- M2-B通常実行時は最初の1クエリだけを実行する制御

確認した主な挙動は以下である。

| 確認項目 | 結果 |
| --- | --- |
| APIキー未設定 | Exit Code `3` |
| APIキー設定時の単一検索 | 成功 |
| 生成クエリ数 | 15クエリ |
| 実行クエリ数 | 最初の1クエリのみ |
| CSV/Markdown出力 | M2-Bでは出力なし |
| `npm run check` | 成功 |

### 4.5 M3：複数キーワード・複数媒体検索、正規化、重複排除

M3では、M2-Bの単一検索を拡張し、全クエリの逐次実行、検索結果の正規化、URL完全一致による重複排除、部分失敗・全失敗時のExit Code制御を実装した。

主な実施内容は以下である。

- 15クエリの逐次実行
- 各クエリの成功/失敗集計
- 一部クエリ失敗時の継続実行
- `NormalizedSearchResult` への変換
- URLなし/titleなし検索結果の除外
- `snippet` なし時の空文字補完
- `extraSnippets` なし時の空配列補完
- URL完全一致による重複排除
- 一部API失敗時の Exit Code `1`
- 全API失敗時の Exit Code `4`
- M3時点ではCSV/Markdownを出力しない制御

確認した主な挙動は以下である。

| 確認項目 | 結果 |
| --- | --- |
| 正常系 | Exit Code `0` |
| 一部API失敗 | Exit Code `1` |
| 全API失敗 | Exit Code `4` |
| 一部失敗時の継続 | 成功分を正規化・重複排除 |
| 全失敗時 | 検索結果0件として扱う |
| CSV/Markdown出力 | M3では出力なし |
| 一時フォルト注入コード | 削除済み |
| `npm run check` | 成功 |

### 4.6 M4：CSV出力

M4では、M3で実装済みの複数クエリ検索・検索結果正規化・URL完全一致重複排除の結果をもとに、CSV出力機能を実装した。

主な実施内容は以下である。

- `src/utils/csvEscape.ts` の追加
- `src/renderers/csvRenderer.ts` の追加
- `src/output/csvResearchResultWriter.ts` の追加
- `search-results.csv` の生成
- UTF-8 with BOM付きCSV出力
- 出力先ディレクトリ作成
- `--out` 指定時の出力先反映
- `generatedFiles` へのCSVファイルパス格納
- CSV出力失敗時の Exit Code `5`
- 一部API失敗時の成功分CSV出力
- 全API失敗時のヘッダーのみCSV出力
- dry-run時のCSV未出力維持

CSVヘッダーは以下である。

```text
Keyword,Platform,Title,Url,Snippet,ExtraSnippets,Rank,Query,RetrievedAt
```

確認した主な挙動は以下である。

| 確認項目 | 結果 |
| --- | --- |
| 正常系CSV出力 | Exit Code `0` |
| `--out` 指定 | 指定先へ出力 |
| dry-run | CSV出力なし、Exit Code `0` |
| CSV BOM | UTF-8 BOMあり |
| CSV出力失敗 | Exit Code `5` |
| 一部API失敗 | 成功分CSV出力、Exit Code `1` |
| 全API失敗 | ヘッダーのみCSV出力、Exit Code `4` |
| 一時フォルト注入コード | 削除済み |
| `npm run check` | 成功 |

### 4.7 M5：Markdownリサーチメモ出力

M5では、既存のCSV出力に加えて、Markdown形式のリサーチメモ出力を実装した。

M5で生成するMarkdownは、最終記事ではなく、既存記事調査のための一次整理メモである。
本文取得、記事内容の要約、有料部分の確認、価格の正確な判定はP0対象外とし、Brave Search APIから取得できるタイトル、URL、スニペット、追加スニペットのみを使用する。

主な実施内容は以下である。

- `src/utils/markdownEscape.ts` の追加
- `src/renderers/markdownResearchMemoRenderer.ts` の追加
- `src/output/markdownResearchMemoWriter.ts` の追加
- `research-memo.md` の生成
- CSV出力に加えたMarkdown出力のUseCase接続
- CSV/Markdownの独立出力制御
- Markdown出力失敗時の Exit Code `5`
- 一部API失敗時の成功分Markdown出力
- 全API失敗時の空Markdownメモ出力
- Markdown出力仕様のP0注意書き反映

確認した主な挙動は以下である。

| 確認項目 | 結果 |
| --- | --- |
| 正常系 | CSV / Markdown両方生成、Exit Code `0` |
| 一部API失敗 | 成功分からCSV / Markdown生成、Exit Code `1` |
| 全API失敗 | 空CSV / 空Markdownメモ生成、Exit Code `4` |
| CSV出力失敗 | Markdownのみ生成、Exit Code `5` |
| Markdown出力失敗 | CSVのみ生成、Exit Code `5` |
| CSV / Markdown両方失敗 | 生成ファイルなし、Exit Code `5` |
| Markdown文字コード | UTF-8 without BOM |
| 改行コード | LF |
| 一時フォルト注入コード | 削除済み |
| `npm run check` | 成功 |

---

## 5. 最終正常系確認結果

P0最終正常系として、以下のコマンドを実行した。

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/p0-final-check
```

確認結果は以下である。

| 項目 | 結果 |
| --- | ---: |
| Exit Code | `0` |
| 生成クエリ数 | 15 |
| 成功クエリ数 | 15 |
| 失敗クエリ数 | 0 |
| Raw件数 | 150 |
| Normalized件数 | 150 |
| Deduplicated件数 | 139 |
| Removed duplicate件数 | 11 |
| 生成CSV | `search-results.csv` |
| 生成Markdown | `research-memo.md` |

P0の正常系は期待どおり完了した。

---

## 6. 異常系・準正常系確認結果

P0で確認した異常系・準正常系は以下である。

| 確認項目 | 期待結果 | 確認結果 |
| --- | --- | --- |
| `--dry-run` | API呼び出しなし、CSV/Markdown出力なし、Exit Code `0` | OK |
| 存在しないYAML指定 | Exit Code `2` | OK |
| 入力ファイル未指定 | Exit Code `2` | OK |
| 入力値不正 | Exit Code `2` | OK |
| P0対象外出力フラグ指定 | Exit Code `2` | OK |
| `BRAVE_API_KEY` 未設定 | APIを呼ばず Exit Code `3` | OK |
| 一部API失敗 | 成功分から出力し Exit Code `1` | OK |
| 全API失敗 | 空CSV / 空Markdownを生成し Exit Code `4` | OK |
| CSV出力失敗 | Markdownは可能な限り生成し Exit Code `5` | OK |
| Markdown出力失敗 | CSVは可能な限り生成し Exit Code `5` | OK |
| CSV / Markdown両方出力失敗 | Exit Code `5` | OK |

Exit Code体系は以下で確定した。

| Exit Code | 意味 |
| ---: | --- |
| `0` | 正常終了 |
| `1` | 一部API失敗。ただし成功分から出力可能 |
| `2` | 入力エラー |
| `3` | 設定エラー。主に `BRAVE_API_KEY` 未設定 |
| `4` | 全API失敗 |
| `5` | 出力エラー |
| `9` | 予期しないエラー |

---

## 7. 出力ファイル確認結果

### 7.1 `search-results.csv`

P0最終確認で生成された `search-results.csv` の確認結果は以下である。

| 項目 | 結果 |
| --- | --- |
| CSV行数 | 139 |
| UTF-8 BOM | あり |
| URL重複 | なし |
| APIキー文字列 | なし |

CSVヘッダーは以下である。

```text
Keyword,Platform,Title,Url,Snippet,ExtraSnippets,Rank,Query,RetrievedAt
```

### 7.2 `research-memo.md`

P0最終確認で生成された `research-memo.md` の確認結果は以下である。

| 項目 | 結果 |
| --- | --- |
| Markdownリンク数 | 139 |
| 検索結果グループ数 | 15 |
| UTF-8 BOM | なし |
| P0注意書き | あり |
| Warnings | なし |
| APIキー文字列 | なし |

CSV行数とMarkdownリンク数がともに139件で一致しており、重複排除後の検索結果が両出力に反映されている。

---

## 8. Git・品質確認結果

P0完了時点の品質確認結果は以下である。

### 8.1 最新コミット

P0完了レビュー時点で確認した主なコミットは以下である。

| コミット | 内容 |
| --- | --- |
| `7d0**** feat: complete M5 markdown research memo output` | M5 Markdownリサーチメモ出力の完了 |
| `54***** docs: align P0 requirements with final behavior` | P0最終挙動に合わせた要件定義・設計書の整合 |

### 8.2 作業ツリー

```bash
git status --short
```

結果は出力なしであり、作業ツリーはクリーンである。

### 8.3 静的確認

```bash
npm run check
```

確認結果は以下である。

| コマンド | 結果 |
| --- | --- |
| `npm run typecheck` | 成功 |
| `npm run format:check` | 成功 |
| `npm run check` | 成功 |

### 8.4 Git管理対象外の確認

`.gitignore` では、以下がGit管理対象外であることを確認した。

```text
.env
output/
node_modules/
dist/
```

また、以下はGit管理対象に残す方針である。

```text
!.env.example
```

これにより、APIキーや生成物を誤ってコミットしない構成になっている。

---

## 9. P0対象外に留めた判断

P0では、スコープを広げすぎないため、以下を明確に対象外とした。

| 対象外項目 | 判断理由 |
| --- | --- |
| 検索結果URLへのHTTPアクセス | P0ではBrave Search APIの検索結果情報だけを扱うため |
| note記事本文の取得 | スクレイピングや規約面の判断が増えるため |
| 有料部分の取得 | P0の安全制約外であり、取得しないことを明確化するため |
| note非公式APIの利用 | 安全性・継続性・規約面のリスクを避けるため |
| 記事内容のAI要約 | P0では検索結果の一次整理に集中するため |
| 価格の正確な判定 | Brave Search APIのスニペットだけでは確定できないため |
| JSON出力 | P1以降の拡張に回すため |
| run-report出力 | P1以降の拡張に回すため |
| ChatGPT分析プロンプト出力 | P1以降の拡張に回すため |
| 高度なURL正規化 | 誤判定リスクと設計判断が増えるため |
| タイトル類似判定 | P0ではURL完全一致に限定するため |
| 並列検索 | レート制限・ログ順序・障害切り分けを単純に保つため |
| 自動リトライ | P0では失敗を明示し、成功分から出力する方針とするため |

この判断により、P0は「安全に検索結果を取得し、人間が確認できる素材を生成する」範囲に集中できた。

---

## 10. P0完了判定

P0は完了と判定する。

判定ラベルは以下である。

```text
P0 Status: completed
Review Result: pass with minor documentation cleanup completed
```

完了判定の理由は以下である。

- 最終正常系が Exit Code `0` で完了した
- 15クエリを生成し、15クエリすべてが成功した
- CSVとMarkdownが生成された
- CSV件数とMarkdownリンク数が139件で一致した
- `--dry-run` がAPI呼び出しなし、出力なしで正常完了した
- 入力不正が Exit Code `2` で扱われた
- APIキー未設定が Exit Code `3` で扱われた
- 一部API失敗が Exit Code `1` で扱われた
- 全API失敗が Exit Code `4` で扱われた
- 出力失敗が Exit Code `5` で扱われた
- `.env` と `output/` がGit管理対象外である
- 作業ツリーがクリーンである
- `npm run check` が成功している
- P0対象外の本文取得・有料部分取得・価格確定・AI要約に踏み込んでいない

---

## 11. P1への接続

P0完了により、Research Memo Builder は以下の状態になった。

- 入力YAMLから検索条件を読み込める
- Brave Search APIで既存記事候補を取得できる
- 検索結果を正規化できる
- URL完全一致で重複排除できる
- CSVで一覧確認できる
- Markdownでリサーチメモとして確認できる
- dry-run、入力不正、設定不備、API失敗、出力失敗を扱える

P1では、P0で生成した検索結果をさらに分析・再利用しやすくするため、以下を候補とする。

| 候補 | 内容 |
| --- | --- |
| `normalized-results.json` | 重複排除後または正規化後の検索結果をJSONで保存する |
| `raw-results.json` | Brave Search APIレスポンスの必要部分を保存する |
| `run-report.md` | 実行条件、件数、失敗クエリ、warningを実行レポートとして保存する |
| `chatgpt-analysis-prompt.md` | 生成したリサーチメモをChatGPTで分析しやすいプロンプトとして出力する |

P1開始時は、まず以下の要件定義書を作成するのがよい。

```text
docs/requirements/research-memo-builder-p1-requirements.md
```

P1初回では、重複排除強化は後回しにするのが安全である。
理由は、URL正規化、クエリパラメータ除去、note URL形式、タイトル類似判定など、追加の設計判断と誤判定リスクが増えるためである。

---

## 12. note記事化に使える観点

P0完了までの流れは、後日note記事化する際に以下の切り口で再利用できる。

### 12.1 「いきなり実装しない」開発プロセス

M1の雛形作成後、M1.5としてP0実装設計を挟んだことで、M2以降の実装対象が明確になった。

記事化する場合は、以下の主張にできる。

> 小さなCLIツールでも、先に要件定義と設計を置くと、AIとの実装会話が迷子になりにくい。

### 12.2 P0対象外を明確にした価値

P0では、本文取得、有料部分取得、AI要約、価格確定をあえて対象外にした。

記事化する場合は、以下の主張にできる。

> 最初のバージョンでは「やらないこと」を決めた方が、完成まで到達しやすい。

### 12.3 エラー処理を先に整理した価値

Exit Code `0` / `1` / `2` / `3` / `4` / `5` / `9` を整理したことで、正常系だけでなく、部分失敗・全失敗・出力失敗まで判断できるCLIになった。

記事化する場合は、以下の主張にできる。

> CLIツールは、成功時の出力だけでなく、失敗時にどう終わるかを決めると使いやすくなる。

### 12.4 人間レビュー前提のMarkdown出力

P0のMarkdownは、最終記事ではなく、人間が判断するための一次整理メモとして設計した。

記事化する場合は、以下の主張にできる。

> AIやAPIで全部を自動化するのではなく、人間が判断する直前までを整えると、現実的に使えるツールになる。

---

## 13. 次アクション

P0完了後の次アクションは以下である。

1. 本レポートを以下に保存する。

   ```text
   docs/implementation/research-memo-builder-p0-completion-report.md
   ```

2. 保存後、静的確認を実行する。

   ```bash
   npm run check
   ```

3. 問題なければコミットする。

   ```bash
   git add docs/implementation/research-memo-builder-p0-completion-report.md
   git commit -m "docs: add P0 completion report"
   ```

4. P1要件定義書の作成に進む。

   ```text
   docs/requirements/research-memo-builder-p1-requirements.md
   ```
