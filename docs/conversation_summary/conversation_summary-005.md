# 引き継ぎまとめ

## 実施内容

- 前チャットからの引き継ぎを受け、まず `implementation-record.md` のレビューを実施した。

  - 対象ファイル：`research-memo-builder-m2-a-implementation-record.md`
  - M2-Aの実装記録として、内容は概ね妥当と判定した。
  - レビュー観点は以下。

    - M2-A実装内容が記録されているか
    - 確認コマンドが記録されているか
    - dry-run正常系が記録されているか
    - `--input` なしの Exit Code `2` が記録されているか
    - `--out` 正常系・異常系が記録されているか
    - TypeScript / Zod エラーと修正内容が記録されているか
    - M2-B以降の未対応項目が記録されているか

- `implementation-record.md` の修正版を作成した。

  - Frontmatterを文頭に追加した。
  - `file_path` を追加した。
  - dry-run詳細確認を追記した。
  - `--out` の安全ルールを追記した。
  - 未対応項目を M2-B / M3以降 / M4以降 / M5以降 / P1以降 に分類した。
  - M2-A完了判定を明記した。

- ユーザーにより、`implementation-record.md` が修正済みと報告された。

  - また、要件定義書側の `--out` 禁止条件も `../` 禁止に統一済みと報告された。

- M2-Bに着手した。

  - 対象：`.env` 読み込み + Brave Search API単一検索
  - 実装順は以下として進めた。

    1. `src/config/env.ts`
    2. `src/domain/searchExecution.ts`
    3. `src/adapters/braveSearchClient.ts`
    4. `src/application/runResearchUseCase.ts`
    5. `src/cli/research.ts`
    6. APIキー未設定時の Exit Code `3`
    7. APIキー設定時の1クエリ検索

- `src/config/env.ts` の実装案を作成した。

  - `.env` を `dotenv.config()` で読み込む。
  - `BRAVE_API_KEY` を取得する。
  - 未設定・空文字の場合は `EnvConfigError` を投げる。
  - APIキー値は標準出力・標準エラーに表示しない。
  - `env.ts` では Exit Code `3` を直接扱わず、CLI層で変換する方針とした。

- `src/config/env.ts` の検証結果をレビューした。

  - `BRAVE_API_KEY` 未設定時に `EnvConfigError` が出ることを確認。
  - `BRAVE_API_KEY` 設定時に `env loaded: BRAVE_API_KEY is set` が表示されることを確認。
  - APIキー実値が表示されていないことを確認。
  - `npm run format` 成功。
  - `npm run typecheck` 成功。
  - `npm run check` 成功。
  - `src/config/env.ts` はM2-B入口として完了判定でよいとした。

- `src/domain/searchExecution.ts` の実装案を作成した。

  - `SearchQueryFailureType`
  - `SearchQueryFailure`
  - `SearchQueryExecutionResult<TItem>`
  - domain層がBrave API固有型に直接依存しないよう、`SearchQueryExecutionResult<TItem>` はジェネリック型にした。

- `src/adapters/braveSearchClient.ts` の実装案を作成した。

  - Node標準 `fetch` を使用。
  - Brave Web Search APIへGETリクエストを送信。
  - `X-Subscription-Token` ヘッダーでAPIキーを送信。
  - `q`
  - `count`
  - `country`
  - `search_lang`
  - `ui_lang`
  - `extra_snippets`
  - レスポンス最小型として `BraveSearchResultItem` を定義。
  - HTTPエラー、ネットワークエラー、レスポンス形式不正を `SearchQueryExecutionResult` の失敗として返す設計にした。

- `src/application/runResearchUseCase.ts` の実装案を作成した。

  - `ResolvedResearchInput` から検索クエリを生成。
  - M2-Bでは最初の1クエリだけ実行。
  - `.env` から `BRAVE_API_KEY` を読み込む。
  - `BraveSearchClient` で単一検索を実行。
  - 成功時は取得件数を返す。
  - 失敗時は実行結果を返す。

