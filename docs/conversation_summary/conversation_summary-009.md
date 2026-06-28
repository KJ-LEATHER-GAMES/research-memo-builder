# 引き継ぎまとめ

## 実施内容

- `research_memo_builder` / `Research Memo Builder` の **P0全体完了レビュー** を実施した。

- ユーザーから以下のP0最終レビュー証跡を共有してもらった。

  - 最新コミット情報

    - `7d0**** feat: complete M5 markdown research memo output`

  - `git status --short`

    - 出力なし

  - `npm run check`

    - `typecheck` 成功
    - `format:check` 成功

  - P0最終正常系実行

    - `npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/p0-final-check`
    - Exit Code `0`
    - 15クエリ生成・15クエリ成功
    - Raw 150件
    - Normalized 150件
    - Deduplicated 139件
    - Removed duplicate 11件
    - `search-results.csv` 生成
    - `research-memo.md` 生成

  - `.gitignore`

    - `.env`
    - `output/`
    - `!.env.example`
    - `node_modules/`
    - `dist/`

  - `--dry-run`

    - API呼び出しなし
    - CSV/Markdown出力なし
    - Exit Code `0`

  - 入力不正確認

    - 存在しないYAML指定で Exit Code `2`

  - APIキー未設定確認

    - `BRAVE_API_KEY` 未設定で Exit Code `3`

- 添付された出力ファイルを確認した。

  - `search-results.csv`

    - CSV行数：139
    - ヘッダー：

      - `Keyword`
      - `Platform`
      - `Title`
      - `Url`
      - `Snippet`
      - `ExtraSnippets`
      - `Rank`
      - `Query`
      - `RetrievedAt`

    - UTF-8 BOMあり
    - URL重複なし
    - APIキー文字列なし

  - `research-memo.md`

    - Markdownリンク数：139
    - 検索結果グループ数：15
    - UTF-8 BOMなし
    - P0注意書きあり
    - Warningsなし
    - APIキー文字列なし

- P0全体レビュー結果として、以下の判定を出した。

  - **P0は完了判定してよい**
  - 判定ラベル：

    - `P0 Status: completed`
    - `Review Result: pass with minor documentation cleanup`

- P0完了レビュー後、軽微なドキュメント修正候補を提示した。

  - `docs/requirements/research-memo-builder-p0-requirements.md`

    - 全API失敗時の旧記述
    - P0-AC-001のパス表記

  - `docs/research/design/research-memo-builder-p0-design.md`

    - `ExtraSnippets` のMarkdown/CSV出力仕様の明確化
    - `src/src/output/` 表記の確認

- `ExtraSnippets` の区切り仕様について追加説明した。

  - 問題は実装不備ではなく、**設計書の表現が曖昧だったこと**
  - MarkdownだけでなくCSV側の `ExtraSnippets` の扱いも明文化した方がよいと説明した。
  - 推奨修正文を提示した。

    - `extraSnippets` はCSVおよびMarkdownでは1行の文字列にまとめて出力する
    - Markdownは空配列時 `なし`
    - CSVは空配列時、実装に合わせて空文字または `なし`
    - 区切り文字は `/` のようにスペース込みで明記する方針を提案

- ユーザーが以下の修正・コミットを完了したと共有した。

  - `docs/requirements/research-memo-builder-p0-requirements.md` の軽微修正
  - `docs\research\design\research-memo-builder-p0-design.md` の修正
  - `npm run check` 成功
  - 追加コミット完了

    - `54***** docs: align P0 requirements with final behavior`

- 最新の添付ドキュメントを確認した。

  - `research-memo-builder-p0-requirements.md`
  - `research-memo-builder-p0-design.md`

- 最新ドキュメント確認後、追加の残課題を指摘した。

  - `docs/requirements/research-memo-builder-p0-requirements.md`

    - `10.1 即停止するエラー` の exit code が古いまま残っている。
    - `10.5 P0 exit code定義` では、入力不正 `2`、APIキー不備 `3`、出力失敗 `5` と整理されているが、`10.1` の表ではまだ `1` が残っている。

  - `docs/research/design/research-memo-builder-p0-design.md`

    - ディレクトリ構成に `src/src/output/` 相当の表記が残っている。
    - 責務表では `src/output/csvResearchResultWriter.ts` と `src/output/markdownResearchMemoWriter.ts` になっており、ディレクトリツリー側と表記を揃える必要がある。

