# 引き継ぎまとめ

## 実施内容

- 前チャットからの引き継ぎを受け、Research Memo Builder の **M2-A：入力YAML読み込み + Zod検証 + dry-run** に着手した。
- 事前に、npmプロジェクト初期化が完了していることを確認した。

  - `npm install yaml zod dotenv`
  - `npm install -D typescript tsx prettier @types/node`
  - `npm run research -- --help`
  - `npm run typecheck`
  - `npm run format`
  - `npm run check`

- M2-A対象として、以下11ファイルの実装案を作成した。

  - `src/domain/researchInput.ts`
  - `src/domain/searchPlatform.ts`
  - `src/domain/searchOptions.ts`
  - `src/domain/outputOptions.ts`
  - `src/domain/searchQuery.ts`
  - `src/domain/researchExitCode.ts`
  - `src/input/researchInputSchema.ts`
  - `src/input/researchInputLoader.ts`
  - `src/services/searchQueryBuilder.ts`
  - `src/utils/safePath.ts`
  - `src/cli/research.ts`

- `src/domain/*` に、P0/M2-Aで必要なDTO・型定義を追加した。

  - `RawResearchInput`
  - `ResolvedResearchInput`
  - `ArticleType`
  - `SearchPlatform`
  - `SearchOptions`
  - `OutputOptions`
  - `SearchQuery`
  - `ResearchExitCode`

- `src/input/researchInputSchema.ts` に、Zodによる入力YAML検証処理を追加した。

  - `topic` の空文字チェック
  - `articleType` のbooleanチェック
  - `articleType` 3項目のうち最低1つ `true` のチェック
  - `keywords` の1〜5件チェック
  - `platforms` の1〜3件チェック
  - `platforms[].site` のドメイン形式チェック
  - `platforms[].site` の重複チェック
  - `search` 配下のデフォルト補完
  - `output.csv` / `output.markdownMemo` のP0必須チェック
  - `output.json` / `output.runReport` / `output.chatgptPrompt` が `true` の場合の入力不正化

- `src/input/researchInputLoader.ts` に、YAMLファイル読み込み処理を追加した。

  - `fs/promises.readFile`
  - `yaml.parse`
  - ファイル未存在時の `ResearchInputLoadError`
  - YAMLパース失敗時の `ResearchInputLoadError`

- `src/services/searchQueryBuilder.ts` に、検索クエリ生成処理を追加した。

  - `platforms` 順 × `keywords` 順で生成
  - クエリ形式は `site:{platform.site} {keyword}`
  - 5キーワード × 3媒体 = 15クエリ生成を確認

- `src/utils/safePath.ts` に、安全な相対パス判定を追加した。

  - 空文字NG
  - null文字NG
  - 絶対パスNG
  - Windows絶対パスNG
  - `../` NG

- `src/cli/research.ts` をM2-A用に接続した。

  - `--input`
  - `--out`
  - `--dry-run`
  - `--help`
  - P0対象外オプションの拒否

    - `--use-cache`
    - `--json`
    - `--run-report`
    - `--chatgpt-prompt`

  - dry-run時の入力検証・デフォルト補完・検索クエリ表示
  - APIを呼ばないことの明示表示
  - CSV/Markdownを出力しないことの明示表示

- 初回型チェックで、以下のTypeScriptエラーが発生した。

  - `src/cli/research.ts`

    - `argv[index]` が `undefined` の可能性あり
    - `cliArgs.input` が `string | undefined` のまま扱われていた

  - `src/input/researchInputSchema.ts`

    - Zodの `.default({})` が最終出力型と一致せず型エラー

- 上記エラーへの修正方針を整理した。

  - `argv[index]` 取得後に `current === undefined` を明示チェック
  - `run()` 内で `inputPath` の存在を再チェック
  - `searchOptionsSchema` は `.default({})` ではなく、`z.preprocess((value) => value ?? {}, schema)` に変更

- 修正後、以下を確認した。

  - `npm run format` 成功
  - `npm run typecheck` 成功
  - `npm run check` 成功
  - `npm run research -- --input research/inputs/ats-rule-spec.yaml --dry-run` 成功

- dry-run正常系で、以下を確認した。

  - `topic` を表示できる
  - `articleType` を表示できる
  - `search` 設定を表示できる
  - 出力予定ディレクトリを表示できる
  - 予定リクエスト数 `15` を表示できる
  - 15件の検索クエリを表示できる
  - Brave Search APIを呼ばない
  - CSV/Markdownを出力しない
  - Exit Code `0`

- `--input` なしの異常系を確認した。

  - 実行コマンド：

    - `npm run research -- --dry-run`

  - 表示：

    - `Input error`
    - `--input is required`

  - Exit Code：

    - `2`

