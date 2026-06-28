---
title: Research Memo Builder P1要件定義書
document_id: research-memo-builder-p1-requirements
status: draft
version: 0.1.0
created_at: 2026-06-28
updated_at: 2026-06-28
project: Research Memo Builder
milestone: P1
file_path: docs/requirements/research-memo-builder-p1-requirements.md
source_documents:
  - docs/requirements/research-memo-builder-p0-requirements.md
  - docs/research/design/research-memo-builder-p0-design.md
  - docs/proposal/research-memo-builder_proposal.md
  - docs/implementation/research-memo-builder-p0-completion-report.md
  - docs/implementation/research-memo-builder-m2-a-implementation-record.md
  - docs/implementation/research-memo-builder-m2-b-implementation-record.md
  - docs/implementation/research-memo-builder-m3-implementation-report.md
  - docs/implementation/research-memo-builder-m4-implementation-report.md
  - docs/implementation/research-memo-builder-m5-implementation-report.md
---

# Research Memo Builder P1要件定義書

## 1. この文書の位置づけ

この文書は、`research_memo_builder` / `Research Memo Builder` の **P1要件定義書** である。

P0では、入力YAMLから検索条件を読み込み、Brave Search APIで既存記事候補を取得し、`search-results.csv` と `research-memo.md` を生成できる状態まで完了した。

P1では、P0で取得・正規化・重複排除した検索結果を、後続の分析・確認・記事化判断に使いやすくするため、以下の追加出力を実装対象とする。

- `normalized-results.json`
- `raw-results.json`
- `run-report.md`
- `chatgpt-analysis-prompt.md`

P1は、P0の安定動作を壊さず、出力形式を拡張するフェーズである。
本文取得、note非公式API利用、有料部分取得、LLM APIによる自動分析には踏み込まない。

対象ファイルは以下である。

```text
docs/requirements/research-memo-builder-p1-requirements.md
```

---

## 2. P1の目的

P1の目的は、P0で生成したCSV/Markdownに加えて、検索実行結果を再利用しやすい構造化データと分析支援ファイルとして出力できる状態を作ることである。

P1で実現したい状態は以下である。

| 観点       | P1で実現すること                                                                   |
| ---------- | ---------------------------------------------------------------------------------- |
| 再利用性   | 正規化済み検索結果をJSONとして保存し、後続処理・検証・記事化素材に使えるようにする |
| デバッグ性 | Brave Search API由来の取得データとクエリ別の成功/失敗を追跡できるようにする        |
| 実行記録   | 実行条件、件数、失敗、warning、生成ファイルを `run-report.md` に記録する           |
| 分析支援   | ChatGPTへ貼り付けやすい分析プロンプトを生成する                                    |
| 安全性     | 本文取得・有料部分取得・APIキー漏洩を防ぐP0の安全制約を維持する                    |

P1では、リサーチメモの分析結果を自動確定しない。
ChatGPT分析プロンプトは、あくまで人間がLLMへ渡してレビューするための補助成果物とする。

---

## 3. P1対象範囲

### 3.1 P1で対象とすること

| ID           | 対象                          | 要件概要                                                                              |
| ------------ | ----------------------------- | ------------------------------------------------------------------------------------- |
| P1-SCOPE-001 | `output.json` の解禁          | 入力YAMLで `output.json: true` を許可する                                             |
| P1-SCOPE-002 | 正規化済みJSON出力            | `normalized-results.json` を出力する                                                  |
| P1-SCOPE-003 | Raw結果JSON出力               | `raw-results.json` を出力する                                                         |
| P1-SCOPE-004 | `output.runReport` の解禁     | 入力YAMLで `output.runReport: true` を許可する                                        |
| P1-SCOPE-005 | 実行レポート出力              | `run-report.md` を出力する                                                            |
| P1-SCOPE-006 | `output.chatgptPrompt` の解禁 | 入力YAMLで `output.chatgptPrompt: true` を許可する                                    |
| P1-SCOPE-007 | ChatGPT分析プロンプト出力     | `chatgpt-analysis-prompt.md` を出力する                                               |
| P1-SCOPE-008 | 生成ファイル一覧の拡張        | CLI出力と内部結果の `generatedFiles` にP1追加ファイルを含める                         |
| P1-SCOPE-009 | dry-run表示の拡張             | `--dry-run` 時にP1追加出力の予定を表示する。ただしAPI呼び出しとファイル出力は行わない |
| P1-SCOPE-010 | P0安全制約の継承              | 検索結果URLへのHTTPアクセス、本文取得、有料部分取得、APIキー出力を行わない            |
| P1-SCOPE-011 | P1受け入れ条件整備            | P1実装完了を判断できる受け入れ条件を定義する                                          |

### 3.2 P1初回で対象外とすること

P1初回では、追加出力の実装に集中するため、以下は対象外とする。

| ID         | 対象外                                                    | 理由                                                                                        |
| ---------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| P1-OOS-001 | 高度な重複排除                                            | URL正規化、クエリパラメータ除去、タイトル類似判定は誤判定リスクがあるため後続フェーズで扱う |
| P1-OOS-002 | 自動リトライ                                              | API失敗時の再試行はレート制限や待機時間設計が必要なため後続フェーズで扱う                   |
| P1-OOS-003 | キャッシュ                                                | 同一検索結果の再利用は保存形式・期限・無効化設計が必要なため後続フェーズで扱う              |
| P1-OOS-004 | note RSS連携                                              | P2以降の定点観測機能として扱う                                                              |
| P1-OOS-005 | 手動URL投入                                               | P2以降の入力拡張として扱う                                                                  |
| P1-OOS-006 | LLM API連携                                               | P1ではプロンプト生成までとし、自動分析はMVP後またはP3以降で扱う                             |
| P1-OOS-007 | `research-memo.md` のAI分析済み出力                       | P1ではChatGPT分析プロンプトに分離し、Markdownメモの分析欄を自動確定しない                   |
| P1-OOS-008 | 価格情報の自動確定                                        | 検索結果だけでは正確に判定できないため対象外とする                                          |
| P1-OOS-009 | 記事本文HTML取得                                          | 検索結果URLへの追加HTTPアクセスが必要になるため対象外とする                                 |
| P1-OOS-010 | OGP取得                                                   | 検索結果URLへの追加HTTPアクセスが必要になるため対象外とする                                 |
| P1-OOS-011 | note非公式API利用                                         | 仕様変更・停止リスクを避けるため対象外とする                                                |
| P1-OOS-012 | note本文スクレイピング                                    | 規約、robots.txt、著作権リスクを避けるため対象外とする                                      |
| P1-OOS-013 | 有料部分取得                                              | 明確に対象外とする                                                                          |
| P1-OOS-014 | Web UI                                                    | P1ではCLI出力の拡張を優先する                                                               |
| P1-OOS-015 | データベース保存                                          | P1ではファイル出力で十分とする                                                              |
| P1-OOS-016 | Mnemosyne連携                                             | P3以降で扱う                                                                                |
| P1-OOS-017 | CLI `--json` / `--run-report` / `--chatgpt-prompt` の解禁 | P1初回では入力YAMLの `output.*` フラグで制御し、CLIオプションの優先順位設計を増やさない     |

