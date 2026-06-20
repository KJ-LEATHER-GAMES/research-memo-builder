# 引き継ぎまとめ

## 実施内容

* note記事投稿前リサーチ自動化について、企画検討からActive版企画書作成まで進めた。
* 対象テーマは、記事投稿前に以下を効率的に調べるための仕組み。

  * 似たタイトルがあるか
  * よくある切り口
  * 無料部分で何を約束しているか
  * 価格帯
  * 自分の差別化ポイント
  * 記事化判断
  * 次に作る記事の仮説
* 対象記事種別は以下の3つとして整理した。

  * ATS開発日記
  * ATS技術記事
  * 将来の有料note候補
* 当初、note APIを使った自動取得を想定していたが、noteには公式公開APIがないことを確認した。
* noteの「API一覧」として紹介されているものは、公式APIではなく、非公式エンドポイントの観測情報と整理した。
* note非公式APIは、仕様変更・停止リスクが高いため、中核機能として採用しない方針を確認した。
* note非公式検索APIが2026年2月頃から使えなくなったという情報を踏まえ、非公式API依存は避ける判断をした。
* note本文スクレイピング、`/api/*`、`/search` への自動アクセスは避ける方針とした。
* 有料部分の自動取得は対象外とした。
* API以外のnote情報取得方法として以下を検討した。

  * 検索エンジンAPI
  * note RSS
  * 手動URL投入
  * ブラウザ拡張・ブックマークレット
  * Qiita / Zenn などの外部媒体検索
* 当初は Google Custom Search JSON API を候補にした。
* その後、Google Custom Search JSON APIは新規ユーザー利用不可・2027年1月1日終了予定であることを確認し、新規運用基盤として不採用にした。
* 代替候補として以下を検討した。

  * Brave Search API
  * Tavily Search API
  * Exa API
  * Kagi Search API
  * Serper.dev
  * SerpAPI
  * note RSS
  * 手動URL投入
* 初期MVPでは、Brave Search APIを採用する方針とした。
* Brave Search APIの1リクエストの意味を整理した。

  * 1検索クエリをAPIに1回送ることを1リクエストとする。
  * 例：`site:note.com 家庭内ルール 仕様書` は1リクエスト。
  * 5キーワード×1媒体なら5リクエスト。
  * 5キーワード×3媒体なら15リクエスト。
* 初期検索キーワードとして以下を扱った。

  * `家庭内ルール 仕様書`
  * `家庭内ルール 要件定義`
  * `家庭内 ポイント制度 設計`
  * `子育て 仕組み化 note`
  * `家庭内ルール プロダクト設計`
* 初期検索対象媒体として以下を整理した。

  * note：`site:note.com`
  * Qiita：`site:qiita.com`
  * Zenn：`site:zenn.dev`
* 当初案として以下を検討した。

  * Phase 1：PowerShell + Brave Search API
  * Phase 2：ChatGPTにCSVを貼る
* ユーザー要望により、PowerShell試作とCSV貼り付け運用は飛ばし、最初からTypeScript CLIとして作る方針に変更した。
* TypeScript CLIとして作る理由を整理した。

  * `.env` でAPIキー管理できる
  * DTOでデータ構造を固定できる
  * ATS / Mnemosyne の既存開発スタイルと合う
  * 将来のLLM API連携、RSS連携、Mnemosyne連携に拡張しやすい
* 「PowerShell案を採用しない理由」を企画書に明記した。
* 「ChatGPTにCSVを貼る案を採用しない理由」を企画書に明記した。
* 企画書のレビューを行い、Active化前のP0/P1修正点を整理した。
* P0修正として以下を整理した。

  * P0初期実装スコープ確定を「MVP/P0要件定義工程」として明記する
  * MVP / P0 / P1 の境界を整理する
  * MVPスコープを「MVP全体」と「P0初期実装」に分離する
  * M0.5：P0要件定義マイルストーンを追加する
  * Brave APIの1リクエスト定義・コスト見積もりを追加する