- `research/inputs/ats-rule-spec.yaml` から `search:` を一時的に削除して確認した。

  - `search.countPerQuery` が `10` に補完される
  - `search.country` が `JP` に補完される
  - `search.searchLang` が `ja` に補完される
  - `search.uiLang` が `ja-JP` に補完される
  - `search.extraSnippets` が `true` に補完される

- `output.json: true` の異常系を確認した。

  - 表示：

    - `Research input validation failed.`
    - `- output.json: output.json must be false in P0`

- `--out` の正常系を確認した。

  - 実行コマンド：

    - `npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/tmp-check --dry-run`

  - 結果：

    - `Planned output dir: output/research/tmp-check`

  - `--out` が入力YAMLの `output.dir` を上書きできることを確認した。

- `--out ../tmp` の異常系を確認した。

  - 実行コマンド：

    - `npm run research -- --input research/inputs/ats-rule-spec.yaml --out ../tmp --dry-run`

  - 表示：

    - `Input error`
    - `--out is invalid: use a relative path without absolute path notation or '../'`

- Zodについて、初学者向けに以下の観点で解説した。

  - ZodはTypeScriptで使う入力検証ライブラリ
  - TypeScriptの型は実行時には外部入力を守れない
  - YAMLやAPIレスポンスなど、外から来るデータは `unknown` として扱う
  - Zodを通して `ResolvedResearchInput` に変換する
  - Zodは「入力境界の門番」「受入検査工程」として機能する

- 実装結果の記録先について検討した。

  - 要件定義書・企画書・設計書に混ぜず、実装記録ドキュメントを新規作成する方針を提案した。
  - 推奨ファイルとして `docs/implementation/research-memo-builder-m2-a-implementation-record.md` を提案した。

- ユーザーにより、`implementation-record.md` を作成したと報告された。

  - 正確なファイルパス・ファイル内容は、この会話では未確認。

## 決定事項

- M2-Aの実装範囲は、**入力YAML読み込み + Zod検証 + dry-run** とする。
- M2-Aでは、Brave Search APIは呼ばない。
- M2-Aでは、CSV/Markdownは出力しない。
- `--dry-run` では、以下までを実行する。

  - CLI引数パース
  - YAML読み込み
  - Zod検証
  - `search` 配下のデフォルト補完
  - 検索クエリ生成
  - 予定リクエスト数表示
  - 出力予定ディレクトリ表示

- `--input` はP0要件に合わせて必須とする。
- `--input` 未指定時は、入力不正として扱い、Exit Code `2` とする。
- `--out` はP0正式仕様として扱う。
- `--out` 指定時は、入力YAMLの `output.dir` より優先する。
- `--out` では、少なくとも以下を不正とする。

  - 空文字
  - 絶対パス
  - `../` を含むパス

- `search` 配下は省略可能とし、ZodでP0既定値を補完する。
- `output.json` / `output.runReport` / `output.chatgptPrompt` が `true` の場合は、P0対象外として入力不正にする。
- `src/input/researchInputSchema.ts` では、`search` の省略補完に `.default({})` ではなく、`z.preprocess((value) => value ?? {}, schema)` を使う。
- 実装結果は、要件定義書・企画書・設計書ではなく、**実装記録ドキュメント**として残す。
- 実装記録の推奨配置は、`docs/implementation/` 配下とする。
- M2-Aは完了判定でよい。

## 未解決事項

- ユーザーが作成した `implementation-record.md` の正確なファイルパスは未確認。

  - 推奨パスは `docs/implementation/research-memo-builder-m2-a-implementation-record.md`。
  - 実際の作成場所は要確認。

- `implementation-record.md` の中身は未レビュー。

  - M2-Aの実装内容、確認結果、発生エラー、解決策、未対応事項が記録されているか要確認。

- 要件定義書内で、`--out` の禁止条件に `./` 禁止のような記述があるかは未確認。

  - もし `./` 禁止が書かれている場合、設計書・実装と整合させる必要がある。
  - 推奨は、`./output/...` は許可し、「空文字、絶対パス、`../` を禁止」に統一すること。

- `--out ./output/research/tmp-check --dry-run` の動作は未確認。
- Windows絶対パス、Unix絶対パスの異常系テストは未確認。

  - 例：

    - `--out C:\tmp`
    - `--out /tmp`