---

## 4. P0から継承する前提

P1は、P0で確定した以下の仕様を継承する。

| 区分         | 継承内容                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------- |
| 入力         | YAML入力ファイル、`--input` 指定、Zod検証、デフォルト補完を継承する                                 |
| 検索         | `site:{domain} {keyword}` 形式のクエリ生成を継承する                                                |
| API          | Brave Search APIを利用し、`count` / `country` / `search_lang` / `ui_lang` / `extra_snippets` を渡す |
| 実行         | クエリは逐次実行する                                                                                |
| 正規化       | Brave Search APIレスポンスを `NormalizedSearchResult` に変換する                                    |
| 重複排除     | URL完全一致のみで重複排除する                                                                       |
| CSV          | `search-results.csv` をUTF-8 with BOMで出力する                                                     |
| Markdown     | `research-memo.md` をUTF-8 without BOMで出力する                                                    |
| 出力先       | 入力YAMLの `output.dir` を使い、`--out` 指定時はCLI引数を優先する                                   |
| dry-run      | API呼び出しとファイル出力は行わず、入力検証と検索クエリ確認に留める                                 |
| エラーコード | P0で定義した Exit Code を継承する                                                                   |
| Safety       | 検索結果URLへの追加HTTPアクセス、本文取得、有料部分取得、APIキー出力を行わない                      |

P1では、P0のCSV/Markdown出力を置き換えない。
P1追加出力は、P0出力に対する追加成果物として扱う。

---

## 5. 入力要件

### 5.1 入力ファイル形式

P1でも、入力ファイルはP0と同じYAML形式とする。

| ID        | 要件                                                    |
| --------- | ------------------------------------------------------- |
| P1-IN-001 | 入力ファイルはYAML形式とする                            |
| P1-IN-002 | CLI引数 `--input` で入力YAMLのパスを指定する            |
| P1-IN-003 | P1でも1回の実行につき、入力YAMLは1ファイルのみ読み込む  |
| P1-IN-004 | P1では `search` 配下の構造をP0から変更しない            |
| P1-IN-005 | P1では `keywords`、`platforms` の上限をP0から変更しない |

### 5.2 入力YAMLの標準形

P1で追加出力をすべて有効化する場合の入力YAML例は以下である。

```yaml
topic: 家庭内ルールを書き出したら、仕様書になっていた話

articleType:
  devDiary: true
  techArticle: false
  paidNoteCandidate: false

keywords:
  - 家庭内ルール 仕様書
  - 家庭内ルール 要件定義
  - 家庭内 ポイント制度 設計
  - 子育て 仕組み化 note
  - 家庭内ルール プロダクト設計

platforms:
  - name: note
    site: note.com
  - name: Qiita
    site: qiita.com
  - name: Zenn
    site: zenn.dev

search:
  countPerQuery: 10
  country: JP
  searchLang: jp
  uiLang: ja-JP
  extraSnippets: true

output:
  dir: output/research/ats-rule-spec
  csv: true
  markdownMemo: true
  json: true
  runReport: true
  chatgptPrompt: true
```

### 5.3 P1の出力フラグ

P1では、P0で `false` のみ許可していた以下の出力フラグを解禁する。

| ID        | 項目                   |      型 | 必須 | デフォルト | P1要件                                                                    |
| --------- | ---------------------- | ------: | ---: | ---------- | ------------------------------------------------------------------------- |
| P1-IN-006 | `output.csv`           | boolean |   No | `true`     | P1でも `true` のみ許可する。P0互換のため必須出力として扱う                |
| P1-IN-007 | `output.markdownMemo`  | boolean |   No | `true`     | P1でも `true` のみ許可する。P0互換のため必須出力として扱う                |
| P1-IN-008 | `output.json`          | boolean |   No | `false`    | `true` の場合、`normalized-results.json` と `raw-results.json` を出力する |
| P1-IN-009 | `output.runReport`     | boolean |   No | `false`    | `true` の場合、`run-report.md` を出力する                                 |
| P1-IN-010 | `output.chatgptPrompt` | boolean |   No | `false`    | `true` の場合、`chatgpt-analysis-prompt.md` を出力する                    |

P1初回では、`output.json` を細分化しない。
`output.json: true` の場合、以下2ファイルをセットで出力する。

```text
normalized-results.json
raw-results.json
```

### 5.4 入力バリデーション方針

| ID        | 要件                                                                            |
| --------- | ------------------------------------------------------------------------------- |
| P1-IN-011 | `output.json`、`output.runReport`、`output.chatgptPrompt` はbooleanのみ許可する |
| P1-IN-012 | `output.json`、`output.runReport`、`output.chatgptPrompt` は省略可能とする      |
| P1-IN-013 | 省略時は `false` として補完する                                                 |
| P1-IN-014 | `output.csv` と `output.markdownMemo` はP1でも `false` を許可しない             |
| P1-IN-015 | `output.dir` の安全な相対パス制約はP0から継承する                               |
| P1-IN-016 | 入力不正時はBrave Search APIを呼び出さない                                      |
| P1-IN-017 | 入力不正時はP1追加ファイルも出力しない                                          |

---

## 6. CLI要件

