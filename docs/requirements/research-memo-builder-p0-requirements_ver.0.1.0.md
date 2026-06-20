---
title: Research Memo Builder P0要件定義書
document_id: research-memo-builder-p0-requirements
status: draft
version: 0.1.0-draft.1
updated: 2026-06-15
project: Research Memo Builder
milestone: M0.5
source_document: docs/research/research-memo-builder-plan.md
---

# Research Memo Builder P0要件定義書

## 1. この文書の位置づけ

この文書は、Research Memo Builder の **M0.5：P0要件定義** 成果物である。

Research Memo Builder は、note記事投稿前の既存記事リサーチを、Brave Search API と TypeScript CLI によって半自動化するためのツールである。

本書では、P0初期実装に必要な要件を定義する。  
実装コードそのものではなく、後続の M1〜M5 で実装・確認すべき仕様の正本候補として扱う。

対象ファイルは以下である。

```text
docs/research/research-memo-builder-p0-requirements.md
```

---

## 2. P0の目的

P0の目的は、記事候補と検索キーワードを入力すると、Brave Search API を使って既存記事候補を取得し、最低限のリサーチメモ作成に使える **CSV** と **Markdown** を出力できる状態を作ることである。

P0では、リサーチメモを完全自動完成させない。  
検索結果をもとに、人間が15分程度で既存記事リサーチを確認・判断できる下準備を作ることを目的とする。

---

## 3. P0対象範囲

### 3.1 P0で対象とすること

| ID | 対象 | 要件概要 |
|---|---|---|
| P0-SCOPE-001 | APIキー管理 | `.env` から `BRAVE_API_KEY` を読み込む |
| P0-SCOPE-002 | 入力 | YAML入力ファイルを1つ読み込む |
| P0-SCOPE-003 | 入力検証 | 必須項目、件数上限、値の妥当性を検証する |
| P0-SCOPE-004 | 検索クエリ生成 | `site:{domain} {keyword}` 形式で検索クエリを生成する |
| P0-SCOPE-005 | Brave Search API接続 | 生成した検索クエリを Brave Search API に送信する |
| P0-SCOPE-006 | 検索件数 | 1クエリあたり `countPerQuery` 件を取得する。初期値は10、上限は20とする |
| P0-SCOPE-007 | ページング制御 | P0ではページングしない |
| P0-SCOPE-008 | 正規化 | Brave Search APIレスポンスを `NormalizedSearchResult` に変換する |
| P0-SCOPE-009 | 重複排除 | 同一URLの単純重複のみ除外する |
| P0-SCOPE-010 | CSV出力 | `search-results.csv` を出力する |
| P0-SCOPE-011 | Markdown出力 | `research-memo.md` を出力する |
| P0-SCOPE-012 | エラー処理 | APIキー未設定、入力不正、API失敗、0件、出力失敗を扱う |
| P0-SCOPE-013 | 安全制約 | note非公式API、本文スクレイピング、有料部分取得を行わない |

### 3.2 P0で対象外とすること

| ID | 対象外 | 理由 |
|---|---|---|
| P0-OOS-001 | ページング検索 | リクエスト数と実装範囲を抑えるため |
| P0-OOS-002 | 20件超の大量取得 | 初期検証には不要なため |
| P0-OOS-003 | 高度な重複判定 | URL正規化、タイトル類似判定はP1以降で扱うため |
| P0-OOS-004 | JSON出力 | P0ではCSVとMarkdownを優先するため |
| P0-OOS-005 | rawレスポンス保存 | P1以降のデバッグ用途として扱うため |
| P0-OOS-006 | 実行レポート出力 | P1で `run-report.md` として扱うため |
| P0-OOS-007 | ChatGPT分析プロンプト出力 | P1で `chatgpt-analysis-prompt.md` として扱うため |
| P0-OOS-008 | LLM APIによる自動分析 | MVP後の拡張とするため |
| P0-OOS-009 | note RSS連携 | P2以降で扱うため |
| P0-OOS-010 | 手動URL投入 | P2以降で扱うため |
| P0-OOS-011 | Mnemosyne連携 | P3以降で扱うため |
| P0-OOS-012 | note非公式API利用 | 仕様変更・停止リスクを避けるため |
| P0-OOS-013 | note本文スクレイピング | 規約、robots.txt、著作権リスクを避けるため |
| P0-OOS-014 | 有料部分取得 | 明確に対象外とするため |
| P0-OOS-015 | Web UI | P0ではCLIで検証可能なため |
| P0-OOS-016 | データベース保存 | P0ではファイル出力で十分なため |
| P0-OOS-017 | キャッシュ | P2以降で扱うため |
| P0-OOS-018 | 自動リトライ | レート制限や一時失敗への高度対応はP1以降で扱うため |