* P1修正として以下を整理した。

  * `extra_snippets` は初期値trueだが必須依存にしない
  * JSON / run-report / ChatGPT分析プロンプトをP1に整理する
  * 同一URL重複排除のみP0、高度な重複判定はP1以降に分離する
  * 企画書とP0要件定義の責務分離を明記する
* P0/P1修正を反映したActive版企画書を作成した。
* Active版企画書の文書メタ情報は以下。

  * `title: note記事投稿前リサーチ自動化 TypeScript CLI 企画書`
  * `document_id: research-memo-builder-plan`
  * `status: active`
  * `version: 1.0.0`
  * `updated: 2026-06-15`
  * `project: Research Memo Builder`
* Active版企画書の中で、個別のP0実装要件は以下の別文書に切り出す方針とした。

  * `docs/research/research-memo-builder-p0-requirements.md`
* P0要件定義は、実装コードを書く工程ではなく、以下を明確化する工程と整理した。

  * 入力要件
  * 検索要件
  * 正規化要件
  * 出力要件
  * エラー処理要件
  * APIキー管理要件
  * P0対象外
  * 受け入れ条件
* Active版企画書で、P0必須出力は以下に整理した。

  * `search-results.csv`
  * `research-memo.md`
* Active版企画書で、P1以降の追加出力は以下に整理した。

  * `normalized-results.json`
  * `raw-results.json`
  * `chatgpt-analysis-prompt.md`
  * `run-report.md`
* Active版企画書で、ディレクトリ構成案を整理した。

  * `package.json`
  * `tsconfig.json`
  * `.env`
  * `.env.example`
  * `.gitignore`
  * `docs/research/research-memo-builder-plan.md`
  * `docs/research/research-memo-builder-p0-requirements.md`
  * `config/default-platforms.yaml`
  * `research/inputs/ats-rule-spec.yaml`
  * `src/cli/research.ts`
  * `src/config/env.ts`
  * `src/domain/researchInput.ts`
  * `src/domain/searchPlatform.ts`
  * `src/domain/searchOptions.ts`
  * `src/domain/outputOptions.ts`
  * `src/domain/normalizedSearchResult.ts`
  * `src/adapters/braveSearchClient.ts`
  * `src/services/searchQueryBuilder.ts`
  * `src/services/searchResultNormalizer.ts`
  * `src/services/deduplicationService.ts`
  * `src/renderers/csvRenderer.ts`
  * `src/renderers/markdownResearchMemoRenderer.ts`
  * `src/repositories/fileOutputRepository.ts`
  * `src/utils/safeFileName.ts`
  * `src/utils/markdownEscape.ts`
  * `src/utils/sleep.ts`
* Active版企画書で、P1以降の追加候補として以下を整理した。

  * `src/renderers/jsonRenderer.ts`
  * `src/renderers/chatgptPromptRenderer.ts`
  * `src/renderers/runReportRenderer.ts`
  * `src/services/advancedDeduplicationService.ts`
  * `src/repositories/cacheRepository.ts`
* CLI仕様案を整理した。

  * `npm run research -- --input research/inputs/ats-rule-spec.yaml`
  * `npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/ats-rule-spec`
  * `npm run research -- --input research/inputs/ats-rule-spec.yaml --dry-run`
  * `npm run research -- --input research/inputs/ats-rule-spec.yaml --use-cache`
* npm scripts案を整理した。

  * `research`
  * `typecheck`
  * `format`
  * `format:check`
  * `check`
* APIキー管理方針を整理した。

  * `.env` に `BRAVE_API_KEY` を置く
  * `.env` はGit管理しない
  * `.env.example` はGit管理する
  * 起動時に `BRAVE_API_KEY` がなければ明示的にエラーにする
  * ログや出力ファイルにAPIキーを出さない
* エラー処理方針を整理した。

  * APIキー未設定：即停止
  * 入力YAML不正：即停止
  * 必須項目不足：即停止
  * Brave APIエラー：対象クエリのみ失敗扱いにして継続
  * レート制限：P0では失敗として記録、再試行はP1以降で検討
  * 結果0件：エラーではなく0件として記録
  * `extra_snippets` 不在：エラーにせず空欄扱い
  * 出力失敗：即停止
  * 同一URL重複：1件に統合