### 6.1 基本実行

P1の基本実行コマンドはP0と同じとする。

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml
```

P1追加出力は、入力YAMLの `output.*` フラグで制御する。

### 6.2 出力先指定

`--out` の仕様はP0から継承する。

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/ats-rule-spec
```

| ID         | 要件                                                         |
| ---------- | ------------------------------------------------------------ |
| P1-CLI-001 | `--out` 指定時は入力YAMLの `output.dir` より優先する         |
| P1-CLI-002 | `--out` の安全な相対パス制約はP0から継承する                 |
| P1-CLI-003 | `--out` 指定時、P1追加ファイルも指定先ディレクトリに出力する |

### 6.3 dry-run

`--dry-run` の仕様はP0から継承し、P1追加出力の予定表示のみ拡張する。

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml --dry-run
```

| ID         | 要件                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| P1-CLI-004 | `--dry-run` 指定時はBrave Search APIを呼び出さない                                                    |
| P1-CLI-005 | `--dry-run` 指定時はCSV、Markdown、JSON、run-report、ChatGPT分析プロンプトを出力しない                |
| P1-CLI-006 | `--dry-run` 指定時は、入力検証、デフォルト補完、検索クエリ生成、予定リクエスト数表示まで行う          |
| P1-CLI-007 | `--dry-run` 指定時は、`output.json`、`output.runReport`、`output.chatgptPrompt` の有効/無効を表示する |

### 6.4 P1初回で解禁しないCLIオプション

P1初回では、以下のCLIオプションは解禁しない。

```text
--json
--run-report
--chatgpt-prompt
```

| ID         | 要件                                                           |
| ---------- | -------------------------------------------------------------- |
| P1-CLI-008 | `--json` が指定された場合は入力不正として停止する              |
| P1-CLI-009 | `--run-report` が指定された場合は入力不正として停止する        |
| P1-CLI-010 | `--chatgpt-prompt` が指定された場合は入力不正として停止する    |
| P1-CLI-011 | P1追加出力のON/OFFは、入力YAMLの `output.*` フラグに一本化する |

---

## 7. 出力ファイル要件

### 7.1 P1で生成するファイル

P1で全出力フラグを有効にした場合、出力ディレクトリには以下のファイルを生成する。

```text
output/research/{slug}/
  search-results.csv
  research-memo.md
  normalized-results.json
  raw-results.json
  run-report.md
  chatgpt-analysis-prompt.md
```

### 7.2 出力ファイル一覧

| ID         | ファイル                     | 出力条件                     | 目的                                                            |
| ---------- | ---------------------------- | ---------------------------- | --------------------------------------------------------------- |
| P1-OUT-001 | `search-results.csv`         | `output.csv: true`           | P0から継承。検索結果を表形式で確認する                          |
| P1-OUT-002 | `research-memo.md`           | `output.markdownMemo: true`  | P0から継承。リサーチメモの下書きを確認する                      |
| P1-OUT-003 | `normalized-results.json`    | `output.json: true`          | 重複排除後の正規化済み検索結果を後続処理に渡す                  |
| P1-OUT-004 | `raw-results.json`           | `output.json: true`          | クエリ別のAPI取得結果・失敗をデバッグ用に保存する               |
| P1-OUT-005 | `run-report.md`              | `output.runReport: true`     | 実行条件、件数、失敗、warning、生成ファイルを記録する           |
| P1-OUT-006 | `chatgpt-analysis-prompt.md` | `output.chatgptPrompt: true` | 検索結果をもとにChatGPTへ分析依頼するためのプロンプトを生成する |

### 7.3 共通出力要件

| ID         | 要件                                                          |
| ---------- | ------------------------------------------------------------- |
| P1-OUT-007 | P1追加ファイルはUTF-8 without BOMで出力する                   |
| P1-OUT-008 | P1追加ファイルの改行コードはLFとする                          |
| P1-OUT-009 | 同名ファイルが存在する場合は確認なしで上書きする              |
| P1-OUT-010 | 出力ディレクトリが存在しない場合は作成する                    |
| P1-OUT-011 | 出力ディレクトリ作成失敗時は Exit Code `5` とする             |
| P1-OUT-012 | P1追加ファイルの書き込み失敗時は Exit Code `5` とする         |
| P1-OUT-013 | `generatedFiles` には実際に生成できたファイルパスのみを含める |
| P1-OUT-014 | P1追加ファイルにAPIキーを出力しない                           |

---

## 8. `normalized-results.json` 要件

### 8.1 目的

`normalized-results.json` は、P0で内部的に扱っていた `NormalizedSearchResult` を、後続処理で再利用しやすいJSONとして保存するためのファイルである。

P1では、CSV/Markdownと同じく、URL完全一致重複排除後の検索結果を出力対象とする。

### 8.2 出力条件

| ID           | 要件                                                                     |
| ------------ | ------------------------------------------------------------------------ |
| P1-NJSON-001 | `output.json: true` の場合に出力する                                     |
| P1-NJSON-002 | `output.json: false` または省略時は出力しない                            |
| P1-NJSON-003 | `--dry-run` 時は出力しない                                               |
| P1-NJSON-004 | API失敗が一部あっても、成功分がある場合は成功分から出力する              |
| P1-NJSON-005 | 検索結果0件時は `results: []` として出力する                             |
| P1-NJSON-006 | 全API失敗時も、可能であれば `results: []` と失敗情報を含むJSONを出力する |

### 8.3 JSON構造

P1の `normalized-results.json` は以下の構造とする。

```ts
export type NormalizedResultsJson = {
  schemaVersion: "1.0.0";
  generatedAt: string;
  input: {
    topic: string;
    articleType: {
      devDiary: boolean;
      techArticle: boolean;
      paidNoteCandidate: boolean;
    };
    keywords: string[];
    platforms: Array<{
      name: string;
      site: string;
    }>;
    search: {
      countPerQuery: number;
      country: string;
      searchLang: string;
      uiLang: string;
      extraSnippets: boolean;
    };
    outputDir: string;
  };
  summary: {
    queryCount: number;
    executedQueryCount: number;
    succeededQueryCount: number;
    failedQueryCount: number;
    rawResultCount: number;
    normalizedResultCount: number;
    deduplicatedResultCount: number;
    removedDuplicateCount: number;
  };
  results: NormalizedSearchResult[];
  removedDuplicateUrls: string[];
  failures: FailedSearchQuerySummary[];
  warnings: string[];
};
```

`NormalizedSearchResult` はP0の型を継承する。

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

補足：
P0初期要件・企画書では `snippet` と `extraSnippets` を任意項目としていたが、P0実装では正規化時に `snippet` は空文字、`extraSnippets` は空配列へ補正する。
そのため、P1のJSON出力では実装済みの `NormalizedSearchResult` に合わせ、`snippet: string`、`extraSnippets: string[]` として出力する。

### 8.4 フィールド要件

| ID           | フィールド             | 要件                                                          |
| ------------ | ---------------------- | ------------------------------------------------------------- |
| P1-NJSON-007 | `schemaVersion`        | P1初回では `1.0.0` 固定とする                                 |
| P1-NJSON-008 | `generatedAt`          | JSON生成日時をISO 8601形式で出力する                          |
| P1-NJSON-009 | `input`                | 解決済み入力値のうち、後続分析に必要な項目のみ出力する        |
| P1-NJSON-010 | `summary`              | 実行件数、取得件数、正規化件数、重複排除件数を出力する        |
| P1-NJSON-011 | `results`              | URL完全一致重複排除後の `NormalizedSearchResult[]` を出力する |
| P1-NJSON-012 | `removedDuplicateUrls` | 重複排除で除外されたURLを出力する                             |
| P1-NJSON-013 | `failures`             | 一部または全API失敗時の失敗クエリ情報を出力する               |
| P1-NJSON-014 | `warnings`             | 正規化除外や出力時の注意情報を出力する                        |

---

## 9. `raw-results.json` 要件

### 9.1 目的

`raw-results.json` は、Brave Search APIから取得した検索結果を、クエリ単位で確認するためのデバッグ用ファイルである。

P1では、APIレスポンス全体を無制限に保存するのではなく、後続確認に必要な検索結果項目に限定して保存する。
HTTPヘッダー、認証情報、APIキー、内部スタックトレースは保存しない。

### 9.2 出力条件

| ID           | 要件                                                    |
| ------------ | ------------------------------------------------------- |
| P1-RJSON-001 | `output.json: true` の場合に出力する                    |
| P1-RJSON-002 | `output.json: false` または省略時は出力しない           |
| P1-RJSON-003 | `--dry-run` 時は出力しない                              |
| P1-RJSON-004 | 一部API失敗時は、成功クエリと失敗クエリの両方を出力する |
| P1-RJSON-005 | 全API失敗時も、可能であれば失敗クエリ一覧を出力する     |

### 9.3 JSON構造

P1の `raw-results.json` は以下の構造とする。

```ts
export type RawResultsJson = {
  schemaVersion: "1.0.0";
  generatedAt: string;
  source: "brave-search-api";
  queryCount: number;
  queries: RawSearchQueryResult[];
};