---

## 4. 前提・用語

### 4.1 1リクエストの定義

P0では、Brave Search APIに検索クエリを1回送信することを **1リクエスト** と定義する。

```text
1キーワード × 1媒体 = 1リクエスト
```

例：

```text
site:note.com 家庭内ルール 仕様書
```

これは1リクエストである。

### 4.2 媒体

媒体とは、検索対象サイトを識別する単位である。

P0の初期想定は以下とする。

| 媒体名 | site指定 |
|---|---|
| note | `note.com` |
| Qiita | `qiita.com` |
| Zenn | `zenn.dev` |

### 4.3 検索キーワード

検索キーワードとは、記事候補に関連する既存記事を探すための語句である。

例：

```text
家庭内ルール 仕様書
家庭内ルール 要件定義
家庭内 ポイント制度 設計
子育て 仕組み化 note
家庭内ルール プロダクト設計
```

### 4.4 正規化

正規化とは、Brave Search API のレスポンス形式を、ツール内部で扱う共通形式 `NormalizedSearchResult` に変換することである。

---

## 5. 入力要件

### 5.1 入力ファイル形式

| ID | 要件 |
|---|---|
| P0-IN-001 | 入力ファイルはYAML形式とする |
| P0-IN-002 | CLI引数 `--input` で入力YAMLのパスを指定する |
| P0-IN-003 | P0では1回の実行につき、入力YAMLは1ファイルのみ読み込む |
| P0-IN-004 | 入力YAMLが存在しない場合は処理を停止する |
| P0-IN-005 | YAMLとしてパースできない場合は処理を停止する |

### 5.2 入力YAMLの構造

P0で扱う入力YAMLは以下の構造とする。

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
  searchLang: ja
  uiLang: ja-JP
  extraSnippets: true

output:
  dir: output/research/ats-rule-spec
  csv: true
  markdownMemo: true
  json: false
  runReport: false
  chatgptPrompt: false
```

### 5.3 必須項目

| ID | 項目 | 型 | 必須 | 要件 |
|---|---|---:|---:|---|
| P0-IN-006 | `topic` | string | Yes | 空文字を禁止する |
| P0-IN-007 | `articleType` | object | Yes | `devDiary` / `techArticle` / `paidNoteCandidate` を持つ |
| P0-IN-008 | `articleType.devDiary` | boolean | Yes | true/falseのみ許可する |
| P0-IN-009 | `articleType.techArticle` | boolean | Yes | true/falseのみ許可する |
| P0-IN-010 | `articleType.paidNoteCandidate` | boolean | Yes | true/falseのみ許可する |
| P0-IN-011 | `keywords` | string[] | Yes | 1件以上、5件以下とする |
| P0-IN-012 | `platforms` | object[] | Yes | 1件以上、3件以下とする |
| P0-IN-013 | `platforms[].name` | string | Yes | 空文字を禁止する |
| P0-IN-014 | `platforms[].site` | string | Yes | 空文字、URLスキーム、パスを禁止する |
| P0-IN-015 | `search.countPerQuery` | number | Yes | 1以上20以下とする。未指定時は10とする実装でもよい |
| P0-IN-016 | `search.country` | string | Yes | P0初期値は `JP` とする |
| P0-IN-017 | `search.searchLang` | string | Yes | P0初期値は `ja` とする |
| P0-IN-018 | `search.uiLang` | string | Yes | P0初期値は `ja-JP` とする |
| P0-IN-019 | `search.extraSnippets` | boolean | Yes | true/falseのみ許可する。P0初期値はtrueとする |
| P0-IN-020 | `output.dir` | string | Yes | 空文字、絶対パス、`../` を禁止する |
| P0-IN-021 | `output.csv` | boolean | Yes | P0ではtrueであることを必須とする |
| P0-IN-022 | `output.markdownMemo` | boolean | Yes | P0ではtrueであることを必須とする |

### 5.4 P0ではfalse固定にする出力フラグ

| ID | 項目 | P0要件 |
|---|---|---|
| P0-IN-023 | `output.json` | P0ではfalseとする。trueの場合は入力不正として停止する |
| P0-IN-024 | `output.runReport` | P0ではfalseとする。trueの場合は入力不正として停止する |
| P0-IN-025 | `output.chatgptPrompt` | P0ではfalseとする。trueの場合は入力不正として停止する |

### 5.5 入力バリデーション方針

| ID | 要件 |
|---|---|
| P0-IN-026 | `articleType` は3項目のうち最低1つがtrueであること |
| P0-IN-027 | `keywords` の各要素はtrim後に空文字でないこと |
| P0-IN-028 | `keywords` の重複は入力不正ではなく、trim後の同一文字列を1件に統合してもよい |
| P0-IN-029 | `platforms[].site` は `note.com` のようなドメイン形式のみ許可する |
| P0-IN-030 | `platforms[].site` に `https://`、`http://`、`/path` が含まれる場合は入力不正とする |
| P0-IN-031 | 入力不正時はBrave Search APIを呼び出さない |

