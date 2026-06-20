---
title: Research Memo Builder P0要件定義書
document_id: research-memo-builder-p0-requirements
status: active
version: 1.0.0
updated: 2026-06-16
project: Research Memo Builder
---

# Research Memo Builder P0要件定義書

## 1. この文書の位置づけ

この文書は、Research Memo Builder のP0実装要件を定義する。

Research Memo Builder は、note記事投稿前の既存記事リサーチを、Brave Search APIとTypeScript CLIで半自動化するためのツールである。

P0では、入力YAMLを読み込み、Brave Search APIのWeb検索結果を取得し、検索結果CSVとMarkdown形式のリサーチメモ最小版を生成する。

## 2. P0対象範囲

P0で扱う範囲は以下とする。

| 区分 | 内容 |
| --- | --- |
| 入力 | YAMLファイルを1つ読み込む |
| APIキー | プロジェクトルートの `.env` から `BRAVE_API_KEY` を読み込む |
| 検索 | `site:{domain} {keyword}` 形式の検索クエリを生成する |
| 検索API | Brave Search APIのWeb Searchを利用する |
| 件数 | 1クエリあたり既定10件 |
| ページング | 行わない |
| 正規化 | Brave Search APIレスポンスを内部DTOへ変換する |
| 重複排除 | URL完全一致のみを重複として除外する |
| CSV出力 | `search-results.csv` を生成する |
| Markdown出力 | `research-memo.md` を生成する |
| エラー処理 | 入力不正、APIキー未設定、全失敗、部分失敗、0件を扱う |

## 3. P0対象外

P0では以下を対象外とする。

- JSON出力
- run-report出力
- ChatGPT分析プロンプト出力
- LLM API連携
- note RSS連携
- 手動URL投入
- Mnemosyne連携
- note非公式API利用
- note本文スクレイピング
- 有料部分取得
- 検索結果URLへの直接HTTPアクセス
- ページング検索
- 高度な重複判定
- 価格情報の自動確定
- 無料部分の約束内容の自動確定

`output.json`、`output.runReport`、`output.chatgptPrompt` は省略可能とする。P0で `true` が指定された場合は入力不正として扱う。

## 4. 入力要件

### 4.1 入力ファイル

CLIは、`--input` で指定されたYAMLファイルを読み込む。

例：

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml
```

`--input` が未指定の場合は、以下を既定値とする。

```text
research/inputs/ats-rule-spec.yaml
```

### 4.2 必須項目

| 項目 | 必須 | 内容 |
| --- | --- | --- |
| `topic` | yes | リサーチ対象の記事候補タイトル |
| `articleType` | yes | 記事種別フラグ |
| `keywords` | yes | 検索キーワード配列 |
| `platforms` | yes | 検索対象媒体配列 |
| `output.dir` | yes | 出力先ディレクトリ |

### 4.3 任意項目と既定値

`search` 配下は任意とし、未指定時はP0既定値を補完する。

| 項目 | 既定値 | 内容 |
| --- | --- | --- |
| `search.countPerQuery` | `10` | 1クエリあたりの取得件数 |
| `search.country` | `JP` | Brave Search APIの国指定 |
| `search.searchLang` | `ja` | 検索言語 |
| `search.uiLang` | `ja-JP` | UI言語 |
| `search.extraSnippets` | `true` | 追加スニペット取得指定 |

`output.csv` と `output.markdownMemo` は未指定時に `true` として扱う。

`output.json`、`output.runReport`、`output.chatgptPrompt` は未指定時に `false` として扱う。

### 4.4 入力バリデーション

以下の場合は入力不正として即停止する。

- `topic` が空
- `keywords` が空
- `platforms` が空
- `platforms[].name` が空
- `platforms[].site` が空
- `output.dir` が空
- `search.countPerQuery` が1未満または20超
- P0対象外出力フラグが `true`
- `platforms[].site` に重複がある

## 5. 検索要件

### 5.1 クエリ生成

1キーワード × 1媒体を1検索クエリとして扱う。

形式は以下とする。

```text
site:{platform.site} {keyword}
```

例：

```text
site:note.com 家庭内ルール 仕様書
```

### 5.2 リクエスト数

標準想定は以下とする。

```text
5キーワード × 3媒体 = 15リクエスト
```

P0ではページングを行わない。

### 5.3 Brave Search APIパラメータ対応表

| 入力項目 | Brave Search API想定パラメータ | 備考 |
| --- | --- | --- |
| 生成クエリ | `q` | `site:{domain} {keyword}` |
| `search.countPerQuery` | `count` | 既定10、最大20 |
| `search.country` | `country` | 既定 `JP` |
| `search.searchLang` | `search_lang` | 既定 `ja` |
| `search.uiLang` | `ui_lang` | 既定 `ja-JP` |
| `search.extraSnippets` | `extra_snippets` | 既定 `true` |

### 5.4 Safety要件

P0では、Brave Search APIレスポンスのみを利用する。

検索結果URLに対して、追加のHTTP GET、HTML取得、本文取得、スクレイピングを行ってはならない。

## 6. 正規化要件

Brave Search APIの検索結果を、以下の内部DTOへ正規化する。

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

`extraSnippets` は存在しない場合、空配列または未定義として扱う。

## 7. 重複排除要件

P0では、URLの完全一致のみを重複として扱う。

同一URLが複数クエリで取得された場合は、最初に取得した結果を残す。

以下はP1以降に送る。

- URL正規化
- クエリパラメータ除去
- タイトル類似判定
- 同一記事の別URL判定

## 8. 出力要件

### 8.1 出力先

出力先は `output.dir` に従う。

既存ファイルがある場合、P0では上書きする。

### 8.2 P0出力ファイル

P0では以下の2ファイルを出力する。

```text
search-results.csv
research-memo.md
```

### 8.3 CSV出力

CSVはUTF-8 BOM付きで出力する。

列は以下とする。

| 列 | 内容 |
| --- | --- |
| `Keyword` | 検索キーワード |
| `Platform` | 媒体名 |
| `Title` | 検索結果タイトル |
| `Url` | 検索結果URL |
| `Snippet` | 検索結果スニペット |
| `ExtraSnippets` | 追加スニペット。複数ある場合は ` / ` で連結 |
| `Rank` | クエリ内順位 |
| `Query` | 実行クエリ |
| `RetrievedAt` | 取得日時ISO文字列 |

### 8.4 Markdown出力

`research-memo.md` は、以下の章立てで生成する。

```markdown
# リサーチメモ