- `platforms[].site` に `https://note.com` を入れた異常系は、提案のみで実行ログは未確認。
- `search.countPerQuery: 30` の異常系は、提案のみで実行ログは未確認。
- `output.runReport: true`、`output.chatgptPrompt: true` の異常系は未確認。
- `platforms[].site` 重複の異常系は未確認。
- `keywords` 0件、6件以上の異常系は未確認。
- `articleType` が全て `false` の異常系は未確認。
- `.env` 読み込みは未実装。
- `BRAVE_API_KEY` 検証は未実装。
- APIキー未設定時にExit Code `3` で停止する処理は未実装。
- Brave Search API単一検索は未実装。
- `src/config/env.ts` は未実装。
- `src/adapters/braveSearchClient.ts` は未実装。
- `src/domain/searchExecution.ts` は未実装。
- `src/application/runResearchUseCase.ts` は未実装。
- CSV出力は未実装。
- Markdown出力は未実装。
- 検索結果正規化、URL完全一致重複排除は未実装。
- M2-B以降のテスト方針は未整理。

  - 単体テストを導入するか
  - fixtureを置くか
  - APIレスポンスをmockするか
  - どこまで手動確認にするか
  - 要確認

## 次アクション

### P0：最初に確認すること

- 作成済みの `implementation-record.md` を確認する。

  - 推奨確認観点：

    - M2-Aの実装対象11ファイルが記録されているか
    - 実行した確認コマンドが記録されているか
    - `npm run check` 成功が記録されているか
    - dry-run正常系が記録されているか
    - `--input` なしでExit Code `2` が記録されているか
    - `--out` 正常系・異常系が記録されているか
    - 発生したTypeScript/Zodエラーと修正内容が記録されているか
    - 未対応としてM2-B項目が記録されているか

### P1：M2-Bに進む前の軽い整合確認

- 要件定義書・設計書の `--out` 記述を確認する。

  - 対象候補：

    - `docs/requirements/research-memo-builder-p0-requirements.md`
    - `docs/design/research-memo-builder-p0-design.md`

  - 確認論点：

    - `--out` の禁止条件が「空文字、絶対パス、`../`」で揃っているか
    - `./output/...` を禁止する記述が残っていないか

- `implementation-record.md` のパスを次チャットで明記する。

  - 例：

    - `docs/implementation/research-memo-builder-m2-a-implementation-record.md`

### P2：M2-B実装に着手

- 次チャットでは、**M2-B：.env読み込み + Brave Search API単一検索** から再開する。
- 最初に見るべきファイル：

  - `docs/implementation/research-memo-builder-m2-a-implementation-record.md`
  - `docs/requirements/research-memo-builder-p0-requirements.md`
  - `docs/design/research-memo-builder-p0-design.md`
  - `src/cli/research.ts`
  - `src/domain/researchExitCode.ts`
  - `src/domain/searchQuery.ts`
  - `src/services/searchQueryBuilder.ts`
  - `.env.example`
  - `.env`

- M2-Bで作成・修正するファイル候補：

  - `src/config/env.ts`
  - `src/adapters/braveSearchClient.ts`
  - `src/domain/searchExecution.ts`
  - `src/application/runResearchUseCase.ts`
  - `src/cli/research.ts`

- M2-Bの推奨実装順：

  1. `src/config/env.ts` を作る

     - `.env` 読み込み
     - `BRAVE_API_KEY` 検証
     - APIキー値をログに出さない

  2. `src/domain/searchExecution.ts` を作る

     - `SearchQueryExecutionResult`
     - `SearchQueryFailure`

  3. `src/adapters/braveSearchClient.ts` を作る

     - Node標準 `fetch`
     - Brave Search APIへ1クエリ送信
     - レスポンス最小型 `BraveSearchResultItem`

  4. `src/application/runResearchUseCase.ts` を作る

     - M2-Bでは最初の1クエリだけ実行

  5. `src/cli/research.ts` を修正する

     - `--dry-run` は従来どおり
     - dry-runなしの場合はM2-B通常実行へ接続

  6. APIキー未設定時のExit Code `3` を確認する
  7. APIキー設定時に、1キーワード×1媒体の取得件数を表示する

### P3：M2-BのExit条件

- `.env` の `BRAVE_API_KEY` を読める。
- `BRAVE_API_KEY` 未設定時にAPIを呼ばず、Exit Code `3` で停止する。
- APIキー値を標準出力・標準エラーに表示しない。
- 1キーワード×1媒体のBrave Search API検索ができる。
- 最初の1クエリの取得件数を標準出力で確認できる。
- M2-B時点では、CSV/Markdown出力はまだ行わない。

## 気づき

- TypeScriptの型は、外部入力そのものを実行時に守るわけではない。

  - YAML、JSON、APIレスポンス、`.env` などは、プログラム外から来るため `unknown` として扱うのが安全。

- Zodは、外部入力を内部DTOへ変換する「入力境界の門番」として有効。

  - 今回は `unknown` から `ResolvedResearchInput` へ変換する役割を担った。