export type RawSearchQueryResult =
  | {
      status: "success";
      keyword: string;
      platform: string;
      site: string;
      query: string;
      count: number;
      country: string;
      searchLang: string;
      uiLang: string;
      extraSnippets: boolean;
      retrievedAt: string;
      itemCount: number;
      items: BraveSearchRawItem[];
    }
  | {
      status: "failure";
      keyword: string;
      platform: string;
      site: string;
      query: string;
      count: number;
      country: string;
      searchLang: string;
      uiLang: string;
      extraSnippets: boolean;
      retrievedAt: string;
      failure: {
        type:
          | "http_error"
          | "network_error"
          | "invalid_response"
          | "unknown_error";
        httpStatus?: number;
        message: string;
      };
    };

export type BraveSearchRawItem = {
  title?: string;
  url?: string;
  description?: string;
  extraSnippets?: string[];
};
```

### 9.4 保存しない情報

| ID           | 保存しない情報         | 理由                                             |
| ------------ | ---------------------- | ------------------------------------------------ |
| P1-RJSON-006 | `BRAVE_API_KEY`        | 認証情報漏洩を防ぐため                           |
| P1-RJSON-007 | HTTPリクエストヘッダー | 認証ヘッダーを含む可能性があるため               |
| P1-RJSON-008 | HTTPレスポンスヘッダー | P1初回の分析・検証には不要なため                 |
| P1-RJSON-009 | APIレスポンス全体      | 保存対象を検索結果確認に必要な項目へ限定するため |
| P1-RJSON-010 | スタックトレース       | 利用者向け出力として不要なため                   |
| P1-RJSON-011 | 検索結果ページ本文     | P1でも検索結果URLへアクセスしないため            |
| P1-RJSON-012 | 有料部分               | P1でも取得しないため                             |

---

## 10. `run-report.md` 要件

### 10.1 目的

`run-report.md` は、Research Memo Builderの実行条件と実行結果を人間が確認するためのレポートである。

P0では標準出力・標準エラーに留めていた実行結果を、P1ではMarkdownファイルとして残す。

### 10.2 出力条件

| ID         | 要件                                                                       |
| ---------- | -------------------------------------------------------------------------- |
| P1-RPT-001 | `output.runReport: true` の場合に出力する                                  |
| P1-RPT-002 | `output.runReport: false` または省略時は出力しない                         |
| P1-RPT-003 | `--dry-run` 時は出力しない                                                 |
| P1-RPT-004 | 一部API失敗時も出力する                                                    |
| P1-RPT-005 | 全API失敗時も、可能であれば出力する                                        |
| P1-RPT-006 | 検索結果0件時も出力する                                                    |
| P1-RPT-007 | 他の出力ファイルで失敗が発生した場合も、可能であればrun-report出力を試みる |

### 10.3 章構成

`run-report.md` は以下の章構成とする。

```markdown
# Research Memo Builder Run Report

## 1. 実行概要

## 2. 入力条件

## 3. 検索条件

## 4. 実行結果サマリー

## 5. 出力ファイル

## 6. 失敗クエリ

## 7. Warnings

## 8. Safety確認

