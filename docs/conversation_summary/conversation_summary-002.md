# 引き継ぎまとめ

## 実施内容

- **Research Memo Builder** のM0.5作業として、P0要件定義書のドラフト版作成を実施した。
- 作成対象ファイルは以下。

  - `docs/research/research-memo-builder-p0-requirements.md`

- 参照元は、事前に作成済みの **Active版企画書**。

  - 企画名：`Research Memo Builder`
  - 目的：note記事投稿前リサーチを、Brave Search API + TypeScript CLIで半自動化する
  - P0の位置づけ：実装前の要件定義工程

- P0要件定義書ドラフト版では、以下を整理した。

  - P0対象範囲
  - P0対象外
  - 入力要件
  - 検索要件
  - 正規化要件
  - 出力要件
  - エラー処理要件
  - APIキー管理要件
  - P0受け入れ条件

- ドラフト版に対して、Active化前レビューを実施した。
- レビュー観点は以下。

  - Scope
  - Input
  - Search
  - Cost
  - Safety
  - Output
  - Error
  - API Key
  - Acceptance

- レビュー結果として、**P0修正後にActive化可** と判定した。
- Active化前に必要なP0修正点として、以下を洗い出した。

  - 入力項目の必須/任意/デフォルト値の矛盾解消
  - P0対象外出力フラグの扱い整理
  - 全クエリ失敗時、部分失敗時、0件時の終了判定定義
  - Brave Search APIパラメータへのマッピング定義
  - 検索結果URLへ直接HTTPアクセスしない安全要件の明文化
  - Markdown検索結果一覧へのスニペット追加
  - P0実装受け入れ条件の追加

- P1修正点として、以下を洗い出した。

  - CSVのBOM有無の明記
  - 既存出力ファイルの上書き方針定義
  - `platforms[].site` の重複扱い定義
  - `.env` の読み込み位置の明記

- その後、P0/P1修正を反映した **P0要件定義書 Active化版** を作成した。
- Active化版では、frontmatterを以下に更新した。

  - `status: active`
  - `version: 1.0.0`

- Active化版の対象ファイルは以下。

  - `docs/research/research-memo-builder-p0-requirements.md`

---

## 決定事項

- `docs/research/research-memo-builder-p0-requirements.md` を **Research Memo Builder のP0要件定義書** として作成する。
- P0要件定義書のstatusは以下とする。

  - `status: active`

- P0要件定義書のversionは以下とする。

  - `version: 1.0.0`

- P0では、出力対象を以下に絞る。

  - `search-results.csv`
  - `research-memo.md`

- P0では、以下を対象外とする。

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

- P0では、Brave Search APIレスポンスのみを利用する。
- P0では、検索結果URLに対して追加のHTTP GET等を行わない。
- P0では、検索クエリ数を以下の考え方で制御する。

  - `1キーワード × 1媒体 = 1リクエスト`
  - 標準想定は `5キーワード × 3媒体 = 15リクエスト`

- P0では、ページング検索は行わない。
- P0では、同一URLの完全一致重複のみを除外する。
- 高度な重複判定はP1以降に送る。
- `search` 配下の入力項目は、未指定時にP0既定値を補完する方針とした。
- P0対象外の出力フラグは省略可とし、`true` 指定時は入力不正として扱う方針とした。
- APIキーは `.env` の `BRAVE_API_KEY` から読み込む。
- APIキーは、標準出力、標準エラー、CSV、Markdownに出力しない。
- `.env` はプロジェクトルートから読み込む前提とした。
- CSVのBOM有無、既存ファイルの上書き方針、`platforms[].site` の重複扱いもActive化版に反映した。
- P0実装受け入れ条件を、M0.5要件定義の完了条件とは別に定義した。

---

## 未解決事項

- Active化版の内容について、実ファイル上の最終レビューは未実施。

  - 要確認：`docs/research/research-memo-builder-p0-requirements.md`

- P0要件定義書に基づく実装は未着手。
- 次マイルストーンである **M1：プロジェクト雛形作成** は未実施。
- 以下のファイル作成は未実施。

  - `package.json`
  - `tsconfig.json`
  - `.env.example`
  - `.gitignore`
  - `src/cli/research.ts`
  - `research/inputs/ats-rule-spec.yaml`