* P0のリサーチメモ生成方針を整理した。

  * 対象記事候補：入力YAMLから自動入力
  * 1章「検索したキーワード」：自動入力
  * 2章「似たタイトルがあるか」：検索結果から自動入力
  * 3章「どんな切り口が多いか」：要確認欄を生成
  * 4章「無料部分で何を約束しているか」：要確認欄を生成
  * 5章「価格帯はいくらか」：要確認欄を生成
  * 6章「自分ならどこで差別化できるか」：固定差別化軸を自動出力
  * 7章「記事化判断」：判定テンプレートを自動出力
  * 8章「次に作るなら」：要確認欄を生成
* マイルストーンを整理した。

  * M0：企画確定
  * M0.5：P0要件定義
  * M1：プロジェクト雛形作成
  * M2：Brave Search API接続
  * M3：複数キーワード・複数媒体検索
  * M4：CSV出力
  * M5：Markdownリサーチメモ最小出力
  * M6：P1拡張
* 会話末尾で、次は `research-memo-builder-p0-requirements.md` の作成へ進むのがよいと整理した。
* ファイルとして以下がアップロード済み。

  * `note記事自動リサーチシステム.txt`
  * `research-memo-builder-p0-requirements.md`
* ただし、アップロード済みの `research-memo-builder-p0-requirements.md` の内容レビューは、この会話内では未実施。

---

## 決定事項

* 企画名は **Research Memo Builder** とする。
* Research Memo Builder は、note記事投稿前の既存記事リサーチを半自動化するTypeScript CLIとして構築する。
* PowerShell試作は行わない。

  * 理由：APIキー管理、スクリプト肥大化、型の弱さ、テスト困難、将来拡張の弱さがあるため。
* ChatGPTにCSVを貼る運用は中間ステップとして採用しない。

  * 理由：手作業が残り、再現性・履歴管理・将来の自動化に弱いため。
* note公式APIは利用しない。

  * 理由：noteには公式公開APIが存在しないため。
* note非公式APIは採用しない。

  * 理由：仕様変更・停止リスクが高いため。
* note本文スクレイピングは行わない。

  * 理由：規約・robots.txt・著作権・有料部分取得リスクを避けるため。
* 有料部分の自動取得は行わない。

  * 理由：リスクが高く、リサーチ自動化の対象外にすべきため。
* Google Custom Search JSON APIは採用しない。

  * 理由：新規ユーザー利用不可・サービス終了予定のため。
* 初期MVPの検索APIは Brave Search API を採用する。
* 初期検索対象媒体は以下とする。

  * note
  * Qiita
  * Zenn
* 検索クエリは `site:{domain} {keyword}` 形式で生成する。
* Brave Search APIのリクエスト数は、基本的に「1キーワード×1媒体＝1リクエスト」として見積もる。
* 初期MVPではページング検索を行わない。
* 初期MVPでは、1キーワード・1媒体あたり10件を初期値とする。
* 20件超の大量取得はP0では扱わない。
* `extra_snippets` は初期値trueとする。
* `extra_snippets` はP0では必須依存にしない。
* P0初期実装スコープ確定は、実装前の **MVP/P0要件定義工程** とする。
* P0要件定義の成果物は以下とする。

  * `docs/research/research-memo-builder-p0-requirements.md`
* P0必須出力は以下とする。

  * `search-results.csv`
  * `research-memo.md`
* JSON出力、実行レポート出力、ChatGPT分析プロンプト出力はP1とする。
* 同一URLの単純重複排除はP0に含める。
* 高度な重複判定はP1以降とする。
* LLM API連携、note RSS連携、手動URL投入、Mnemosyne連携はMVP後の拡張とする。
* APIキーは `.env` の `BRAVE_API_KEY` で管理する。
* `.env` はGit管理しない。
* `.env.example` はGit管理する。
* APIキーはログや出力ファイルに出さない。
* Active版企画書のステータスは `status: active` とする。
* Active版企画書のバージョンは `version: 1.0.0` とする。