## 9. 次に確認すること
```

### 10.4 出力内容

| ID         | 章               | 出力内容                                                                                                                                           |
| ---------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-RPT-008 | 実行概要         | 実行日時、Exit Code、入力ファイル、出力ディレクトリを出力する                                                                                      |
| P1-RPT-009 | 入力条件         | topic、articleType、keywords、platformsを出力する                                                                                                  |
| P1-RPT-010 | 検索条件         | countPerQuery、country、searchLang、uiLang、extraSnippetsを出力する                                                                                |
| P1-RPT-011 | 実行結果サマリー | queryCount、succeededQueryCount、failedQueryCount、rawResultCount、normalizedResultCount、deduplicatedResultCount、removedDuplicateCountを出力する |
| P1-RPT-012 | 出力ファイル     | 実際に生成できたファイル一覧を出力する                                                                                                             |
| P1-RPT-013 | 失敗クエリ       | 失敗クエリ、媒体、キーワード、failureType、HTTP status、messageを出力する                                                                          |
| P1-RPT-014 | Warnings         | warningがあれば一覧化し、なければ `なし` と出力する                                                                                                |
| P1-RPT-015 | Safety確認       | 本文取得、有料部分取得、検索結果URLへのHTTPアクセス、APIキー出力を行っていないことを明記する                                                       |
| P1-RPT-016 | 次に確認すること | 人間レビューで見るべき項目を出力する                                                                                                               |

---

## 11. `chatgpt-analysis-prompt.md` 要件

### 11.1 目的

`chatgpt-analysis-prompt.md` は、生成済みの検索結果をもとに、ChatGPTへ既存記事リサーチの分析を依頼するためのプロンプトである。

P1では、ChatGPT APIを呼び出さない。
このファイルは、人間が内容を確認し、必要に応じてChatGPTへ貼り付けるための補助ファイルとする。

### 11.2 出力条件

| ID            | 要件                                                                        |
| ------------- | --------------------------------------------------------------------------- |
| P1-PROMPT-001 | `output.chatgptPrompt: true` の場合に出力する                               |
| P1-PROMPT-002 | `output.chatgptPrompt: false` または省略時は出力しない                      |
| P1-PROMPT-003 | `--dry-run` 時は出力しない                                                  |
| P1-PROMPT-004 | 一部API失敗時も、成功分の検索結果をもとに出力する                           |
| P1-PROMPT-005 | 検索結果0件時は、0件であることを前提にした確認プロンプトを出力する          |
| P1-PROMPT-006 | 全API失敗時は、分析に使える検索結果がないことを明記したプロンプトを出力する |

### 11.3 章構成

`chatgpt-analysis-prompt.md` は以下の章構成とする。

```markdown
# ChatGPT分析プロンプト

## 1. 使い方

## 2. ChatGPTに依頼する内容

## 3. 前提条件

## 4. 分析してほしい観点

## 5. 検索条件

## 6. 検索結果データ

## 7. 出力してほしい形式

## 8. 注意事項
```

### 11.4 プロンプトで依頼する分析観点

P1のChatGPT分析プロンプトでは、`research-memo.md` の未分析欄を埋めるため、以下の観点を依頼対象とする。
なお、企画書上のP1主対象は `research-memo.md` の3章・4章・8章である。
P1要件定義では、ChatGPTに渡す分析プロンプトの実用性を高めるため、5章・6章・7章についても補助的な確認観点として含める。
ただし、価格情報は自動確定せず、6章・7章も最終判断ではなく人間レビュー用のたたき台として扱う。

| ID            | 観点                         | 扱い                                                                       | `research-memo.md` |
| ------------- | ---------------------------- | -------------------------------------------------------------------------- | ------------------ |
| P1-PROMPT-007 | どんな切り口が多いか         | タイトル・スニペット・追加スニペットから分類する                           | 第3章              |
| P1-PROMPT-008 | 無料部分で何を約束しているか | 検索結果から分かる範囲で推定し、不明な場合は不明とする                     | 第4章              |
| P1-PROMPT-009 | 価格帯はいくらか             | 自動確定しない。検索結果から価格が分からない場合は、確認が必要と出力させる | 第5章              |
| P1-PROMPT-010 | 自分ならどこで差別化できるか | 既存記事候補との差別化軸を提案させる                                       | 第6章              |
| P1-PROMPT-011 | 記事化判断                   | 記事化する価値、注意点、差別化可能性を整理させる                           | 第7章              |
| P1-PROMPT-012 | 次に作るなら                 | 次に作る記事・見出し・切り口の候補を提案させる                             | 第8章              |

### 11.5 プロンプトの制約文

`chatgpt-analysis-prompt.md` には、以下の制約を含める。

```markdown
以下の検索結果は、タイトル・URL・スニペット・追加スニペットのみです。
記事本文、有料部分、正確な価格情報は取得していません。
検索結果に書かれていないことは、断定しないでください。
不明な点は「要確認」としてください。
```

### 11.6 検索結果データの掲載方針

| ID            | 要件                                                                             |
| ------------- | -------------------------------------------------------------------------------- |
| P1-PROMPT-013 | 検索結果データは、URL完全一致重複排除後の結果を掲載する                          |
| P1-PROMPT-014 | 1件ごとに、Platform、Keyword、Title、Url、Snippet、ExtraSnippets、Rankを掲載する |
| P1-PROMPT-015 | P1初回では掲載件数を自動制限しない                                               |
| P1-PROMPT-016 | 検索結果が多い場合も、全件を掲載する                                             |
| P1-PROMPT-017 | APIキー、HTTPヘッダー、本文HTML、有料部分は掲載しない                            |

### 11.7 出力してほしい形式

ChatGPTへの依頼文では、分析結果を以下の形式で返すよう指定する。

```markdown
## 1. 既存記事の主な切り口

## 2. 似たタイトル・近いテーマ

## 3. 無料部分で約束していそうなこと

## 4. 価格・有料情報について確認が必要なこと

## 5. 差別化できそうなポイント

## 6. 記事化判断

## 7. 次に作るなら