- `parse()` より `safeParse()` を使うと、CLI向けにエラー表示を整形しやすい。
- TypeScriptの厳格な設定では、`argv[index]` のような配列アクセスも `undefined` 可能性ありとして扱われる。

  - 人間には安全に見えるループでも、TypeScriptには明示チェックが必要になる。

- Zodの `.default({})` は、最終出力型に合う値でないと型エラーになる。

  - 「省略時に `{}` として扱い、中の項目defaultを効かせたい」場合は、`z.preprocess((value) => value ?? {}, schema)` が適している。

- dry-runを先に実装したことで、APIキーやAPIコストに触れる前に、入力・検証・クエリ生成の正しさを確認できた。
- `--out` のような小さなCLI仕様でも、要件・設計・実装の表現がずれる可能性がある。

  - 安全制約は、早めに文言統一した方がよい。

- 実装結果は、要件定義書や設計書に混ぜるより、実装記録として分離した方が追いやすい。
- 「企画書・要件定義書・設計書・実装記録・レビュー記録・学習メモ」を分けると、後から記事素材として再利用しやすい。
- M2-Aのような小さい単位でも、実行ログ・エラー・修正理由を残すと、後日note記事に転用しやすい。

## 記事にできそうな切り口

### 開発日記向き

- 「APIを叩く前にdry-runを作ったら、安心して進められた話」

  - APIキー、APIコスト、外部接続に入る前に、入力検証とクエリ生成だけを確認した流れ。

- 「小さく区切る個人開発：M2-AをYAML + Zod + dry-runだけにした理由」

  - 一気にAPI接続まで進めず、入力境界を先に固めた判断。

- 「TypeScriptのエラーに止められたけど、設計の穴を見つけられた話」

  - `undefined` とZod defaultエラーを通じて、入力チェックの重要性に気づいた流れ。

- 「実装記録を残すようにしたら、開発が迷子になりにくくなった話」

  - 実装ログ、レビュー、学習メモ、次アクションを分離して残す運用。

- 「note記事リサーチ自動化ツールを作り始めた：最初に作ったのは検索ではなく検査だった」

  - 外部APIより先に、入力の安全性を固めた開発日記。

### 技術記事向き

- 「TypeScript CLIでYAML入力をZod検証する最小構成」

  - `yaml`
  - `zod`
  - `tsx`
  - `ResolvedResearchInput`
  - `safeParse`

- 「ZodでYAMLの任意項目をデフォルト補完する：`.default({})` で詰まった話」

  - `.default({})` の型エラー
  - `z.preprocess((value) => value ?? {}, schema)` への変更

- 「CLI引数パーサーを自前実装するときのundefined対策」

  - `argv[index]`
  - `string | undefined`
  - `--input` 必須チェック
  - Exit Code設計

- 「dry-runを先に作る設計：外部API連携前の安全な実装ステップ」

  - 入力検証
  - クエリ生成
  - リクエスト数見積もり
  - API未呼び出し保証

- 「Research Memo BuilderのM2-A設計：DTO、入力境界、CLI、Exit Code」

  - `RawResearchInput`
  - `ResolvedResearchInput`
  - `SearchQuery`
  - `ResearchExitCode`
  - `safePath`

- 「相対パスだけ許可するsafePath実装」

  - 絶対パス禁止
  - `../` 禁止
  - Windowsパス対応
  - CLI `--out` の安全制約

### 有料note / テンプレート化候補

- 「TypeScript CLI初期実装チェックリスト」

  - `package.json`
  - `tsconfig.json`
  - `.env.example`
  - `.gitignore`
  - `src/cli`
  - `npm scripts`

- 「YAML入力仕様テンプレート」

  - `topic`
  - `articleType`
  - `keywords`
  - `platforms`
  - `search`
  - `output`

- 「Zod入力検証テンプレート」

  - 必須項目
  - 任意項目
  - デフォルト補完
  - P0対象外フラグ禁止
  - ドメイン形式チェック
  - 配列件数チェック

- 「dry-run実装チェックリスト」

  - APIを呼ばない
  - ファイルを出力しない
  - 入力検証する
  - デフォルト補完する
  - 生成クエリを表示する
  - 予定リクエスト数を表示する
  - Exit Codeを確認する

- 「実装記録テンプレート」

  - 対象マイルストーン
  - 実装対象ファイル
  - 実装内容
  - 確認コマンド
  - 確認結果
  - 発生エラー
  - 解決策
  - 未対応事項
  - 次アクション

- 「要件・設計・実装記録・レビュー記録の分け方テンプレート」

  - 企画書：なぜ作るか
  - 要件定義書：何を満たすか
  - 設計書：どう作るか
  - 実装記録：何を作ったか
  - レビュー記録：何を確認したか
  - 学習メモ：何を学んだか