---

## 未解決事項

* Brave Search APIのアカウント作成・APIキー取得は未確認。
* Brave Search APIの現在の最新料金、無料枠、課金条件は要確認。
* Brave Search APIの実APIレスポンス形式は未検証。
* `extra_snippets=true` の実レスポンスでの安定性は未確認。
* `countPerQuery: 10` で十分か、20にするべきかは要確認。
* 初期対象媒体を note / Qiita / Zenn の3つで固定してよいかは要確認。
* 個人ブログ、はてなブログ、Medium、X由来記事などを初期対象に入れるかは未確認。
* 入力YAMLの正式スキーマは未確定。
* 入力バリデーションライブラリは未決定。

  * 候補：`zod`
* YAMLパーサは未決定。

  * 候補：`yaml`
* CLI引数パーサは未決定。

  * 候補：`commander`
  * 候補：`yargs`
* CSV出力ライブラリは未決定。
* Markdown生成方法は未決定。

  * 文字列テンプレートでよいか
  * テンプレートエンジンを使うか
* Node.jsの対象バージョンは未確定。
* パッケージマネージャは未確定。

  * npm想定だが正式決定は未確認。
* プロジェクト配置場所は未確定。

  * 独立リポジトリにするか
  * 既存プロジェクト配下に置くか
  * Mnemosyne関連として置くか
* `docs/research/research-memo-builder-plan.md` として実ファイル化済みかは未確認。
* `docs/research/research-memo-builder-p0-requirements.md` はアップロード済みだが、内容レビューは未実施。
* `research-memo-builder-p0-requirements.md` がActive版企画書の内容と完全に整合しているかは要確認。
* P0受け入れ条件の具体化は要確認。
* P0要件IDの粒度は未確認。

  * 例：`P0-REQ-001`
* `search-results.csv` の列順・必須列・任意列は要確認。
* `research-memo.md` のテンプレート詳細は要確認。
* P0で `raw-results.json` を出さない場合、APIエラー調査に不足が出ないかは要確認。
* P0で `run-report.md` を出さない場合、失敗クエリの記録をどこに残すかは要確認。
* P0でAPI失敗が一部発生した場合のexit code方針は未確定。
* 0件時のMarkdown出力方針は要確認。
* 同一URL重複排除のURL正規化レベルは未確定。
* URL末尾スラッシュ、クエリパラメータ、トラッキングパラメータをどう扱うかは未確認。
* note RSS連携の対象クリエイター・マガジンは未確認。
* 手動URL投入のYAML仕様は未確定。
* LLM API連携をいつ導入するかは未定。
* Mnemosyne連携時の保存先分類は未確定。

  * 候補：`article_note`
  * 候補：`research_result`
  * 候補：`decision`
  * 候補：`idea`
  * 候補：`next_action`
* リサーチ結果を後日note記事素材としてどう再利用するかの運用ルールは未確定。
* APIレスポンスや検索結果の著作権・引用範囲に関する詳細ルールは要確認。

---

## 次アクション

### P0-1：アップロード済みP0要件定義のレビュー

* 最初に見るファイル：

  * `research-memo-builder-p0-requirements.md`
* 確認観点：

  * Active版企画書と矛盾していないか
  * P0対象範囲が大きすぎないか
  * P0対象外が明確か
  * 入力要件、検索要件、正規化要件、出力要件、エラー処理要件、APIキー管理要件がそろっているか
  * 受け入れ条件がテスト可能な形になっているか
  * JSON、run-report、ChatGPT分析プロンプトがP1に整理されているか
  * note非公式API、本文スクレイピング、有料部分取得が混入していないか

### P0-2：Active版企画書とP0要件定義の整合確認

* 見るべきファイル：

  * `note記事自動リサーチシステム.txt`
  * `research-memo-builder-p0-requirements.md`