## 8. 人間が追加確認すべきこと
```

---

## 12. JSON出力の実装方針

### 12.1 追加するレンダラー候補

P1では、以下のレンダラー追加を想定する。
P0設計書ではP1以降の候補として `jsonRenderer.ts`、`runReportRenderer.ts`、`chatgptPromptRenderer.ts` を挙げていた。
P1要件定義では、JSON出力を `normalized-results.json` と `raw-results.json` に分けるため、JSONレンダラー候補名をより具体化している。

```text
src/renderers/normalizedResultsJsonRenderer.ts
src/renderers/rawResultsJsonRenderer.ts
src/renderers/runReportRenderer.ts
src/renderers/chatgptAnalysisPromptRenderer.ts
```

### 12.2 追加するWriter候補

P1では、以下のWriter追加を想定する。

```text
src/output/jsonResearchResultWriter.ts
src/output/runReportWriter.ts
src/output/chatgptAnalysisPromptWriter.ts
```

Writer名は実装時に分割してもよい。
ただし、責務は「レンダリング」と「ファイル書き込み」を分ける。

### 12.3 UseCase拡張方針

`runResearchUseCase` は、P0の検索・正規化・重複排除結果を使ってP1追加ファイルを生成する。
P1では、P0の `ResearchRunResult` に含まれる件数情報だけでは `raw-results.json` を生成できない。
そのため、UseCase実行中に、クエリごとの成功/失敗結果を `RawSearchQueryResult[]` 相当の内部構造として保持し、`raw-results.json` の入力に使う。
ただし、保存対象は検索結果確認に必要な項目に限定し、HTTPヘッダー、APIキー、スタックトレース、本文HTMLは保持・出力しない。

| ID          | 要件                                                                                 |
| ----------- | ------------------------------------------------------------------------------------ |
| P1-IMPL-001 | P1追加出力のために、Brave Search APIへの追加リクエストを発生させない                 |
| P1-IMPL-002 | P1追加出力は、同一実行内で取得済みの検索結果・失敗情報・warningを使う                |
| P1-IMPL-003 | `normalized-results.json` と `chatgpt-analysis-prompt.md` は、重複排除後の結果を使う |
| P1-IMPL-004 | `raw-results.json` は、クエリ別の取得結果と失敗情報を使う                            |
| P1-IMPL-005 | `run-report.md` は、実行サマリー、失敗情報、warning、生成ファイル一覧を使う          |
| P1-IMPL-006 | P1追加ファイルの生成に成功した場合、`generatedFiles` にファイルパスを追加する        |

---

## 13. Markdown改善要件

P1初回では、`research-memo.md` の分析欄を自動で埋めない。

P1におけるMarkdown改善は、`research-memo.md` 自体の大改修ではなく、`chatgpt-analysis-prompt.md` に分析支援を分離することを中心とする。

| ID        | 要件                                                                |
| --------- | ------------------------------------------------------------------- |
| P1-MD-001 | `research-memo.md` の章構成はP0から変更しない                       |
| P1-MD-002 | `research-memo.md` の「要確認」方針は維持する                       |
| P1-MD-003 | 分析支援は `chatgpt-analysis-prompt.md` に分離する                  |
| P1-MD-004 | P1ではLLM分析結果を `research-memo.md` に自動反映しない             |
| P1-MD-005 | `research-memo.md` の追加改善が必要な場合は、P1後続タスクとして扱う |

---

## 14. 重複排除強化の扱い

P1初回では、重複排除強化を実装しない。

理由は以下である。

- URL正規化のルール設計が必要になる
- クエリパラメータ除去で意味のあるURLまで統合するリスクがある
- note、Qiita、ZennでURL構造が異なる
- タイトル類似判定には誤判定リスクがある
- P1初回の主目的は追加出力の安定化である

| ID           | 要件                                               |
| ------------ | -------------------------------------------------- |
| P1-DEDUP-001 | P1初回ではP0と同じURL完全一致のみで重複排除する    |
| P1-DEDUP-002 | URL正規化は行わない                                |
| P1-DEDUP-003 | クエリパラメータ除去は行わない                     |
| P1-DEDUP-004 | 末尾スラッシュ統一は行わない                       |
| P1-DEDUP-005 | タイトル類似判定は行わない                         |
| P1-DEDUP-006 | 高度な重複排除はP1後続またはP2以降の設計対象とする |

---

## 15. Safety要件

P1でも、P0のSafety要件を継承する。

### 15.1 P1で利用する情報

| ID          | 要件                                                                    |
| ----------- | ----------------------------------------------------------------------- |
| P1-SAFE-001 | P1ではBrave Search APIレスポンス由来の情報のみを利用する                |
| P1-SAFE-002 | P1で扱う記事情報は、タイトル、URL、スニペット、追加スニペットに限定する |
| P1-SAFE-003 | P1追加ファイルにはAPIキーを出力しない                                   |
| P1-SAFE-004 | P1追加ファイルには認証ヘッダーを出力しない                              |
| P1-SAFE-005 | P1追加ファイルには本文HTMLを出力しない                                  |

### 15.2 P1で行わないアクセス

| ID          | 要件                                                       |
| ----------- | ---------------------------------------------------------- |
| P1-SAFE-006 | 検索結果URLに対してHTTP GET等の追加アクセスを行わない      |
| P1-SAFE-007 | 記事本文HTMLを取得しない                                   |
| P1-SAFE-008 | OGP情報を取得しない                                        |
| P1-SAFE-009 | note非公式APIを利用しない                                  |
| P1-SAFE-010 | note本文スクレイピングを行わない                           |
| P1-SAFE-011 | 有料部分を取得しない                                       |
| P1-SAFE-012 | 価格表示、本文中の無料/有料境界を自動取得しない            |
| P1-SAFE-013 | P1の出力では、価格や無料部分の約束を確定情報として扱わない |

### 15.3 ChatGPT分析プロンプトのSafety

| ID          | 要件                                                                                    |
| ----------- | --------------------------------------------------------------------------------------- |
| P1-SAFE-014 | ChatGPT分析プロンプトには、検索結果から分からないことを断定しないよう明記する           |
| P1-SAFE-015 | ChatGPT分析プロンプトには、本文、有料部分、正確な価格情報を取得していないことを明記する |
| P1-SAFE-016 | ChatGPT分析プロンプトには、不明点を「要確認」とするよう明記する                         |

---

## 16. エラー処理要件

### 16.1 P1 exit code定義

P1では、P0のExit Code定義を継承する。

| Exit Code | 名前                | ケース                                              | P1での出力方針                                                        |
| --------: | ------------------- | --------------------------------------------------- | --------------------------------------------------------------------- |
|         0 | SUCCESS             | 全処理成功。検索結果0件も含む                       | 有効な出力フラグに応じて各ファイルを生成する                          |
|         1 | PARTIAL_API_FAILURE | 一部クエリがAPI失敗したが、1件以上のクエリは成功    | 成功分から各出力ファイルを生成し、失敗情報をJSON/reportに含める       |
|         2 | INPUT_ERROR         | CLI引数不正、入力ファイル不正、YAML不正、入力値不正 | APIを呼ばず、出力しない                                               |
|         3 | CONFIG_ERROR        | `.env` または `BRAVE_API_KEY` 不備                  | APIを呼ばず、出力しない                                               |
|         4 | ALL_API_FAILURE     | 生成クエリはあるが、全クエリのAPI呼び出しが失敗     | 可能であれば空CSV、失敗メモ、失敗情報付きJSON/report/promptを生成する |
|         5 | OUTPUT_ERROR        | 出力ディレクトリ作成失敗、ファイル書き込み失敗      | 不完全の可能性あり。生成済みファイルのみ `generatedFiles` に含める    |
|         9 | UNEXPECTED_ERROR    | 想定外例外                                          | 不定                                                                  |

### 16.2 P1追加ファイルの出力失敗

| ID         | ケース                                    | 処理                                  | exit code |
| ---------- | ----------------------------------------- | ------------------------------------- | --------: |
| P1-ERR-001 | `normalized-results.json` 書き込み失敗    | warningを追加し、Exit Code `5` とする |         5 |
| P1-ERR-002 | `raw-results.json` 書き込み失敗           | warningを追加し、Exit Code `5` とする |         5 |
| P1-ERR-003 | `run-report.md` 書き込み失敗              | warningを追加し、Exit Code `5` とする |         5 |
| P1-ERR-004 | `chatgpt-analysis-prompt.md` 書き込み失敗 | warningを追加し、Exit Code `5` とする |         5 |

### 16.3 P1出力とAPI失敗の関係

| ID         | ケース               | 処理                                                                                             |
| ---------- | -------------------- | ------------------------------------------------------------------------------------------------ |
| P1-ERR-005 | 一部API失敗          | 成功分からCSV、Markdown、normalized JSON、promptを生成し、失敗情報をraw JSONとrun-reportに含める |
| P1-ERR-006 | 全API失敗            | 検索結果は空として扱い、可能であれば失敗情報付きの出力ファイルを生成する                         |
| P1-ERR-007 | 検索結果0件          | エラーではなく0件として扱い、空配列・0件メモ・0件レポートを生成する                              |
| P1-ERR-008 | `extraSnippets` 不在 | エラーにせず空配列として扱う                                                                     |
| P1-ERR-009 | URLなし検索結果      | 正規化時に除外し、warning対象にする                                                              |
| P1-ERR-010 | titleなし検索結果    | 正規化時に除外してよい                                                                           |

---

## 17. P1要件定義の受け入れ条件

| ID        | 受け入れ条件                                                                  | 対応要件 |
| --------- | ----------------------------------------------------------------------------- | -------- |
| P1-AC-001 | `docs/requirements/research-memo-builder-p1-requirements.md` が作成されている | 本書     |
| P1-AC-002 | P1対象範囲と対象外が明確になっている                                          | 3章      |
| P1-AC-003 | P0から継承する前提が明確になっている                                          | 4章      |
| P1-AC-004 | P1で解禁する `output.*` フラグが明確になっている                              | 5章      |
| P1-AC-005 | CLIで解禁するもの・解禁しないものが明確になっている                           | 6章      |
| P1-AC-006 | P1追加出力ファイル一覧が明確になっている                                      | 7章      |
| P1-AC-007 | `normalized-results.json` の構造が定義されている                              | 8章      |
| P1-AC-008 | `raw-results.json` の構造が定義されている                                     | 9章      |
| P1-AC-009 | `run-report.md` の章構成が定義されている                                      | 10章     |
| P1-AC-010 | `chatgpt-analysis-prompt.md` の章構成と分析観点が定義されている               | 11章     |
| P1-AC-011 | P1初回で重複排除強化を行わないことが明確になっている                          | 14章     |
| P1-AC-012 | Safety要件がP1追加出力にも適用されている                                      | 15章     |
| P1-AC-013 | P1のエラー処理方針が定義されている                                            | 16章     |
| P1-AC-014 | P1実装受け入れ条件が定義されている                                            | 18章     |

---

## 18. P1実装受け入れ条件

この章は、P1実装完了判定に使用する。

| ID         | 受け入れ条件                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------- |
| P1-IAC-001 | `output.json: true` の入力YAMLで `normalized-results.json` が生成される                           |
| P1-IAC-002 | `output.json: true` の入力YAMLで `raw-results.json` が生成される                                  |
| P1-IAC-003 | `output.runReport: true` の入力YAMLで `run-report.md` が生成される                                |
| P1-IAC-004 | `output.chatgptPrompt: true` の入力YAMLで `chatgpt-analysis-prompt.md` が生成される               |
| P1-IAC-005 | `output.json: false` の場合、`normalized-results.json` と `raw-results.json` は生成されない       |
| P1-IAC-006 | `output.runReport: false` の場合、`run-report.md` は生成されない                                  |
| P1-IAC-007 | `output.chatgptPrompt: false` の場合、`chatgpt-analysis-prompt.md` は生成されない                 |
| P1-IAC-008 | `--dry-run` 指定時はP1追加ファイルが生成されない                                                  |
| P1-IAC-009 | `--dry-run` 指定時はBrave Search APIを呼び出さない                                                |
| P1-IAC-010 | `--out` 指定時はP1追加ファイルも指定先ディレクトリへ出力される                                    |
| P1-IAC-011 | `normalized-results.json` の `results` 件数が重複排除後件数と一致する                             |
| P1-IAC-012 | `normalized-results.json` に `summary`、`failures`、`warnings` が含まれる                         |
| P1-IAC-013 | `raw-results.json` にクエリ別の成功/失敗情報が含まれる                                            |
| P1-IAC-014 | `raw-results.json` にAPIキー、HTTP認証ヘッダー、本文HTML、有料部分が含まれない                    |
| P1-IAC-015 | `run-report.md` に実行日時、入力条件、検索条件、件数、生成ファイル、失敗クエリ、warningが含まれる |
| P1-IAC-016 | `chatgpt-analysis-prompt.md` にChatGPTへ依頼する分析観点と検索結果データが含まれる                |
| P1-IAC-017 | `chatgpt-analysis-prompt.md` に「本文、有料部分、正確な価格情報は取得していない」旨が含まれる     |
| P1-IAC-018 | 一部API失敗時、成功分からP1追加ファイルが生成され、失敗情報がJSON/reportに含まれる                |
| P1-IAC-019 | 全API失敗時、Exit Code `4` で終了し、可能であれば失敗情報付きファイルが生成される                 |
| P1-IAC-020 | 検索結果0件時、Exit Code `0` で終了し、空配列・0件レポート・0件プロンプトが生成される             |
| P1-IAC-021 | P1追加ファイルの出力失敗時、Exit Code `5` で終了する                                              |
| P1-IAC-022 | 入力不正時、Exit Code `2` で終了し、P1追加ファイルは生成されない                                  |
| P1-IAC-023 | APIキー未設定時、Exit Code `3` で終了し、P1追加ファイルは生成されない                             |
| P1-IAC-024 | `--json`、`--run-report`、`--chatgpt-prompt` 指定時は入力不正として停止する                       |
| P1-IAC-025 | `npm run check` が成功する                                                                        |
| P1-IAC-026 | `.env` と `output/` がGit管理対象外である                                                         |
| P1-IAC-027 | 作業完了時に一時フォルト注入コードやデバッグ専用コードが残っていない                              |

---

## 19. 後続フェーズへの接続

P1完了後は、以下の後続タスクへ接続する。

| フェーズ | 候補          | 内容                                                        |
| -------- | ------------- | ----------------------------------------------------------- |
| P1後続   | Markdown改善  | `research-memo.md` の分析支援欄をさらに読みやすくする       |
| P1後続   | 重複排除強化  | URL正規化、クエリパラメータ除去、タイトル類似判定を設計する |
| P2       | キャッシュ    | 同じキーワード・媒体の検索結果を再利用する                  |
| P2       | note RSS連携  | 参考クリエイターやマガジンの新着記事を定点観測する          |
| P2       | 手動URL投入   | 検索に出ない記事を入力YAMLから追加できるようにする          |
| P3       | LLM API連携   | ChatGPT等のAPIで切り口・差別化・記事化判断を自動下書きする  |
| P3       | Mnemosyne連携 | リサーチ結果を外部記憶基盤へ保存する                        |

---

## 20. P1完了判定

P1は、以下を満たした時点で完了と判定する。

- `output.json: true` で `normalized-results.json` と `raw-results.json` が生成される
- `output.runReport: true` で `run-report.md` が生成される
- `output.chatgptPrompt: true` で `chatgpt-analysis-prompt.md` が生成される
- P0既存出力である `search-results.csv` と `research-memo.md` が引き続き生成される
- `--dry-run` ではAPI呼び出しもファイル出力も行われない
- 入力不正、APIキー未設定、部分API失敗、全API失敗、出力失敗の扱いがP0のExit Code方針と整合している
- P1追加ファイルにAPIキー、認証ヘッダー、本文HTML、有料部分が含まれない
- 検索結果URLへの追加HTTPアクセスを行っていない
- 高度な重複排除、キャッシュ、自動リトライ、LLM API連携に踏み込んでいない
- `npm run check` が成功する
- 作業ツリーがクリーンである

---

## Appendix A. P1実装順序案

P1実装は、以下の順序で進めると安全である。

| 順序 | タスク                          | 目的                                                                           |
| ---: | ------------------------------- | ------------------------------------------------------------------------------ |
|    1 | 入力スキーマ修正                | `output.json`、`output.runReport`、`output.chatgptPrompt` の `true` を許可する |
|    2 | Raw結果保持                     | クエリ別の成功/失敗情報を `raw-results.json` 用に保持する                      |
|    3 | JSONレンダラー追加              | `normalized-results.json` と `raw-results.json` を文字列生成する               |
|    4 | JSON writer追加                 | JSONファイルを出力する                                                         |
|    5 | run-reportレンダラー追加        | 実行結果をMarkdownレポート化する                                               |
|    6 | run-report writer追加           | `run-report.md` を出力する                                                     |
|    7 | ChatGPTプロンプトレンダラー追加 | 分析依頼用プロンプトを生成する                                                 |
|    8 | ChatGPTプロンプトwriter追加     | `chatgpt-analysis-prompt.md` を出力する                                        |
|    9 | CLI表示更新                     | dry-runと通常実行の表示にP1追加出力を反映する                                  |
|   10 | 受け入れ確認                    | 正常系、dry-run、入力不正、APIキー未設定、部分失敗、全失敗、出力失敗を確認する |

---

## Appendix B. P1で変更しないもの

P1では以下を変更しない。

- `keywords` の最大件数
- `platforms` の最大件数
- `countPerQuery` の上限
- 検索クエリ形式
- Brave Search API以外の検索API利用
- URL完全一致のみの重複排除
- CSV列定義
- `research-memo.md` の基本章構成
- Exit Code体系
- `.env` / `.env.example` の基本方針
- `.gitignore` の `output/` 除外方針

---

## Appendix C. note記事化に使える観点

P1は、note記事化する場合、以下の切り口にできる。

- P0で「検索結果を出す」だけだったツールを、P1で「再利用できる素材」に変える
- CSVは人間確認用、JSONは後続処理用、run-reportは実行証跡用、ChatGPTプロンプトは分析支援用と役割を分ける
- いきなりAI分析まで自動化せず、まずは「AIに渡しやすい材料」を作る
- 本文取得や有料部分取得をしない安全境界を守りながら、記事制作の前処理を自動化する
- 出力フラグを段階解禁し、P0を壊さずP1へ進める