- 既存の `src/cli/research.ts` をベースに、M2-B対応版を作成した。

  - ユーザーが既存ファイルを提示。
  - 提示内容には、こちらが前回提示したimportが一部重複して混ざっていた。
  - 既存コードをベースに改訂版を作成した。
  - `.js` 付きimportに統一。
  - `--dry-run` 必須制限を削除。
  - `--dry-run` ありの場合は従来どおりAPIを呼ばない。
  - `--dry-run` なしの場合だけ `runResearchUseCase()` を呼ぶ。
  - M2-B成功時に以下を表示するようにした。

    - 生成クエリ数
    - 実行クエリ数
    - 最初のクエリ
    - 取得件数
    - CSV/Markdown未出力

  - `EnvConfigError` を `ResearchExitCode.CONFIG_ERROR = 3` に変換するようにした。

- `npm run typecheck` で発生したTypeScriptエラーをレビューした。

  - エラー：

    - `TS2835: Relative import paths need explicit file extensions`

  - 対象ファイル：

    - `src/adapters/braveSearchClient.ts`
    - `src/application/runResearchUseCase.ts`
    - `src/domain/searchExecution.ts`

  - 原因：

    - `moduleResolution: node16` または `nodenext` のESM設定では、相対importに明示的な拡張子が必要。
    - 既存コードは `.js` 付きimportで統一されていたが、新規追加ファイルでは拡張子なしimportになっていた。

  - 修正案：

    - 相対importに `.js` を付ける。
    - `.ts` ではなく `.js` を使う。
    - `tsconfig.json` は変更しない。

  - ユーザーにより修正され、`npm run typecheck` は成功した。

- M2-B通常実行で `Brave Search API request failed.` が発生したため、原因調査を行った。

  - 実行結果：

    - `Failure type: http_error`
    - `HTTP status: 422`

  - 初期推定：

    - Brave APIには到達している。
    - APIキー読み込みとCLI接続は成功している。
    - HTTP 422 は送信パラメータ不正の可能性が高い。

  - 追加対応：

    - HTTPエラー時にレスポンス本文を安全に表示する修正案を提示。
    - `readSafeErrorBody(response)`
    - `sanitizeErrorBody(text)`
    - 空白圧縮、最大500文字制限で表示する方針とした。

- `Accept-Encoding: gzip` ヘッダーの追加位置を説明した。

  - 対象ファイル：`src/adapters/braveSearchClient.ts`
  - 対象箇所：`fetch(url, { method: "GET", headers: { ... } })`
  - ただし、HTTP 422の原因特定には、`Accept-Encoding` 追加よりエラーボディ表示の方が重要と説明した。

- HTTP 422の詳細レスポンスをもとに原因を特定した。

  - レスポンス本文に以下が含まれていた。

    - `loc: ["query","search_lang"]`
    - `Input should be ... 'jp' ...`

  - 原因：

    - YAML上で `searchLang: ja` としていた。
    - Brave Search APIの `search_lang` では `jp` が必要だった。

  - 方針：

    - YAML項目名は `searchLang` のままでよい。
    - API送信時のパラメータ名は `search_lang` のままでよい。
    - 修正すべきは値。

  - 修正：

    - `searchLang: ja`
    - `searchLang: jp`

- `searchLang` を `jp` に変更後、M2-B単一検索が成功した。

  - 実行コマンド：

    - `npm run research -- --input research/inputs/ats-rule-spec.yaml`

  - 結果：

    - `M2-B single search completed.`
    - `Generated query count: 15`
    - `Executed query count: 1`
    - `First query: site:note.com 家庭内ルール 仕様書`
    - `Retrieved item count: 10`
    - `CSV/Markdown output is skipped in M2-B.`

  - M2-B完了判定でよいとした。

- `m2-b-implementation-report.md` のドラフトを作成した。

  - 保存想定パス：

    - `docs/implementation/research-memo-builder-m2-b-implementation-report.md`

  - 内容：

    - Frontmatter
    - 対象マイルストーン
    - 実装目的
    - 実装対象
    - 実装内容
    - 発生した問題と対応
    - 確認結果
    - M2-B完了判定
    - 未対応
    - 次アクション

  - ユーザーにより、実際に `docs/implementation/research-memo-builder-m2-b-implementation-report.md` へ保存済みと報告された。

- ユーザーにより、ほかのドキュメントについても `ja` を `jp` に変更済みと報告された。

  - 対象ファイルの詳細は未確認。
  - 変更済みと報告された候補：

    - `research/inputs/ats-rule-spec.yaml`
    - `src/input/researchInputSchema.ts`
    - `docs/requirements/research-memo-builder-p0-requirements.md`
    - `docs/design/research-memo-builder-p0-design.md`
    - `docs/implementation/research-memo-builder-m2-a-implementation-record.md`
    - `docs/implementation/research-memo-builder-m2-b-implementation-report.md`