- Brave Search APIへの実接続は未実施。
- `NormalizedSearchResult` などのDTO実装は未実施。
- CSVレンダラー、Markdownレンダラーは未実装。
- 入力YAMLのバリデーション方式は未確認。

  - 手書きバリデーションにするか
  - Zod等のschema validationを使うか
  - 要確認

- HTTPクライアントの選定は未確認。

  - Node標準 `fetch`
  - axios等
  - 要確認

- CSV出力ライブラリを使うか、自前で出力するかは未確認。
- Markdownテンプレートの最終フォーマットは要確認。
- API失敗時のログ粒度はP0要件上は整理したが、具体的な実装形式は未確認。
- `.env` 読み込みライブラリは未確認。

  - `dotenv` を使う想定が自然だが、会話内では最終決定していない。

- テスト方針は未整理。

  - 単体テストの有無
  - fixtureの作り方
  - dry-run確認の扱い
  - 要確認

---

## 次アクション

### P0：最優先

- `docs/research/research-memo-builder-p0-requirements.md` のActive化版を確認する。

  - frontmatterが以下になっていることを確認する。

    - `status: active`
    - `version: 1.0.0`

  - P0/P1レビュー修正が反映されていることを確認する。

### P1：次に着手

- **M1：プロジェクト雛形作成** に進む。
- まず以下のファイル・ディレクトリを作成する。

  - `package.json`
  - `tsconfig.json`
  - `.env.example`
  - `.gitignore`
  - `src/cli/research.ts`
  - `research/inputs/ats-rule-spec.yaml`
  - `docs/research/research-memo-builder-p0-requirements.md`

- `package.json` に最低限のnpm scriptsを定義する。

  - `research`
  - `typecheck`
  - `format`
  - `format:check`
  - `check`

### P2：M1後に着手

- P0要件定義書を見ながら、以下の設計を具体化する。

  - 入力YAML型
  - DTO
  - CLI引数
  - 出力ファイル構成
  - エラーコード
  - ディレクトリ構成

- 特に最初に見るべきファイルは以下。

  - `docs/research/research-memo-builder-p0-requirements.md`
  - Active版企画書
  - `research/inputs/ats-rule-spec.yaml` 作成予定ファイル

### P3：実装開始時

- 最初の実装順は以下がよい。

  1. プロジェクト雛形
  2. `.env` 読み込み
  3. 入力YAML読み込み
  4. 入力バリデーション
  5. dry-run相当の検索クエリ生成
  6. Brave Search API接続
  7. 正規化DTO変換
  8. URL重複排除
  9. CSV出力
  10. Markdown出力

---

## 気づき

- P0要件定義は、単なる「何を作るか」ではなく、後続実装の迷いを減らすための境界線決めとして重要だった。
- 「必須項目」と「デフォルト値」は、要件書上で矛盾しやすい。

  - 実装前に整理しておくと、バリデーション実装が楽になる。

- 「P0対象外」は、ただ列挙するだけでは不十分。

  - `true` 指定された場合に入力不正にするなど、実装上の扱いまで決める必要がある。

- 安全要件では、「本文スクレイピングしない」だけでは少し曖昧。

  - 「検索結果URLへHTTPアクセスしない」と明記すると、実装上の禁止ラインが明確になる。

- API失敗と検索結果0件は、要件上で区別しておく必要がある。

  - 0件は正常結果
  - API失敗は異常または部分異常

- 受け入れ条件は2種類に分けると整理しやすい。

  - 要件定義書の受け入れ条件
  - 実装完了の受け入れ条件

- P0は小さく切るほど実装に入りやすい。

  - JSON、run-report、ChatGPT分析プロンプトは魅力的だが、P0から外した判断は妥当。

- 1記事候補あたりのリクエスト数を、`キーワード数 × 媒体数` で見積もれる形にしたことで、コスト管理しやすくなった。
- 記事投稿前リサーチは、いきなりLLM分析まで自動化するより、まず検索結果の構造化と再現性確保を優先した方が堅い。