---

## 6. 検索要件

### 6.1 検索クエリ生成

| ID | 要件 |
|---|---|
| P0-SEA-001 | 検索クエリは `site:{platform.site} {keyword}` 形式で生成する |
| P0-SEA-002 | 1キーワード × 1媒体につき1クエリを生成する |
| P0-SEA-003 | クエリ生成順は、入力YAMLの `platforms` 順 × `keywords` 順を基本とする |
| P0-SEA-004 | P0では `site:` 以外の高度な検索演算子を自動付与しない |
| P0-SEA-005 | 生成した検索クエリは、CSVの `Query` 列に出力する |

例：

```text
site:note.com 家庭内ルール 仕様書
site:qiita.com 家庭内ルール 仕様書
site:zenn.dev 家庭内ルール 仕様書
```

### 6.2 API呼び出し

| ID | 要件 |
|---|---|
| P0-SEA-006 | Brave Search APIを検索APIとして使用する |
| P0-SEA-007 | APIキーはHTTPヘッダーに設定する |
| P0-SEA-008 | `search.countPerQuery` を検索件数として利用する |
| P0-SEA-009 | P0では `countPerQuery` の上限を20とする |
| P0-SEA-010 | P0ではページング取得を行わない |
| P0-SEA-011 | P0では `offset` を指定しない、または初期ページ相当に固定する |
| P0-SEA-012 | `country`、`searchLang`、`uiLang`、`extraSnippets` は入力YAMLの値を利用する |
| P0-SEA-013 | `extraSnippets` が取得できない場合でも検索処理全体は継続する |

### 6.3 検索実行制御

| ID | 要件 |
|---|---|
| P0-SEA-014 | P0ではクエリを逐次実行する |
| P0-SEA-015 | P0では並列実行を必須としない |
| P0-SEA-016 | P0ではキャッシュを使用しない |
| P0-SEA-017 | P0では自動リトライを行わない |
| P0-SEA-018 | 1クエリが失敗しても、他クエリの検索は継続する |
| P0-SEA-019 | すべてのクエリが失敗した場合でも、原因が分かるエラーメッセージを表示する |

### 6.4 リクエスト数の見積もり

| ID | 要件 |
|---|---|
| P0-SEA-020 | 実行前または実行ログで、生成クエリ数を確認できることが望ましい |
| P0-SEA-021 | 5キーワード × 3媒体の場合、15クエリを生成する |
| P0-SEA-022 | P0では1記事候補あたりおおむね15リクエスト以内に収まる入力を標準とする |

---

## 7. 正規化要件

### 7.1 正規化DTO

P0では、検索結果を以下の `NormalizedSearchResult` に変換する。

```ts
export type NormalizedSearchResult = {
  keyword: string;
  platform: string;
  query: string;
  rank: number;
  title: string;
  url: string;
  snippet?: string;
  extraSnippets?: string[];
  retrievedAt: string;
};
```

### 7.2 フィールド要件

| ID | フィールド | 要件 |
|---|---|---|
| P0-NOR-001 | `keyword` | 検索に使用したキーワードを設定する |
| P0-NOR-002 | `platform` | 入力YAMLの `platforms[].name` を設定する |
| P0-NOR-003 | `query` | 実際に送信した検索クエリを設定する |
| P0-NOR-004 | `rank` | Brave Search APIレスポンス内の順位を1始まりで設定する |
| P0-NOR-005 | `title` | 検索結果タイトルを設定する |
| P0-NOR-006 | `url` | 検索結果URLを設定する |
| P0-NOR-007 | `snippet` | 検索結果の説明文を設定する。存在しない場合は空欄扱いとする |
| P0-NOR-008 | `extraSnippets` | 追加スニペットが存在する場合のみ配列で設定する |
| P0-NOR-009 | `retrievedAt` | 検索取得日時をISO 8601形式で設定する |