- P1移行について相談を受け、以下の方針を提案した。

  - P1へ移行してよい。
  - ただし、P0ドキュメントの残課題2点を先に直してからP1へ進むのが安全。
  - P1は `docs/requirements/research-memo-builder-p1-requirements.md` の作成から始めるのがよい。
  - `docs/proposal/research-memo-builder_proposal.md` は参考にしてよいが、正本はP0要件定義書・P0設計書を優先する。

---

## 決定事項

- **P0は完了判定してよい**。

  - 理由：

    - 最終正常系が Exit Code `0`
    - CSV/Markdownが生成済み
    - CSV件数とMarkdownリンク数が139件で一致
    - `dry-run` がAPI呼び出し・出力なしで正常完了
    - 入力不正が Exit Code `2`
    - APIキー未設定が Exit Code `3`
    - M5レポート上で一部API失敗、全API失敗、出力失敗も確認済み
    - `.env` と `output/` がGit管理対象外
    - 作業ツリーがクリーン
    - P0対象外の本文取得・有料部分取得・価格確定・AI要約に踏み込んでいない

- P0完了レビューの判定ラベルは以下とした。

  - `P0 Status: completed`
  - `Review Result: pass with minor documentation cleanup`

- P1へ移行してよい。

  - ただし、P0ドキュメントの軽微な残課題を直してから移行するのが望ましい。

- P1の最初の成果物は、以下のファイルにする方針を推奨した。

  - `docs/requirements/research-memo-builder-p1-requirements.md`

- P1要件定義の参照元は以下を優先する。

  - `docs/requirements/research-memo-builder-p0-requirements.md`
  - `docs/research/design/research-memo-builder-p0-design.md`
  - `docs/proposal/research-memo-builder_proposal.md`
  - M2〜M5実装レポート

- P1初回スコープは、以下に絞る方針を推奨した。

  - `normalized-results.json`
  - `raw-results.json`
  - `run-report.md`
  - `chatgpt-analysis-prompt.md`

- P1初回では、重複排除強化は後回しにする方針を推奨した。

  - 理由：

    - URL正規化
    - クエリパラメータ除去
    - note URL形式
    - タイトル類似判定
    - 誤判定リスク
    - など、設計判断が増えるため。

- `ExtraSnippets` の設計書修正方針として、MarkdownとCSVの扱いを分けて明記する方向を採用した。

  - Markdownは人間向けなので空配列時 `なし` が自然。
  - CSVは後処理向けなので、実装に合わせて空文字または `なし` に揃える。
  - 区切り文字は `/` のように厳密に書く方がよい。

---

## 未解決事項

- `docs/requirements/research-memo-builder-p0-requirements.md` の `10.1 即停止するエラー` の exit code 修正が、次チャット時点で完了しているかは未確認。

  - 修正候補：

    - `BRAVE_API_KEY` 未設定：Exit Code `3`
    - 入力ファイル未指定：Exit Code `2`
    - 入力ファイル存在なし：Exit Code `2`
    - YAMLパース失敗：Exit Code `2`
    - 必須項目不足：Exit Code `2`
    - 入力値不正：Exit Code `2`
    - 出力ディレクトリ作成失敗：Exit Code `5`
    - ファイル書き込み失敗：Exit Code `5`

- `docs/research/design/research-memo-builder-p0-design.md` のディレクトリ構成に残る `src/src/output/` 相当の表記が、次チャット時点で修正済みかは未確認。

  - 正しくは以下の構成に寄せる。

    - `src/output/csvResearchResultWriter.ts`
    - `src/output/markdownResearchMemoWriter.ts`

- `docs/proposal/research-memo-builder_proposal.md` の内容は、まだこの会話内で詳細レビューしていない。

  - P1要件定義作成時に要確認。