## 決定事項

- M2-Aは完了済みとして扱う。

  - 入力YAML読み込み、Zod検証、dry-run、検索クエリ生成、`--out` 上書き、入力不正時 Exit Code `2` まで確認済み。

- `implementation-record.md` はFrontmatterを文頭に置く形式とする。

  - 0章として文書情報を書くのではなく、文頭Frontmatterで管理する。

- `--out` の禁止条件は以下に統一する。

  - 空文字
  - null文字
  - Unix絶対パス
  - Windows絶対パス
  - `../` を含むパス
  - `./output/...` は許可する。

- M2-Bの対象範囲は、`.env` 読み込み + Brave Search API単一検索までとする。

- `src/config/env.ts` は設定読み込み専用にする。

  - Exit Codeは直接扱わない。
  - `EnvConfigError` を投げる。
  - CLI層で `CONFIG_ERROR = 3` に変換する。

- APIキー未設定時は、APIを呼ばずに Exit Code `3` で停止する。

- APIキー値は標準出力・標準エラーに表示しない。

- `SearchQueryExecutionResult<TItem>` はジェネリック型とする。

  - domain層がBrave API固有のレスポンス型に直接依存しないようにするため。

- M2-Bでは、生成した検索クエリのうち最初の1クエリだけ実行する。

- M2-Bでは、CSV/Markdownは出力しない。

- `--dry-run` は従来どおりAPIを呼ばない。

  - APIキー未設定でもdry-runは成功させる。

- TypeScriptの相対importは `.js` 付きに統一する。

  - `moduleResolution: node16` / `nodenext` のESM設定に合わせるため。
  - `.ts` 拡張子は使わない。
  - `tsconfig.json` は変更しない。

- Brave Search APIの `search_lang` には `ja` ではなく `jp` を使う。

  - YAMLの項目名は `searchLang` のままとする。
  - API送信時のパラメータ名は `search_lang` のままとする。
  - 修正対象は値。

- `docs/implementation/research-memo-builder-m2-b-implementation-report.md` を作成・保存済みとする。

- M2-Bは完了判定でよい。

  - 15クエリ生成。
  - 1クエリ実行。
  - 10件取得。
  - CSV/Markdown未出力。
  - APIキー未設定時 Exit Code `3`。
  - dry-runでAPI未呼び出し。

## 未解決事項

- `searchLang: jp` への修正が、全関連ファイルに反映されているかは未レビュー。

  - ユーザーから変更済みとは報告あり。
  - 次チャットで必要に応じて実ファイル確認する。
  - 確認候補：

    - `research/inputs/ats-rule-spec.yaml`
    - `src/input/researchInputSchema.ts`
    - `docs/requirements/research-memo-builder-p0-requirements.md`
    - `docs/design/research-memo-builder-p0-design.md`
    - `docs/implementation/research-memo-builder-m2-a-implementation-record.md`
    - `docs/implementation/research-memo-builder-m2-b-implementation-report.md`

- `uiLang: ja-JP` がBrave Search API仕様上、今後も問題ないかは要確認。

  - 今回のM2-B成功時点では `uiLang: ja-JP` のまま成功していると見られる。
  - ただし、将来的にBrave API側の仕様変更や入力バリエーションが増える場合は、明示的な許可値検証が必要になる可能性あり。

- `searchLang` のZod検証をどこまで厳密にするかは未決定。

  - 現状は `jp` に修正済みと報告あり。
  - `z.string()` のままにするか、`z.enum([...])` で許可値制限するかは未決定。
  - P0ではまず `jp` を既定値にするだけで十分と考えたが、正式決定は未実施。

- HTTPエラー本文表示を本番的に残すか、M2-Bデバッグ用に留めるかは未決定。

  - 現状は原因特定に有効。
  - 将来的にはエラー本文の表示量・出力先・run-report出力との関係を整理する必要あり。
  - APIキー値は出していないが、APIレスポンス本文をどこまで表示するかは設計上の確認余地あり。

- M3で複数クエリ実行する際のAPI呼び出し間隔は未決定。

  - 逐次実行は方針化済み。
  - `sleep` を入れるか、入れないかは未決定。
  - レート制限対策はP0では自動リトライしない方針だが、最低限の間隔を置くかは要検討。