## 対象記事候補

## 1. 検索したキーワード

## 2. 似たタイトルがあるか

## 3. どんな切り口が多いか

## 4. 無料部分で何を約束しているか

## 5. 価格帯はいくらか

## 6. 自分ならどこで差別化できるか

## 7. 記事化判断

## 8. 次に作るなら
```

「2. 似たタイトルがあるか」には、タイトル、URL、媒体、スニペットを一覧表示する。

## 9. エラー処理要件

| ケース | exit code | 出力方針 |
| --- | ---: | --- |
| 正常終了 | 0 | CSVとMarkdownを出力する |
| 入力YAML不正 | 1 | 出力しない |
| APIキー未設定 | 1 | 出力しない |
| 全クエリ失敗 | 1 | 出力しない |
| 部分失敗 | 0 | 成功分のみ出力し、失敗クエリを標準エラーに出す |
| 全クエリ成功だが0件 | 0 | 空のCSVとMarkdownテンプレートを出力する |
| 出力ファイル書き込み失敗 | 1 | 途中生成物があっても失敗として扱う |

APIキー値は標準出力、標準エラー、CSV、Markdownに出してはならない。

## 10. APIキー管理要件

APIキーはプロジェクトルートの `.env` から読み込む。

```env
BRAVE_API_KEY=your-brave-api-key
```

`.env` はGit管理しない。

`.env.example` のみGit管理する。

## 11. P0実装受け入れ条件

P0実装の受け入れ条件は以下とする。

- `npm run research -- --input research/inputs/ats-rule-spec.yaml` が実行できる
- `.env` の `BRAVE_API_KEY` を使ってBrave Search APIを呼び出せる
- 5キーワード×3媒体の検索クエリを生成できる
- ページング検索を行わない
- 検索結果URLへHTTPアクセスしない
- Brave Search APIレスポンスを `NormalizedSearchResult` に正規化できる
- URL完全一致重複を除外できる
- `search-results.csv` をUTF-8 BOM付きで出力できる
- `research-memo.md` を出力できる
- Markdownの似たタイトル一覧にスニペットが含まれる
- APIキー未設定時にexit code 1で停止する
- 入力不正時にexit code 1で停止する
- 全クエリ失敗時にexit code 1で停止する
- 部分失敗時は成功分を出力してexit code 0で終了する
- 全クエリ0件時は空のCSVとMarkdownテンプレートを出力してexit code 0で終了する
- APIキーがログや出力ファイルに出力されない

## 12. M0.5要件定義完了条件

この文書の完了条件は以下とする。

- P0対象範囲が定義されている
- P0対象外が定義されている
- 入力要件が定義されている
- 検索要件が定義されている
- 正規化要件が定義されている
- 出力要件が定義されている
- エラー処理要件が定義されている
- APIキー管理要件が定義されている
- P0実装受け入れ条件が定義されている