- P1の正式スコープは未確定。

  - 推奨案は提示済みだが、会話内で最終決定はしていない。
  - 候補：

    - JSON出力
    - run-report出力
    - ChatGPT分析プロンプト出力
    - Markdown改善
    - 重複排除強化

- P1で `output.*` フラグをどう解禁するかは未決定。

  - 候補：

    - `output.json`
    - `output.runReport`
    - `output.chatgptPrompt`

  - 個別ON/OFF可能にするか、P1ではすべてtrue必須にするかは要検討。

- P1で `raw-results.json` を出力する場合、Brave Search APIレスポンスをどこまで保存するかは未決定。

  - APIキーやヘッダーを含めないことは前提。
  - レスポンス全体を保存するか、必要部分だけ保存するかは要検討。

- `run-report.md` の粒度は未決定。

  - 候補：

    - 入力ファイル
    - 出力先
    - 実行日時
    - Exit Code
    - 生成クエリ数
    - 成功クエリ数
    - 失敗クエリ数
    - 取得件数
    - 重複排除件数
    - 出力ファイル一覧
    - warning一覧
    - 失敗クエリ一覧

- `chatgpt-analysis-prompt.md` の役割・構成は未決定。

  - 企画書では、Markdownメモの未分析章をChatGPTで埋める方向。
  - 対象章候補：

    - `3. どんな切り口が多いか`
    - `4. 無料部分で何を約束しているか`
    - `6. 自分ならどこで差別化できるか`
    - `7. 記事化判断`
    - `8. 次に作るなら`

---

## 次アクション

### 優先度A：P0ドキュメントの残課題確認・修正

- 次チャットで最初に確認するファイル：

  - `docs/requirements/research-memo-builder-p0-requirements.md`
  - `docs/research/design/research-memo-builder-p0-design.md`

- 確認ポイント：

  - `docs/requirements/research-memo-builder-p0-requirements.md`

    - `10.1 即停止するエラー` の exit code が `10.5 P0 exit code定義` と一致しているか。

  - `docs/research/design/research-memo-builder-p0-design.md`

    - ディレクトリ構成に `src/src/output/` 相当の表記が残っていないか。

- 修正後に実行するコマンド：

  ```bash
  npm run check
  ```

- 問題なければコミット：

  ```bash
  git add docs/requirements/research-memo-builder-p0-requirements.md docs/research/design/research-memo-builder-p0-design.md
  git commit -m "docs: fix remaining P0 documentation inconsistencies"
  ```

### 優先度A：P1要件定義書の作成開始

- 作成候補ファイル：

  ```text
  docs/requirements/research-memo-builder-p1-requirements.md
  ```

- 参照するファイル：

  ```text
  docs/requirements/research-memo-builder-p0-requirements.md
  docs/research/design/research-memo-builder-p0-design.md
  docs/proposal/research-memo-builder_proposal.md
  docs/implementation/research-memo-builder-m2-a-implementation-report.md
  docs/implementation/research-memo-builder-m2-b-implementation-report.md
  docs/implementation/research-memo-builder-m3-implementation-report.md
  docs/implementation/research-memo-builder-m4-implementation-report.md
  docs/implementation/research-memo-builder-m5-implementation-report.md
  ```

- P1要件定義の初期章立て案：

  ```md
  ---
  title: Research Memo Builder P1要件定義書
  document_id: research-memo-builder-p1-requirements
  status: draft
  version: 0.1.0
  updated: 2026-06-28
  project: Research Memo Builder
  milestone: P1
  source_documents:
    - docs/requirements/research-memo-builder-p0-requirements.md
    - docs/research/design/research-memo-builder-p0-design.md
    - docs/proposal/research-memo-builder_proposal.md
  ---

  # Research Memo Builder P1要件定義書

  ## 1. この文書の位置づけ

  ## 2. P1の目的

  ## 3. P1対象範囲

  ## 4. P1対象外

  ## 5. P0から継承する前提

  ## 6. 入力要件

  ## 7. 出力要件

  ### 7.1 normalized-results.json

  ### 7.2 raw-results.json

  ### 7.3 run-report.md

  ### 7.4 chatgpt-analysis-prompt.md

  ## 8. CLI要件

  ## 9. JSON出力要件

  ## 10. run-report出力要件

  ## 11. ChatGPT分析プロンプト出力要件

  ## 12. Markdown改善要件

  ## 13. 重複排除強化の扱い

  ## 14. Safety要件

  ## 15. エラー処理要件

  ## 16. P1実装受け入れ条件

  ## 17. 後続フェーズへの接続

  ## 18. P1完了判定
  ```