* 確認する論点：

  * P0/P1/P2/P3の境界
  * P0必須出力
  * P0対象外
  * APIキー管理
  * エラー処理
  * 受け入れ条件
  * M0.5からM1への接続

### P0-3：P0要件定義をActive化する

* 作成・修正対象候補：

  * `docs/research/research-memo-builder-p0-requirements.md`
* 反映したい形式：

  * frontmatter
  * 要件ID
  * 対象範囲
  * 対象外
  * 入力要件
  * 検索要件
  * 正規化要件
  * 出力要件
  * エラー処理要件
  * セキュリティ要件
  * 受け入れ条件

### P0-4：M1プロジェクト雛形作成へ進む

* P0要件定義が固まった後に作成する候補。

  * `package.json`
  * `tsconfig.json`
  * `.env.example`
  * `.gitignore`
  * `src/cli/research.ts`
  * `research/inputs/ats-rule-spec.yaml`
  * `docs/research/research-memo-builder-p0-requirements.md`
* npm scripts候補：

  * `research`
  * `typecheck`
  * `format`
  * `format:check`
  * `check`

### P1以降の後続候補

* JSON出力

  * `normalized-results.json`
  * `raw-results.json`
* 実行レポート出力

  * `run-report.md`
* ChatGPT分析プロンプト出力

  * `chatgpt-analysis-prompt.md`
* 重複排除強化

  * URL正規化
  * タイトル類似判定
* キャッシュ
* note RSS連携
* 手動URL投入
* LLM API連携
* Mnemosyne連携

---

## 気づき

* 最初は「note APIで取得する」想定だったが、noteには公式公開APIがないため、設計前提を大きく見直す必要があった。
* 「API一覧」という記事があっても、公式APIとは限らない。
* 非公式APIは、個人ツールの短期試作には使えても、継続運用の中核には向かない。
* note非公式API停止のような実例があると、Adapter分離や代替API選定の重要性が見えやすい。
* Google Custom Search JSON APIの終了予定により、検索APIも長期運用可能性を確認する必要があると分かった。
* API選定では、機能だけでなく以下も見る必要がある。

  * 新規利用可能か
  * 終了予定がないか
  * 料金体系
  * site検索可否
  * レスポンス形式
  * 将来差し替え可能性
* Brave Search APIは、Google/Bingに依存しない検索APIとして、今回のMVPに合う。
* 検索APIは、直接ロジックに埋め込まず、Adapterとして分離する方が安全。
* PowerShellは試作には便利だが、継続運用・DTO・出力テンプレート・テスト・APIキー管理まで考えるとTypeScript CLIが適している。
* CSV貼り付け運用は簡単だが、再現性と履歴管理に弱い。
* 最初からLLM API連携まで入れるとMVPが膨らむため、P0ではCSVとMarkdown最小出力に絞る判断が有効。
* P0 / P1 / P2 / P3を分けることで、ツールが大きくなりすぎるリスクを抑えられる。
* 「P0初期実装スコープ確定」は、実装ではなく要件定義工程と捉えるのがよい。
* 企画書とP0要件定義を分けることで、企画書が詳細仕様を抱え込みすぎるのを防げる。
* APIコストは「キーワード数×媒体数×ページ数」で見積もると分かりやすい。
* noteリサーチでは、本文を直接取らなくても、タイトル・URL・スニペットだけで候補整理には十分役立つ。
* 「価格帯」「無料部分で何を約束しているか」は完全自動化せず、人間確認欄を残す方が安全。
* 記事制作フロー自体も、個人開発の設計対象にできる。
* Research Memo Builder は、将来的に Mnemosyne の `article_note` や `research_result` と接続できる可能性がある。
* この一連の検討自体が、note記事の開発日記・技術記事・有料テンプレート候補になる。

---

## 記事にできそうな切り口

### 開発日記向き