### 7.3 除外・補正方針

| ID | 要件 |
|---|---|
| P0-NOR-010 | URLが存在しない検索結果は除外する |
| P0-NOR-011 | titleが存在しない検索結果は、P0では除外してもよい |
| P0-NOR-012 | `snippet` が存在しない場合はエラーにしない |
| P0-NOR-013 | `extraSnippets` が存在しない場合は空配列または空欄として扱う |
| P0-NOR-014 | CSV出力時、`extraSnippets` は改行を避け、区切り文字で連結してよい |
| P0-NOR-015 | Markdown出力時、タイトル、URL、スニペットはMarkdown崩れを防ぐために必要最小限のエスケープを行う |

### 7.4 重複排除要件

| ID | 要件 |
|---|---|
| P0-NOR-016 | P0ではURL完全一致のみを重複判定対象とする |
| P0-NOR-017 | URL完全一致の重複がある場合、最初に取得した1件を採用する |
| P0-NOR-018 | P0ではURLの正規化、クエリパラメータ除去、末尾スラッシュ統一は行わない |
| P0-NOR-019 | P0ではタイトル類似判定を行わない |
| P0-NOR-020 | 重複排除後の結果をCSVとMarkdownの出力対象とする |

---

## 8. 出力要件

### 8.1 出力先

| ID | 要件 |
|---|---|
| P0-OUT-001 | 出力先は入力YAMLの `output.dir` を使用する |
| P0-OUT-002 | `output.dir` が存在しない場合は作成する |
| P0-OUT-003 | `output.dir` が作成できない場合は処理を停止する |
| P0-OUT-004 | P0では出力先に絶対パスや `../` を許可しない |

### 8.2 P0必須出力ファイル

P0で必須とする出力ファイルは以下である。

```text
output/research/{slug}/
  search-results.csv
  research-memo.md
```

| ID | ファイル | 要件 |
|---|---|---|
| P0-OUT-005 | `search-results.csv` | 検索結果一覧をCSV形式で出力する |
| P0-OUT-006 | `research-memo.md` | リサーチメモMarkdownの最小版を出力する |

### 8.3 CSV出力要件

`search-results.csv` の列は以下とする。

| ID | 列名 | 内容 |
|---|---|---|
| P0-CSV-001 | `Keyword` | 検索キーワード |
| P0-CSV-002 | `Platform` | 媒体名 |
| P0-CSV-003 | `Title` | 検索結果タイトル |
| P0-CSV-004 | `Url` | 検索結果URL |
| P0-CSV-005 | `Snippet` | 検索結果スニペット |
| P0-CSV-006 | `ExtraSnippets` | 追加スニペット。複数ある場合は連結する |
| P0-CSV-007 | `Rank` | 検索結果順位 |
| P0-CSV-008 | `Query` | 実際に送信した検索クエリ |
| P0-CSV-009 | `RetrievedAt` | 取得日時 |

追加要件：

| ID | 要件 |
|---|---|
| P0-CSV-010 | CSVはUTF-8で出力する |
| P0-CSV-011 | カンマ、ダブルクォート、改行を含む値はCSVとして壊れないようにエスケープする |
| P0-CSV-012 | 重複排除後の結果のみを出力する |
| P0-CSV-013 | 検索結果が0件でも、ヘッダー行を持つCSVを出力する |

### 8.4 Markdownリサーチメモ出力要件

`research-memo.md` は、P0では以下の構成とする。