### 優先度B：P1スコープの確定

- 最初に決める論点：

  - P1初回で以下4ファイルを全部対象にするか。

    - `normalized-results.json`
    - `raw-results.json`
    - `run-report.md`
    - `chatgpt-analysis-prompt.md`

  - `output.json`
  - `output.runReport`
  - `output.chatgptPrompt`
  - これらのフラグをP1でどう解禁するか。
  - 重複排除強化をP1初回から外すか。

### 優先度C：P0完了レポートの作成

- P1要件定義に入る前後で、P0全体の完了レポートを作ると後でnote記事化しやすい。

- 候補ファイル：

  ```text
  docs/implementation/research-memo-builder-p0-completion-report.md
  ```

- 書く内容：

  - P0の目的
  - M1〜M5の実施内容
  - 最終正常系結果
  - 異常系確認結果
  - 出力ファイル確認結果
  - P0対象外に留めた判断
  - P1への接続

---

## 気づき

- P0完了判定には、実装コードだけではなく、**正常系・異常系・出力ファイル・Git状態・Safety制約**の証跡が必要だった。
- 「動いた」だけではなく、以下が揃うと完了判断が強くなる。

  - `npm run check`
  - `git status --short`
  - 正常系実行ログ
  - Exit Code確認
  - 出力ファイルの件数確認
  - BOM/改行確認
  - APIキー漏洩なし
  - `.gitignore`

- P0の最終出力で、CSV 139件とMarkdownリンク139件が一致したことは、成果物品質の強い確認材料になった。
- `ExtraSnippets` のような小さな仕様でも、MarkdownとCSVでは目的が違う。

  - Markdownは人間が読む。
  - CSVは後処理も想定する。
  - そのため、同じデータでも空値や区切りの扱いを分けて書く必要がある。

- 設計書の表現が曖昧でも、実装が壊れているとは限らない。

  - ただし、後続のテスト・改修・記事化では曖昧さが負債になる。

- P0では、本文取得・有料部分取得・価格確定・AI分析に踏み込まなかったことが、逆に安全な完了につながった。
- P1へ進む前に、P0要件定義とP0設計書の軽微な表記ズレを閉じると、次フェーズの土台が安定する。
- 企画書は方向性を示すものとして有効だが、P1要件定義の正本はP0要件定義書・P0設計書から接続する方が安全。
- P1は機能を一気に広げるより、まず **分析前成果物を増やす** 方向に絞ると設計が安定する。
- `run-report.md` や `chatgpt-analysis-prompt.md` は、単なる出力追加ではなく、後続の人間レビュー・AIレビュー・note記事化を支援する「作業導線」になる。

---

## 記事にできそうな切り口

### 開発日記向き

- **「P0完了レビューで分かった、個人開発の“完了”は動作確認だけでは足りない話」**

  - 実装が動くこと
  - ドキュメントが整合していること
  - Exit Codeが確認できていること
  - 出力ファイルが検証できていること
  - Git状態がクリーンであること

- **「AIと一緒にP0を閉じる：実装よりも最後の整合確認が大事だった」**

  - M5完了後の最終レビュー
  - `npm run check`
  - `git status`
  - 出力ファイル確認
  - 設計書の小さなズレ修正

- **「検索リサーチ自動化ツールを作ってみたら、最初に大事だったのは“やらないこと”を決めることだった」**

  - 本文取得しない
  - 有料部分を取らない
  - 価格を確定しない
  - note非公式APIを使わない
  - P0は検索結果の整理に限定