* note記事リサーチを自動化しようとしたら、note公式APIが存在しなかった話
* 「API一覧があるから公式APIだと思っていた」から始まった設計見直し
* 非公式APIを使わないと決めるまでの判断
* note非公式APIの停止リスクを見て、設計方針を変えた話
* Google Custom Search JSON APIを使おうとしたら、新規ユーザー不可・終了予定だった話
* 検索API選定で迷った話
* PowerShellで済ませるつもりが、TypeScript CLIにした理由
* 毎回APIキーを設定するのが面倒で、ちゃんとツール化することにした話
* まずCSVで試す案を飛ばして、最初からCLIにした話
* 完全自動化ではなく、半自動化にした理由
* 「価格帯」と「無料部分の約束」はあえて手動確認に残す判断
* 記事を書く前の15分リサーチを、個人開発ツールに落とし込む話
* 記事制作フローもプロダクト設計の対象になると気づいた話
* Mnemosyneと記事制作をつなげる前段として、リサーチ自動化を考えた話
* 開発日記を書くための仕組みをまた開発している話
* 子育て・家庭内運用・個人開発・発信をつなぐリサーチ基盤づくり

### 技術記事向き

* Brave Search APIを使ったTypeScript CLI設計
* `site:note.com` / `site:qiita.com` / `site:zenn.dev` を使った媒体別検索設計
* 検索APIレスポンスをDTOで正規化する設計
* API Adapterを分離して、検索API終了リスクに備える設計
* `.env` によるAPIキー管理とログ漏洩防止
* YAML入力から検索クエリを生成するCLI設計
* `ResearchInput` / `SearchPlatform` / `SearchOptions` / `OutputOptions` / `NormalizedSearchResult` のDTO設計
* `SearchQueryBuilder` の責務設計
* `BraveSearchClient` のAdapter設計
* `SearchResultNormalizer` の正規化設計
* `DeduplicationService` の同一URL重複排除設計
* CSV RendererとMarkdown Rendererの責務分離
* P0ではJSONを出さず、CSVとMarkdownに絞るMVP設計
* LLM APIをいきなり組み込まず、P1でChatGPT分析プロンプト出力に留める設計
* 検索APIコストを「キーワード数×媒体数×ページ数」で見積もる方法
* Mermaidで表すリサーチ自動化ワークフロー
* note非公式APIや本文スクレイピングを避ける安全寄りの設計
* P0要件定義からM1プロジェクト雛形作成へ進む開発プロセス
* CLIツールのエラー処理設計
* 0件、API失敗、レート制限、APIキー未設定の扱い
* 出力ファイル設計

  * `search-results.csv`
  * `research-memo.md`
  * `normalized-results.json`
  * `raw-results.json`
  * `run-report.md`
  * `chatgpt-analysis-prompt.md`
* Mnemosyne連携を見据えたリサーチ結果データ構造

### 有料note / テンプレート化候補

* note記事投稿前リサーチメモテンプレート
* 既存記事リサーチ自動化チェックリスト
* 記事ネタ別リサーチ入力YAMLテンプレート
* Brave Search API用 TypeScript CLI 雛形
* 検索キーワード洗い出しテンプレート
* `site:` 検索クエリ設計テンプレート
* 開発日記 / 技術記事 / 有料note候補 別リサーチ観点テンプレート
* 記事化判断チェックリスト
* 差別化ポイント整理テンプレート
* API選定判断シート
* 非公式APIを使う/使わない判断基準
* スクレイピング回避チェックリスト
* APIキー管理チェックリスト
* 検索APIコスト見積もりシート
* P0 / P1 / P2 / P3 切り分けテンプレート
* P0要件定義テンプレート
* CLI企画書テンプレート
* CLI要件定義テンプレート
* Markdownリサーチメモ生成テンプレート
* ChatGPT分析プロンプト集
* 検索結果CSVからリサーチメモを埋めるプロンプト
* リサーチメモから記事構成案を作るプロンプト
* 個人開発者向け「記事制作ワークフロー自動化」手順書
* Mnemosyne連携用 `article_note` / `research_result` 記録テンプレート
* 「発信を継続するための裏側システム」設計テンプレート