```markdown
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

各章の出力方針は以下とする。

| ID | 章 | P0出力方針 |
|---|---|---|
| P0-MD-001 | 対象記事候補 | 入力YAMLの `topic` と `articleType` を出力する |
| P0-MD-002 | 検索条件 | 対象媒体、件数、extraSnippets設定を出力する |
| P0-MD-003 | 1. 検索したキーワード | 入力YAMLの `keywords` を出力する |
| P0-MD-004 | 2. 似たタイトルがあるか | 検索結果のタイトル、URL、媒体、キーワードを一覧化する |
| P0-MD-005 | 3. どんな切り口が多いか | P0では「要確認」欄を生成する |
| P0-MD-006 | 4. 無料部分で何を約束しているか | P0では「要確認」欄を生成する |
| P0-MD-007 | 5. 価格帯はいくらか | P0では「要確認」欄を生成する |
| P0-MD-008 | 6. 自分ならどこで差別化できるか | 固定の差別化観点テンプレートを出力する |
| P0-MD-009 | 7. 記事化判断 | 判断テンプレートを出力する |
| P0-MD-010 | 8. 次に作るなら | P0では「要確認」欄を生成する |
| P0-MD-011 | P0生成メモ | P0では本文取得していないこと、価格は確定していないこと、有料部分は取得していないことを明記する |

### 8.5 Markdown上の注意書き

P0の `research-memo.md` には、以下の注意書きを含める。

```markdown
> このメモは検索結果のタイトル・URL・スニペットをもとにしたP0下書きです。  
> 記事本文、有料部分、正確な価格情報は取得していません。  
> 切り口、無料部分の約束、価格帯は人間レビューで確認してください。
```

---

## 9. エラー処理要件

### 9.1 即停止するエラー

| ID | ケース | 処理 |
|---|---|---|
| P0-ERR-001 | `BRAVE_API_KEY` 未設定 | API呼び出し前に停止する |
| P0-ERR-002 | 入力ファイル未指定 | 停止する |
| P0-ERR-003 | 入力ファイルが存在しない | 停止する |
| P0-ERR-004 | YAMLパース失敗 | 停止する |
| P0-ERR-005 | 必須項目不足 | 停止する |
| P0-ERR-006 | 入力値不正 | 停止する |
| P0-ERR-007 | 出力ディレクトリ作成失敗 | 停止する |
| P0-ERR-008 | ファイル書き込み失敗 | 停止する |

### 9.2 継続するエラー・例外状態

| ID | ケース | 処理 |
|---|---|---|
| P0-ERR-009 | 一部クエリのAPI失敗 | 対象クエリのみ失敗扱いにし、他クエリを継続する |
| P0-ERR-010 | HTTP 429 レート制限 | P0では対象クエリを失敗扱いにし、自動リトライしない |
| P0-ERR-011 | HTTP 5xx | P0では対象クエリを失敗扱いにし、自動リトライしない |
| P0-ERR-012 | 検索結果0件 | エラーではなく0件として扱う |
| P0-ERR-013 | `extraSnippets` 不在 | エラーにせず空欄として扱う |
| P0-ERR-014 | 一部検索結果にURLがない | 対象結果を除外し、処理を継続する |

### 9.3 エラーメッセージ要件

| ID | 要件 |
|---|---|
| P0-ERR-015 | エラーメッセージには、ユーザーが次に直すべき項目を含める |
| P0-ERR-016 | APIキー値そのものをエラーメッセージに含めない |
| P0-ERR-017 | APIキー値そのものをログに出力しない |
| P0-ERR-018 | 一部クエリ失敗時は、失敗したクエリとHTTPステータスを確認できるようにする |
| P0-ERR-019 | P0では専用の `run-report.md` は出力しない |

---

## 10. APIキー管理要件

### 10.1 `.env`

P0では、Brave Search APIキーを `.env` から読み込む。

```env
BRAVE_API_KEY=your-brave-api-key
```

| ID | 要件 |
|---|---|
| P0-KEY-001 | APIキーは `BRAVE_API_KEY` として管理する |
| P0-KEY-002 | APIキーはコードに直接書かない |
| P0-KEY-003 | APIキーは `.env` から読み込む |
| P0-KEY-004 | `.env` はGit管理しない |
| P0-KEY-005 | `.env.example` をGit管理対象として用意する |
| P0-KEY-006 | `.env.example` にはAPIキーの実値を書かない |

### 10.2 `.env.example`

```env
BRAVE_API_KEY=
```

### 10.3 `.gitignore`

```gitignore
.env
output/
```

### 10.4 漏洩防止

| ID | 要件 |
|---|---|
| P0-KEY-007 | APIキーを標準出力に表示しない |
| P0-KEY-008 | APIキーを標準エラーに表示しない |
| P0-KEY-009 | APIキーをCSVに出力しない |
| P0-KEY-010 | APIキーをMarkdownに出力しない |
| P0-KEY-011 | APIエラーの詳細を出す場合でも、認証ヘッダー値は表示しない |

---

## 11. CLI要件

### 11.1 基本実行

P0の基本実行コマンドは以下を想定する。

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml
```