- **「P0からP1へ：動くCLIから“記事づくりを助ける道具”へ進化させる」**

  - CSV/Markdown出力
  - 次はJSON/run-report/ChatGPTプロンプト
  - 人間レビューとAIレビューの橋渡し

- **「139件の検索結果を、15分リサーチの下準備に変える」**

  - 15クエリ
  - 150件取得
  - 139件に重複排除
  - CSV/Markdown化
  - note記事作成前の調査メモとして活用

### 技術記事向き

- **「TypeScript CLIでBrave Search API検索結果をCSV/Markdownに出力する設計」**

  - 入力YAML
  - Zodバリデーション
  - SearchQuery
  - NormalizedSearchResult
  - DeduplicationResult
  - CSV renderer
  - Markdown renderer

- **「Exit Code設計でCLIツールの完了判定を安定させる」**

  - `0 SUCCESS`
  - `1 PARTIAL_API_FAILURE`
  - `2 INPUT_ERROR`
  - `3 CONFIG_ERROR`
  - `4 ALL_API_FAILURE`
  - `5 OUTPUT_ERROR`
  - `9 UNEXPECTED_ERROR`

- **「P0設計でSafety境界を固定する：検索APIレスポンスだけを使う設計」**

  - 検索結果URLへHTTP GETしない
  - OGP取得しない
  - 本文HTML取得しない
  - 有料部分取得しない
  - APIキー漏洩防止

- **「CSVとMarkdownで同じデータをどう表現し分けるか」**

  - `ExtraSnippets`
  - 空配列の扱い
  - 区切り文字
  - 人間向けMarkdown
  - 後処理向けCSV

- **「個人開発CLIにおけるdry-runの価値」**

  - APIコスト前の確認
  - クエリ数確認
  - 入力検証
  - 出力予定確認
  - 安全な試行錯誤

- **「P0からP1へ拡張しやすい出力設計」**

  - P0：

    - `search-results.csv`
    - `research-memo.md`

  - P1：

    - `normalized-results.json`
    - `raw-results.json`
    - `run-report.md`
    - `chatgpt-analysis-prompt.md`

### 有料note / テンプレート化候補

- **P0完了レビュー・チェックリスト**

  - Git状態
  - `npm run check`
  - 正常系実行
  - 異常系実行
  - Exit Code
  - 出力ファイル件数
  - 文字コード
  - APIキー漏洩確認
  - `.gitignore`
  - Safety境界確認

- **CLIツール向け Exit Code 設計テンプレート**

  - 成功
  - 入力不正
  - 設定不備
  - 部分失敗
  - 全失敗
  - 出力失敗
  - 想定外例外

- **P0/P1スコープ切り分けテンプレート**

  - P0でやること
  - P0でやらないこと
  - P1に送ること
  - P2以降に送ること
  - 判断理由

- **要件定義書テンプレート**

  - 位置づけ
  - 目的
  - 対象範囲
  - 対象外
  - 入力要件
  - 出力要件
  - Safety要件
  - エラー処理
  - CLI要件
  - 受け入れ条件
  - 完了判定

- **実装設計書テンプレート**

  - 設計方針
  - DTO一覧
  - CLI引数
  - 出力ファイル構成
  - エラーコード
  - ディレクトリ構成
  - 責務分担
  - 実装タスク分解
  - 設計決定

- **P1要件定義スターター**

  - JSON出力
  - run-report
  - ChatGPT分析プロンプト
  - Markdown改善
  - 重複排除強化の扱い
  - Safety継承

- **ChatGPT分析プロンプト出力テンプレート**

  - 検索結果一覧
  - 分析してほしい章
  - 禁止事項
  - 出力形式
  - 判断基準
  - note記事化への接続

- **「AIとの会話を設計資産に変える」運用テンプレート**

  - 会話ログ
  - 実装レポート
  - 完了レビュー
  - 引き継ぎまとめ
  - 次フェーズ要件定義
  - note記事素材化