- M3での一部失敗・全失敗の実装詳細は未実装。

  - 一部失敗時 Exit Code `1`
  - 全失敗時 Exit Code `4`
  - 成功クエリ数・失敗クエリ数の集計
  - 失敗クエリ情報の保持
  - M3で具体化が必要。

- 検索結果正規化は未実装。

  - `BraveSearchResultItem` から `NormalizedSearchResult` への変換が必要。
  - URLなし結果の除外。
  - titleなし結果の扱い。
  - `description` なし時の `snippet: ""`。
  - `extra_snippets` なし時の `extraSnippets: []`。
  - `rank` の付与。
  - `retrievedAt` の引き継ぎ。

- URL完全一致重複排除は未実装。

  - `deduplicationService.ts`
  - `DeduplicationResult`
  - `removedCount`
  - `removedUrls`
  - 最初に取得した1件を採用する方針は設計済みだが、実装は未着手。

- CSV出力は未実装。

  - M4で対応予定。
  - `csvEscape.ts`
  - `csvRenderer.ts`
  - UTF-8 with BOM
  - ヘッダー固定
  - 0件時ヘッダーのみ
  - 既存ファイル上書き

- Markdown出力は未実装。

  - M5で対応予定。
  - `markdownEscape.ts`
  - `markdownResearchMemoRenderer.ts`
  - 指定章構成
  - 似たタイトル一覧
  - P0注意書き
  - 0件時Markdown

- M2-Bの実装レポート保存後のレビューは未実施。

  - ユーザーが保存済みと報告。
  - 次チャットで必要であれば、`docs/implementation/research-memo-builder-m2-b-implementation-report.md` をレビューする。

## 次アクション

### P0：次チャットで最初に確認すること

- `docs/implementation/research-memo-builder-m2-b-implementation-report.md` を確認する。

  - M2-B実装内容が正しく記録されているか。
  - `searchLang: jp` の知見が記録されているか。
  - M2-B完了判定が明記されているか。
  - 未対応としてM3以降の項目が整理されているか。

- `searchLang: jp` への変更反映を確認する。

  - 優先確認ファイル：

    - `research/inputs/ats-rule-spec.yaml`
    - `src/input/researchInputSchema.ts`
    - `docs/requirements/research-memo-builder-p0-requirements.md`
    - `docs/design/research-memo-builder-p0-design.md`

  - 確認観点：

    - `searchLang: ja` が残っていないか。
    - デフォルト値が `jp` に変わっているか。
    - ドキュメント上のBrave Search APIパラメータ説明が `jp` 前提になっているか。

### P1：M3の実装方針を確定する

- 次は M3：複数キーワード・複数媒体検索に進む。

- 最初に見るべきファイル：

  - `src/application/runResearchUseCase.ts`
  - `src/adapters/braveSearchClient.ts`
  - `src/domain/searchExecution.ts`
  - `src/domain/searchQuery.ts`
  - `src/services/searchQueryBuilder.ts`
  - `src/domain/researchExitCode.ts`
  - `docs/design/research-memo-builder-p0-design.md`
  - `docs/requirements/research-memo-builder-p0-requirements.md`

- M3で作成・修正する候補ファイル：

  - `src/application/runResearchUseCase.ts`
  - `src/services/searchResultNormalizer.ts`
  - `src/services/deduplicationService.ts`
  - `src/domain/normalizedSearchResult.ts`
  - `src/domain/deduplicationResult.ts`
  - 必要に応じて `src/domain/researchRunResult.ts`

### P2：M3実装の推奨順

1. `runResearchUseCase.ts` を、最初の1クエリ実行から複数クエリ逐次実行へ拡張する。

   - 15クエリを順番に実行。
   - 成功・失敗を配列で保持。
   - 1クエリ失敗しても他クエリを継続。

2. 成功クエリ数・失敗クエリ数を集計する。

   - `succeededQueryCount`
   - `failedQueryCount`
   - `queryCount`

3. 一部失敗・全失敗の終了コードを実装する。

   - 全成功：`SUCCESS = 0`
   - 一部失敗：`PARTIAL_API_FAILURE = 1`
   - 全失敗：`ALL_API_FAILURE = 4`

4. `NormalizedSearchResult` を定義する。

   - `src/domain/normalizedSearchResult.ts`