---

## 記事にできそうな切り口

### 開発日記向き

- **note記事を書く前のリサーチが面倒なので、自動化ツールを作ることにした話**

  - 手作業検索の負担
  - 記事候補ごとに同じ確認を繰り返す問題
  - 15分以内でリサーチ準備を終わらせたい背景

- **最初から全部自動化しない判断**

  - LLM分析までやりたくなる
  - しかしP0ではCSVとMarkdownだけに絞った
  - 小さく作ることで継続しやすくする判断

- **個人開発で“やらないこと”を決める重要性**

  - note非公式APIを使わない
  - 本文スクレイピングしない
  - 有料部分取得しない
  - P0でJSONやLLM連携をやらない

- **要件定義を先に書いたら、実装前の迷いが減った話**

  - 入力、検索、正規化、出力、エラー処理を先に固定
  - 実装中の判断疲れを減らす
  - 個人開発でも要件定義は有効

- **検索APIのコストを“キーワード×媒体”で考えると安心できた話**

  - 1記事候補15リクエスト程度
  - 週2本投稿ペースでも現実的
  - 自動化に対する心理的ハードルが下がる

### 技術記事向き

- **TypeScript CLIでリサーチ自動化ツールを設計する**

  - YAML入力
  - Brave Search API
  - DTO正規化
  - CSV/Markdown出力
  - `.env` APIキー管理

- **P0要件定義からCLI実装へ落とす設計手順**

  - Scope
  - Input
  - Search
  - Normalize
  - Output
  - Error
  - API Key
  - Acceptance

- **検索APIレスポンスをDTOに正規化する理由**

  - APIレスポンスに依存しない
  - 将来API差し替えしやすい
  - CSV/Markdownレンダラーを安定させる

- **検索結果0件とAPI失敗を分けて扱うエラー設計**

  - 0件は正常
  - API失敗は異常
  - 部分失敗時は成功分だけ出力
  - 全失敗時はexit code 1

- **スクレイピングしないリサーチ自動化設計**

  - Brave Search APIレスポンスのみ利用
  - 検索結果URLへアクセスしない
  - 安全側に倒したMVP設計

- **Markdown出力を“完成記事”ではなく“人間レビュー用メモ”として設計する**

  - 似たタイトル一覧
  - スニペット
  - 差別化軸
  - 要確認欄
  - 記事化判断テンプレート

### 有料note / テンプレート化候補

- **記事投稿前リサーチ要件定義テンプレート**

  - Scope
  - Input
  - Search
  - Cost
  - Safety
  - Output
  - Error
  - API Key
  - Acceptance

- **note記事リサーチ用YAMLテンプレート**

  - `topic`
  - `articleType`
  - `keywords`
  - `platforms`
  - `search`
  - `output`

- **検索API利用時の安全設計チェックリスト**

  - 非公式APIを使わない
  - 本文スクレイピングしない
  - 有料部分を取得しない
  - URLへ直接アクセスしない
  - APIキーを出力しない

- **P0/P1切り分けチェックリスト**

  - P0で本当に必要か
  - 後続でも困らないか
  - 今やると実装が重くならないか
  - 自動化しすぎていないか

- **CLIツール要件定義テンプレート**

  - 入力ファイル
  - CLI引数
  - API接続
  - DTO
  - 出力ファイル
  - エラー処理
  - 受け入れ条件

- **個人開発向け「Active化レビュー」プロンプト集**

  - ドラフトレビュー観点
  - P0/P1修正抽出
  - Active化可否判定
  - 次アクション整理

---

# まとめ / Summary

## 日本語

- この会話では、Research Memo BuilderのP0要件定義書を作成・レビュー・Active化しました。
- 成果物は `docs/research/research-memo-builder-p0-requirements.md` です。
- 次はActive化版を確認し、M1：プロジェクト雛形作成に進むのが自然です。

## English

- In this chat, we created, reviewed, and activated the P0 requirements document for Research Memo Builder.
- The output file is `docs/research/research-memo-builder-p0-requirements.md`.
- Next, it is good to review the Active version and start M1: project scaffold creation.