| ID | 要件 |
|---|---|
| P0-CLI-001 | `--input` で入力YAMLを指定できる |
| P0-CLI-002 | `--input` 未指定時はエラーにする |
| P0-CLI-003 | P0では `--out` の実装は任意とし、入力YAMLの `output.dir` を優先する |
| P0-CLI-004 | P0では `--dry-run` は必須要件に含めない |
| P0-CLI-005 | P0では `--use-cache` を実装しない |

---

## 12. P0受け入れ条件

| ID | 受け入れ条件 | 対応要件 |
|---|---|---|
| P0-AC-001 | `docs/research/research-memo-builder-p0-requirements.md` が作成されている | 本書 |
| P0-AC-002 | P0対象範囲と対象外が明確になっている | 3章 |
| P0-AC-003 | 入力YAMLの必須項目、型、制約が定義されている | 5章 |
| P0-AC-004 | 5キーワード×3媒体で15クエリが生成されることが定義されている | 6章 |
| P0-AC-005 | 検索クエリ形式が `site:{domain} {keyword}` として定義されている | 6章 |
| P0-AC-006 | 1クエリあたりの取得件数が初期値10、上限20として定義されている | 6章 |
| P0-AC-007 | P0ではページングしないことが定義されている | 6章 |
| P0-AC-008 | `NormalizedSearchResult` の構造が定義されている | 7章 |
| P0-AC-009 | URL完全一致による単純重複排除が定義されている | 7章 |
| P0-AC-010 | `search-results.csv` の出力列が定義されている | 8章 |
| P0-AC-011 | `research-memo.md` の章構成が定義されている | 8章 |
| P0-AC-012 | APIキー未設定時に停止することが定義されている | 9章、10章 |
| P0-AC-013 | 入力不正時にAPI呼び出し前に停止することが定義されている | 5章、9章 |
| P0-AC-014 | 一部API失敗時は他クエリを継続することが定義されている | 9章 |
| P0-AC-015 | 検索結果0件をエラー扱いしないことが定義されている | 9章 |
| P0-AC-016 | APIキーをログ、CSV、Markdownに出さないことが定義されている | 10章 |
| P0-AC-017 | note非公式API、本文スクレイピング、有料部分取得を行わないことが定義されている | 3章、8章 |
| P0-AC-018 | JSON、run-report、ChatGPT分析プロンプトがP0対象外として定義されている | 3章、5章 |

---

## 13. 後続マイルストーンへの接続

本書のP0要件は、後続のマイルストーンに以下のように接続する。

| マイルストーン | 接続内容 |
|---|---|
| M1：プロジェクト雛形作成 | CLI、ディレクトリ、`.env.example`、入力YAMLサンプルを作成する |
| M2：Brave Search API接続 | APIキー読み込み、1キーワード×1媒体検索、エラー処理を実装する |
| M3：複数キーワード・複数媒体検索 | クエリ生成、逐次実行、正規化、重複排除を実装する |
| M4：CSV出力 | `search-results.csv` を出力する |
| M5：Markdownリサーチメモ最小出力 | `research-memo.md` を出力する |
| M6：P1拡張 | JSON、run-report、ChatGPT分析プロンプトに進む |

---

## 14. P0完了判定

P0要件定義は、以下を満たした時点で完了とする。

- P0対象範囲が明確である
- P0対象外が明確である
- 入力YAMLの構造と制約が明確である
- 検索クエリ生成ルールが明確である
- Brave Search API利用時の件数・ページング方針が明確である
- 検索結果の正規化DTOが明確である
- CSV出力仕様が明確である
- Markdownリサーチメモ出力仕様が明確である
- エラー処理方針が明確である
- APIキー管理方針が明確である
- 受け入れ条件が明確である

---

## 15. Draft版レビュー観点

Active化前に、以下を確認する。

| 観点 | 確認内容 |
|---|---|
| Scope | P0に詰め込みすぎていないか |
| Input | 入力YAMLが実装可能な粒度になっているか |
| Search | Brave Search API呼び出しの前提が過不足ないか |
| Cost | 1記事候補あたりのリクエスト数を抑えられているか |
| Safety | note非公式API、本文スクレイピング、有料部分取得を明確に排除できているか |
| Output | CSVとMarkdownだけでP0目的を満たせるか |
| Error | 即停止と継続の境界が明確か |
| API Key | 漏洩防止要件が十分か |
| Acceptance | 後続実装の完了判定に使える粒度になっているか |