5. `searchResultNormalizer.ts` を作成する。

   - `BraveSearchResultItem` を `NormalizedSearchResult` に変換。
   - URLなし結果を除外。
   - titleなし結果の扱いを設計に合わせる。
   - `rank` を付与。
   - `snippet` と `extraSnippets` を正規化。

6. `deduplicationService.ts` を作成する。

   - URL完全一致のみで重複排除。
   - 最初に取得した結果を採用。
   - `removedCount` と `removedUrls` を返す。

7. M3時点ではCSV/Markdownを出力しない。

   - 件数・失敗数・重複排除数を標準出力で確認できればよい。

### P3：M3のExit条件案

- 5キーワード×3媒体の15クエリを逐次実行できる。
- 各クエリの成功・失敗を保持できる。
- 1クエリ失敗しても他クエリを継続できる。
- 成功クエリ数・失敗クエリ数を表示できる。
- Brave Search APIレスポンスを `NormalizedSearchResult` に変換できる。
- URL完全一致の重複を1件に統合できる。
- 重複排除前件数・重複排除後件数を表示できる。
- 全成功時は Exit Code `0`。
- 一部失敗時は Exit Code `1`。
- 全失敗時は Exit Code `4`。
- M3ではCSV/Markdownをまだ出力しない。

## 気づき

- `typecheck` が通っても、API仕様とのズレは実行時まで分からない。

  - 今回はTypeScript型としては問題なかったが、Brave APIの `search_lang` enumによりHTTP 422が発生した。
  - 外部API連携では、型安全とAPI仕様準拠は別問題。

- エラーボディを読めるようにしたことで、原因特定が一気に進んだ。

  - 当初は `ui_lang` や `extra_snippets` も候補だった。
  - レスポンス本文の `loc: ["query","search_lang"]` により、原因を確定できた。
  - API連携の初期実装では、HTTPステータスだけでなく、安全にエラーボディを読む設計が重要。

- `searchLang` と `search_lang` の違いを整理できた。

  - 内部DTO / YAMLでは `searchLang`。
  - Brave API送信時は `search_lang`。
  - 問題は名前ではなく値だった。
  - camelCase内部表現とsnake_case外部API表現を分ける設計は妥当。

- Brave Search APIでは、日本語検索言語コードが `ja` ではなく `jp` だった。

  - 一般的なISO言語コードの感覚だけで決めるとズレる。
  - APIごとのenum値は実機確認が必要。

- Node ESM / TypeScriptでは、相対importの `.js` 拡張子が重要。

  - `.ts` ではなく `.js`。
  - 既存コードのimport方針に合わせるのが安全。
  - `tsconfig.json` を変えるより、新規ファイルを既存方針に合わせる方がよい。

- M2-Bを小さく切ったことで、問題の切り分けがしやすかった。

  - `.env` 読み込み
  - APIキー未設定
  - CLI接続
  - 1クエリ実行
  - APIパラメータ不正
  - それぞれを段階的に確認できた。

- `--dry-run` の価値が明確になった。

  - APIキー不要で入力YAML、デフォルト補完、生成クエリを確認できる。
  - APIコストや外部APIエラーを避けて、入力・クエリ生成だけを検証できる。
  - 今後も新しい入力ファイルを作るたびに有用。

- 実装記録を残すことで、エラー対応そのものが資産化できる。

  - M2-A実装記録
  - M2-B実装レポート
  - TypeScript importエラー
  - Brave API 422エラー
  - これらは後日note記事の材料になる。

## 記事にできそうな切り口

### 開発日記向き

- 「APIに届いたのに失敗する」個人開発のリアル

  - APIキーは合っている。
  - 通信もできている。
  - でもHTTP 422で止まる。
  - 原因は `ja` ではなく `jp` という小さな仕様差だった、という話。

- 「dry-runを先に作っておいて助かった話」

  - APIを呼ばずに15クエリ生成まで確認できた。
  - 問題がAPI接続側なのか、入力YAML側なのか切り分けやすかった。
  - 小さく検証できる道具を先に作る価値。

- 「失敗ログも実装資産になる」

  - TypeScriptのimportエラー。
  - Brave APIの422エラー。
  - APIキー未設定時のExit Code確認。
  - エラーを潰すだけでなく、実装レポートに残すことで次の自分を助ける。

- 「個人開発でもExit Codeを真面目に決める理由」

  - 入力不正は `2`。
  - 設定不備は `3`。
  - API全失敗は `4`。
  - ただ動けばよいCLIではなく、後から運用しやすいCLIを作る話。

- 「家庭内ポイント制度の記事を書くために、記事リサーチ自動化ツールを作っている話」

  - ATS開発とnote発信が接続している。
  - 記事を書くためのリサーチを、さらに自動化している。
  - 個人開発が発信プロセスそのものを改善していく流れ。

### 技術記事向き

- TypeScript + Node ESMで相対importに `.js` が必要な理由

  - `moduleResolution: node16` / `nodenext`
  - `.ts` ではなく `.js` を書く理由
  - 既存コードとimport方針を揃える重要性

- ZodでYAML入力を検証し、外部APIパラメータに変換する設計

  - YAMLは `unknown`
  - Zodで `ResolvedResearchInput`
  - 内部はcamelCase
  - API送信時だけsnake_case
  - `searchLang` → `search_lang`

- Brave Search API連携の最小実装

  - `fetch`
  - `X-Subscription-Token`
  - `q`
  - `count`
  - `country`
  - `search_lang`
  - `ui_lang`
  - `extra_snippets`
  - HTTPエラーの扱い

- HTTP 422を安全にデバッグする設計

  - HTTPステータスだけでは原因不明。
  - レスポンス本文を読む。
  - APIキーを出さない。
  - 表示文字数を制限する。
  - `loc` を見て原因パラメータを特定する。

- CLIにおけるExit Code設計

  - `SUCCESS = 0`
  - `PARTIAL_API_FAILURE = 1`
  - `INPUT_ERROR = 2`
  - `CONFIG_ERROR = 3`
  - `ALL_API_FAILURE = 4`
  - `OUTPUT_ERROR = 5`
  - `UNEXPECTED_ERROR = 9`
  - どういうエラーをどこで分類するか。

- UseCase / Adapter / Domain DTO の責務分担

  - `env.ts` は設定読み込み。
  - `BraveSearchClient` は外部API接続。
  - `runResearchUseCase` は処理のオーケストレーション。
  - `searchExecution.ts` は実行結果DTO。
  - CLIは引数パースと表示・Exit Code変換。

- dry-run設計パターン

  - 入力検証だけ先に通す。
  - APIは呼ばない。
  - 出力ファイルも書かない。
  - 予定リクエスト数とクエリを表示する。
  - APIコストと副作用を抑えるCLI設計。

### 有料note / テンプレート化候補

- TypeScript CLI 実装記録テンプレート

  - Frontmatter
  - 対象マイルストーン
  - 実装目的
  - 実装対象
  - 実装内容
  - 発生した問題と対応
  - 確認結果
  - 完了判定
  - 未対応
  - 次アクション

- 外部API接続チェックリスト

  - APIキー未設定時の挙動
  - APIキーをログに出していないか
  - 最小リクエストで成功するか
  - HTTPエラー本文を確認できるか
  - 422時の原因パラメータを特定できるか
  - 公式enum値と入力値が一致しているか
  - dry-runではAPIを呼ばないか

- CLI Exit Code 設計テンプレート

  - 入力不正
  - 設定不備
  - 一部API失敗
  - 全API失敗
  - 出力失敗
  - 想定外エラー
  - 標準出力・標準エラーの使い分け

- YAML入力仕様テンプレート

  - 必須項目
  - 任意項目
  - デフォルト値
  - 外部APIパラメータ対応表
  - 安全なパス制約
  - P0対象外フラグ
  - 検証観点

- dry-run仕様テンプレート

  - 入力ファイル表示
  - topic表示
  - articleType表示
  - search設定表示
  - 出力予定ディレクトリ表示
  - 予定リクエスト数表示
  - 生成クエリ一覧表示
  - API未呼び出し明記
  - ファイル未出力明記

- APIエラー調査手順書

  - HTTPステータス確認
  - エラーボディ表示
  - 原因パラメータ特定
  - 最小リクエスト化
  - パラメータを1つずつ戻す
  - 修正内容を実装レポートへ残す

- 個人開発マイルストーン運用テンプレート

  - M2-A：入力検証 + dry-run
  - M2-B：API単一検索
  - M3：複数検索 + 正規化 + 重複排除
  - M4：CSV出力
  - M5：Markdown出力
  - 各マイルストーンで「どこまでやるか」「何をやらないか」を明確にするテンプレート
