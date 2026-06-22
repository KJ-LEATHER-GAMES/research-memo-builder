# 引き継ぎまとめ

## 実施内容

- 前チャットからの引き継ぎを受け、M2-B実装レポートと `searchLang: jp` 反映状況のレビューを行った。

  - 対象：

    - `docs/implementation/research-memo-builder-m2-b-implementation-report.md`
    - `research/inputs/ats-rule-spec.yaml`
    - `src/input/researchInputSchema.ts`
    - `docs/requirements/research-memo-builder-p0-requirements.md`
    - `docs/design/research-memo-builder-p0-design.md`

  - 確認観点：

    - M2-B実装内容が記録されているか
    - `searchLang: jp` の知見が記録されているか
    - M2-B完了判定が明記されているか
    - M3以降の未対応項目が整理されているか
    - `searchLang: ja` が残っていないか
    - デフォルト値が `jp` になっているか
    - Brave Search APIパラメータ説明が `jp` 前提になっているか

- M2-B実装レポートのレビューで、以下を指摘した。

  - 添付ZIP内では指定名の `research-memo-builder-m2-b-implementation-report.md` が見つからず、実体は `research-memo-builder-m2-b-implementation-record.md` だった。
  - frontmatter内の `source_documents` が `*` 箇条書きになっており、YAMLとして不正だった。
  - `docs/requirements/research-memo-builder-p0-requirements.md` と `docs/design/research-memo-builder-p0-design.md` に `searchLang: ja` が残っていた。
  - `src/input/researchInputSchema.ts` とYAML側は `jp` 反映済みと確認した。
  - M2-B実装内容自体は概ね妥当と判定した。

- ユーザーにより、M2-Bレビュー指摘内容が更新された。

  - `searchLang: jp` への反映更新
  - M2-B実装レポートの形式修正
  - 最終的にM3へ進む前提が整った。

- M3の実装方針を提案した。

  - M3の対象を以下と定義した。

    - 複数クエリ逐次実行
    - 成功/失敗集計
    - 検索結果正規化
    - URL完全一致重複排除
    - 一部失敗 Exit Code `1`
    - 全失敗 Exit Code `4`
    - M3ではCSV/Markdown未出力

  - M3で作成・修正する候補ファイルを整理した。

    - `src/application/runResearchUseCase.ts`
    - `src/services/searchResultNormalizer.ts`
    - `src/services/deduplicationService.ts`
    - `src/domain/normalizedSearchResult.ts`
    - `src/domain/deduplicationResult.ts`
    - `src/domain/researchRunResult.ts`
    - `src/cli/research.ts`

- M3 Step 1〜4として、以下4ファイルのコード案を作成した。

  - `src/domain/normalizedSearchResult.ts`

    - `NormalizedSearchResult` 型を定義。
    - `keyword`
    - `platform`
    - `query`
    - `rank`
    - `title`
    - `url`
    - `snippet`
    - `extraSnippets`
    - `retrievedAt`

  - `src/domain/deduplicationResult.ts`

    - `DeduplicationResult` 型を定義。
    - `results`
    - `removedCount`
    - `removedUrls`

  - `src/services/searchResultNormalizer.ts`

    - `BraveSearchResultItem[]` を `NormalizedSearchResult[]` へ変換する `normalizeSearchResults()` を提案。
    - URLなし/titleなしは除外。
    - `description` なしは `snippet: ""`。
    - `extra_snippets` なしは `extraSnippets: []`。
    - `rank` はBraveレスポンス内の元順位を維持。

  - `src/services/deduplicationService.ts`

    - `deduplicateByExactUrl()` を提案。
    - URL完全一致のみで重複排除。
    - 最初に出現した結果を採用。
    - 2回目以降の同一URLを除外。

- ユーザーにより、M3 Step 1〜4の実装後に以下が実行され、エラーなしと報告された。

  - `npm run typecheck`
  - `npm run format`
  - `npm run check`

- `src/application/runResearchUseCase.ts` のM3対応コード案を作成した。

  - 実装内容：

    - `buildSearchQueries()` で生成された全クエリを逐次実行。
    - `succeededQueryCount` / `failedQueryCount` を集計。
    - 成功分だけ `normalizeSearchResults()` で正規化。
    - 正規化結果を `deduplicateByExactUrl()` でURL完全一致重複排除。
    - Exit Codeを以下の条件で判定。

      - 全成功：`ResearchExitCode.SUCCESS = 0`
      - 一部失敗：`ResearchExitCode.PARTIAL_API_FAILURE = 1`
      - 全失敗：`ResearchExitCode.ALL_API_FAILURE = 4`

    - CLIに返す結果として以下を整理。

      - `queryCount`
      - `executedQueryCount`
      - `succeededQueryCount`
      - `failedQueryCount`
      - `rawResultCount`
      - `normalizedResultCount`
      - `deduplicatedResultCount`
      - `removedDuplicateCount`
      - `removedDuplicateUrls`
      - `results`
      - `failures`
      - `warnings`
      - `generatedFiles`

  - 現行CLIとの暫定互換として、以下のフィールドを一時的に残す案を提示した。

    - `firstQuery`
    - `retrievedItemCount`
    - `executionResult`

- `src/cli/research.ts` のM3対応コード案を作成した。

  - 修正内容：

    - ヘルプ文言の `M2-B note` を `M3 note` に変更。
    - `printM2BSuccessResult()` を `printResearchRunResult()` に変更。
    - `printM2BFailureResult()` を `printResearchFailures()` に変更。
    - 一部失敗時でも成功分の件数を表示。
    - CLI側ではExit Codeを再判定せず、`result.exitCode` をそのまま返す。
    - 通常実行時に以下を表示。

      - `Generated query count`
      - `Executed query count`
      - `Succeeded query count`
      - `Failed query count`
      - `Raw item count`
      - `Normalized item count`
      - `Deduplicated item count`
      - `Removed duplicate count`
      - `CSV/Markdown output is skipped in M3.`

    - 失敗時には `Failed API requests` として、query / keyword / type / HTTP status / message を表示。

- ユーザーにより、M3正常系の実行結果が共有された。

  - `npm run typecheck` 成功。
  - `npm run format` 成功。
  - `npm run check` 成功。
  - 通常実行：

    - `Generated query count: 15`
    - `Executed query count: 15`
    - `Succeeded query count: 15`
    - `Failed query count: 0`
    - `Raw item count: 150`
    - `Normalized item count: 150`
    - `Deduplicated item count: 139`
    - `Removed duplicate count: 11`
    - `CSV/Markdown output is skipped in M3.`

  - dry-run：

    - `Planned requests: 15`
    - `searchLang: jp`
    - `No Brave Search API calls were made.`
    - `No CSV or Markdown files were written.`

- M3正常系レビューを実施した。

  - 15クエリ実行OK。
  - 成功15件・失敗0件OK。
  - `rawResultCount = 150` は `15クエリ × count 10` と整合。
  - `normalizedResultCount = 150` は `rawResultCount` 以下でOK。
  - `deduplicatedResultCount = 139` は `normalizedResultCount` 以下でOK。
  - `removedDuplicateCount = 11` は `150 - 139 = 11` と整合。
  - CSV/Markdown未出力OK。
  - `echo %ERRORLEVEL%` によるExit Code確認を追加推奨した。
  - `src/domain/deduplicationService.ts` が不要ファイルとして存在している可能性を指摘した。

- ユーザーにより、M3正常系の追加確認結果が共有された。

  - `echo %ERRORLEVEL%` は `0`。
  - `src/domain/deduplicationService.ts` は不要と判断し削除。
  - 削除後 `npm run check` 成功。
  - `output/research` フォルダへのファイル生成なし。

- M3異常系・準正常系の確認手順を提示した。

  - 一部失敗 Exit Code `1`：

    - 一時フォルト注入として `RMB_FORCE_FAILURE_QUERY_INDEX=1` を使う案を提示。
    - 1クエリだけ強制的に失敗扱いにし、残り14クエリが継続実行されることを確認する手順を提案。

  - 全失敗 Exit Code `4`：

    - 一時フォルト注入として `RMB_FORCE_ALL_FAILURES=1` を使う案を提示。
    - 15クエリすべてを失敗扱いにし、全失敗判定になることを確認する手順を提案。

  - 無効なAPIキーによる全失敗確認は代替案として提示したが、必須とはしなかった。

- ユーザーにより、一部失敗・全失敗の実行結果が共有された。

  - 一部失敗：

    - `RMB_FORCE_FAILURE_QUERY_INDEX=1`
    - `Generated query count: 15`
    - `Executed query count: 15`
    - `Succeeded query count: 14`
    - `Failed query count: 1`
    - `Raw item count: 140`
    - `Normalized item count: 140`
    - `Deduplicated item count: 131`
    - `Removed duplicate count: 9`
    - 失敗詳細に `HTTP status: 599`
    - `echo %ERRORLEVEL% = 1`
    - `output/research` への出力なし

  - 全失敗：

    - `RMB_FORCE_ALL_FAILURES=1`
    - `Generated query count: 15`
    - `Executed query count: 15`
    - `Succeeded query count: 0`
    - `Failed query count: 15`
    - `Raw item count: 0`
    - `Normalized item count: 0`
    - `Deduplicated item count: 0`
    - `Removed duplicate count: 0`
    - 失敗詳細15件表示
    - `echo %ERRORLEVEL% = 4`
    - `output/research` への出力なし

  - 変更を元に戻した後の通常実行：

    - `Generated query count: 15`
    - `Executed query count: 15`
    - `Succeeded query count: 15`
    - `Failed query count: 0`
    - `Raw item count: 150`
    - `Normalized item count: 150`
    - `Deduplicated item count: 138`
    - `Removed duplicate count: 12`
    - CSV/Markdown未出力

- M3異常系・準正常系レビューを実施した。

  - 一部失敗 Exit Code `1` は期待どおりと判定。
  - 全失敗 Exit Code `4` は期待どおりと判定。
  - 一部失敗時も成功分が正規化・重複排除されることを確認。
  - 全失敗時は検索結果0件の正常終了ではなく、Exit Code `4` として区別されることを確認。
  - フォルト注入解除後、正常系に戻っていることを確認。
  - 無効なAPIキーでの全失敗確認は未実施だが、M3のUseCase集計・Exit Code判定確認としては必須ではないと判断した。

- M3実装レポートのMarkdown案を作成した。

  - 保存先案：

    - `docs/implementation/research-memo-builder-m3-implementation-report.md`

  - 記載内容：

    - M3実装対象
    - 追加・修正ファイル
    - 正常系確認結果
    - dry-run確認結果
    - 一部失敗 Exit Code `1` 確認結果
    - 全失敗 Exit Code `4` 確認結果
    - CSV/Markdown未出力確認
    - 一時フォルト注入は確認後に削除したこと
    - M3完了判定
    - M4以降の未対応事項

  - frontmatter付きMarkdownとして作成した。
  - `source_documents` には以下を含めた。

    - `docs/requirements/research-memo-builder-p0-requirements.md`
    - `docs/design/research-memo-builder-p0-design.md`
    - `docs/implementation/research-memo-builder-m2-b-implementation-record.md`
    - `docs/implementation/M3-planning.md`

- ユーザーにより、M3実装レポートが保存された。

  - 保存先：

    - `docs/implementation/research-memo-builder-m3-implementation-report.md`

- ユーザーにより、最終チェックOKと報告された。

  - `npm run check` 成功。
  - `findstr /S /N /I "RMB_FORCE" src\*.ts` は出力なし。
  - 一時フォルト注入コードが残っていないことを確認済み。

## 決定事項

- M3の実装対象は、複数キーワード・複数媒体検索の実行制御までとする。

  - 5キーワード × 3媒体 = 15クエリを対象にする。
  - 生成された全クエリを逐次実行する。
  - 並列実行はM3では採用しない。

- M3では、検索結果の正規化を実装する。

  - `BraveSearchResultItem` を `NormalizedSearchResult` に変換する。
  - URLなし/titleなし結果は除外する。
  - `description` なしは `snippet: ""` にする。
  - `extra_snippets` なしは `extraSnippets: []` にする。
  - `rank` はBraveレスポンス内の元順位を維持し、正規化後に再採番しない。

- M3では、URL完全一致のみで重複排除する。

  - 最初に取得した結果を採用する。
  - 2回目以降に出現した同一URLを除外する。
  - 高度なURL正規化やタイトル類似判定はM3では行わない。

- M3のExit Code判定は以下とする。

  - 全成功：`SUCCESS = 0`
  - 一部失敗：`PARTIAL_API_FAILURE = 1`
  - 全失敗：`ALL_API_FAILURE = 4`

- M3では、CSV/Markdown出力は行わない。

  - CLIでは `CSV/Markdown output is skipped in M3.` と表示する。
  - dry-runでもCSV/Markdownは出力しない。

- M3では、1クエリ失敗しても処理を止めず、残りのクエリを継続実行する。

  - 一部失敗時も成功分の件数をCLIに表示する。
  - 一部失敗時も成功分の正規化・重複排除を行う。

- CLI側ではExit Codeを再判定せず、`runResearchUseCase.ts` から返された `result.exitCode` をそのまま返す。

- `deduplicationService.ts` は `src/services/` 配下を正とする。

  - `src/domain/deduplicationService.ts` は不要ファイルとして削除済み。

- 一部失敗・全失敗の確認には、一時フォルト注入を使用した。

  - `RMB_FORCE_FAILURE_QUERY_INDEX`
  - `RMB_FORCE_ALL_FAILURES`
  - 確認後、フォルト注入コードは削除する方針とした。
  - 最終確認で `RMB_FORCE` の残存なしを確認済み。

- 無効なAPIキーによる全失敗確認はM3完了の必須条件とはしない。

  - 理由：

    - M3で確認したい主目的は、UseCase側の成功/失敗集計、継続実行、Exit Code判定であるため。
    - フォルト注入により、一部失敗・全失敗のロジックは確認できたため。

- M3は完了と判定する。

  - 正常系、dry-run、一部失敗、全失敗、CSV/Markdown未出力、一時フォルト注入削除後の正常復帰まで確認済み。
  - `docs/implementation/research-memo-builder-m3-implementation-report.md` 保存済み。
  - 最終 `npm run check` 成功。
  - `findstr /S /N /I "RMB_FORCE" src\*.ts` 出力なし。

## 未解決事項

- M4：CSV出力は未実装。

  - CSVヘッダー定義は要確認。
  - `NormalizedSearchResult` からCSV行へのマッピングは未確定。
  - `extraSnippets` のCSV表現は未確定。
  - UTF-8 with BOM対応は未実装。
  - CSVエスケープは未実装。
  - 0件時のヘッダーのみCSV出力は未実装。
  - 既存ファイル上書き方針の実装は未対応。
  - 出力失敗時の Exit Code `5` は未実装。
  - `--out` 指定時の出力先反映はM4で要確認。
  - 一部失敗時に成功分のみCSV出力する方針は要確認。

- M5：Markdownメモ出力は未実装。

  - Markdownメモレンダラーは未実装。
  - Markdownエスケープは未実装。
  - 指定章構成の実装は未対応。
  - 検索条件サマリーの出力は未対応。
  - 類似タイトル一覧の出力は未対応。
  - スニペット出力は未対応。
  - P0注意書きの出力は未対応。
  - 0件時Markdown出力は未対応。
  - 一部失敗時の注意書き表示は未対応。
  - 全失敗時のMarkdown出力方針は要確認。

- M4/M5共通の出力制御は未実装。

  - `output.csv` が `true` の場合のみCSV出力する処理。
  - `output.markdownMemo` が `true` の場合のみMarkdown出力する処理。
  - P0対象外出力フラグが `true` の場合の入力エラー制御。
  - `generatedFiles` への出力ファイルパス格納。
  - 出力先ディレクトリ作成。
  - 出力ファイル上書き。
  - 出力エラー時の安全なエラーメッセージ表示。

- `src/domain/researchRunResult.ts` の最終的な使い方は要確認。

  - 会話内では型整理の候補として扱った。
  - 実装上、`RunResearchUseCaseResult` が `runResearchUseCase.ts` 内に残っているか、domain側へ切り出されているかは次チャットで実ファイル確認が必要。

- M2-B実装レポートのファイル名は要確認。

  - 会話前半では `research-memo-builder-m2-b-implementation-report.md` と `research-memo-builder-m2-b-implementation-record.md` の不一致を指摘した。
  - ユーザーにより更新済みと報告されたが、最終的にどちらのファイル名で管理しているかは次チャットで実ファイル確認が必要。
  - M3実装レポートの `source_documents` では `docs/implementation/research-memo-builder-m2-b-implementation-record.md` を参照している。

- 無効なAPIキーによる全失敗確認は未実施。

  - M3完了には不要と判断済み。
  - ただし、Brave APIの認証エラーが実際にCLIまでどのように表示されるかを確認したい場合は、将来的に追加確認してもよい。

- Brave Search APIの検索結果件数・重複件数は実行タイミングで変動する。

  - 初回正常系：`deduplicatedResultCount = 139`、`removedDuplicateCount = 11`
  - フォルト注入解除後：`deduplicatedResultCount = 138`、`removedDuplicateCount = 12`
  - 件数整合性が取れていれば問題なしと判断済み。

- M4以降で、M3の一時互換フィールドを削除するかは未確認。

  - `firstQuery`
  - `retrievedItemCount`
  - `executionResult`
  - CLIがM3表示へ完全移行済みなら削除候補。

## 次アクション

- P0：次チャットで最初に取り組むこと

  - M4：CSV出力仕様の確定から再開する。
  - まず以下のファイルを確認する。

    - `docs/requirements/research-memo-builder-p0-requirements.md`
    - `docs/design/research-memo-builder-p0-design.md`
    - `docs/implementation/research-memo-builder-m3-implementation-report.md`
    - `src/domain/normalizedSearchResult.ts`
    - `src/application/runResearchUseCase.ts`
    - `src/cli/research.ts`

- P1：CSV出力仕様の確認観点

  - CSVファイル名。
  - CSV出力先。
  - CSVヘッダー。
  - 各列と `NormalizedSearchResult` の対応。
  - `extraSnippets` をどのように1セルへ入れるか。
  - UTF-8 with BOMの有無。
  - 0件時にヘッダーのみ出力するか。
  - 既存ファイルがある場合に上書きするか。
  - 一部失敗時に成功分のみCSV出力するか。
  - 全失敗時にCSVを出すか、出さないか。
  - 出力エラー時に Exit Code `5` を返す条件。

- P2：M4で作成・修正する候補ファイル

  - 新規候補：

    - `src/services/csvEscape.ts`
    - `src/services/csvRenderer.ts`
    - `src/output/csvResearchResultWriter.ts`

  - 修正候補：

    - `src/application/runResearchUseCase.ts`
    - `src/cli/research.ts`
    - 必要に応じて `src/domain/researchRunResult.ts`
    - 必要に応じて `src/domain/outputOptions.ts`

- P3：M4実装の推奨順

  - `NormalizedSearchResult` からCSV行へのマッピングを決める。
  - CSVヘッダーを固定する。
  - `csvEscape.ts` を作成する。
  - `csvRenderer.ts` を作成する。
  - UTF-8 with BOM対応を実装する。
  - 出力先ディレクトリ作成処理を実装する。
  - CSVファイル書き込み処理を実装する。
  - `runResearchUseCase.ts` にCSV出力を接続する。
  - `src/cli/research.ts` に `generatedFiles` 表示を追加する。
  - 正常系・dry-run・0件・一部失敗・出力エラーを確認する。
  - M4実装レポートを作成する。

- P4：次チャット冒頭で確認するとよいコマンド

  - `npm run check`
  - `findstr /S /N /I "RMB_FORCE" src\*.ts`
  - `dir docs\implementation`
  - `dir src\domain`
  - `dir src\services`
  - 必要に応じて `git diff`

## 気づき

- M3は「単に検索回数を増やす」だけではなく、検索実行の状態管理が中心だった。

  - 成功/失敗集計。
  - 一部失敗時の継続。
  - 全失敗と0件成功の区別。
  - CLI表示。
  - Exit Code制御。

- 正規化層を挟むことで、M4/M5の出力処理が楽になる。

  - `snippet` と `extraSnippets` を必須に寄せたことで、CSV/Markdown側の分岐が減る。
  - URLなし/titleなしをM3で除外したことで、出力層が安全になる。

- `rank` は正規化後に再採番しない方針が有効。

  - `rank` は「検索結果内の順位」であり、「最終一覧の順位」ではない。
  - この意味づけを明確にしておくと、後続のCSV/Markdown表示で混乱しにくい。

- URL完全一致だけに絞ったことで、P0の実装範囲を守れた。

  - URL正規化、タイトル類似判定、本文類似判定まで入れるとP1以降の範囲になる。
  - M3では「まず機械的に安全な重複排除」に限定した判断がよかった。

- 一部失敗と全失敗の確認には、実APIの偶発的な失敗を待つより、一時フォルト注入が有効だった。

  - テストしたい対象はBrave APIそのものではなく、UseCase側の集計・継続・Exit Code判定だったため。
  - 確認後に `RMB_FORCE` が残っていないことを `findstr` で確認した点もよかった。

- API検索結果は実行タイミングで変動する。

  - 重複排除後件数が `139` から `138` に変動した。
  - 固定値一致ではなく、件数の不等式・整合式で見るべき。
  - `raw >= normalized >= deduplicated`
  - `normalized - deduplicated = removedDuplicateCount`

- 不要ファイルの混入に気づけた。

  - `src/domain/deduplicationService.ts` は不要で、`src/services/deduplicationService.ts` が正。
  - レイヤー責務の整理が実ファイル配置のチェックにも効いた。

- `npm run check` と `findstr` の組み合わせが、最終確認として有効だった。

  - 型・整形の確認。
  - 一時コード残存確認。
  - M3完了前の品質ゲートとして使いやすい。

- M3実装レポートは、単なる作業ログではなく、設計判断・確認結果・未対応事項をまとめる役割を持てた。

  - 後からM4へ進むときの設計メモになる。
  - note記事の素材にも転用しやすい。

## 記事にできそうな切り口

### 開発日記向き

- 「単一検索から15クエリ検索へ：個人開発で一気に現実味が出た日」

  - M2-Bの1クエリ検索から、M3で15クエリ逐次実行へ拡張した話。
  - 検索結果が150件取れるようになり、リサーチツールらしくなった実感。

- 「全部成功だけが正常じゃない：一部失敗をどう扱うか」

  - API連携では、1件失敗しても全体を止めない設計が必要だった話。
  - 成功分を活かすという考え方。

- 「家庭内ルール記事を書くために、検索システムを作っている話」

  - ATS記事の素材集めのために、Research Memo Builderを作っている背景。
  - 記事づくりの裏側を開発日記化できる。

- 「失敗をわざと起こして安心する：フォルト注入で確認したM3」

  - エラーを待つのではなく、意図的に失敗を作って確認した話。
  - 個人開発でも異常系確認は重要という切り口。

- 「検索結果の数は変わる。だから固定値ではなく整合性で見る」

  - Brave Search APIの結果が実行タイミングで変動した話。
  - `139件` と `138件` の違いを問題とせず、整合式で判断した話。

- 「不要ファイルを見つけて削除した小さな品質改善」

  - `src/domain/deduplicationService.ts` を削除した話。
  - レイヤー責務を意識すると、ファイル配置の違和感に気づける。

### 技術記事向き

- 「TypeScriptで検索結果を正規化するDTO設計」

  - `BraveSearchResultItem` から `NormalizedSearchResult` への変換。
  - nullable/optionalを出力層へ持ち込まない設計。
  - `snippet: ""`、`extraSnippets: []` の補完方針。

- 「UseCaseでAPI一部失敗を扱う設計」

  - 全成功、一部失敗、全失敗の状態分類。
  - Exit Code `0 / 1 / 4` の設計。
  - CLI側では再判定せず、UseCase結果をそのまま返す構成。

- 「URL完全一致重複排除の最小実装」

  - `Set<string>` によるURL重複排除。
  - 最初の結果を採用する方針。
  - P0では高度なURL正規化をやらない判断。

- 「NodeNext構成でのTypeScript ESM import設計」

  - `.js` 付き相対importの扱い。
  - M2-BからM3にかけての学びとして使える。

- 「CLIツールのExit Code設計」

  - `SUCCESS = 0`
  - `PARTIAL_API_FAILURE = 1`
  - `INPUT_ERROR = 2`
  - `CONFIG_ERROR = 3`
  - `ALL_API_FAILURE = 4`
  - `OUTPUT_ERROR = 5`
  - `UNEXPECTED_ERROR = 9`
  - API連携CLIにおける終了コード設計の例。

- 「フォルト注入で異常系を確認する個人開発テスト」

  - `RMB_FORCE_FAILURE_QUERY_INDEX`
  - `RMB_FORCE_ALL_FAILURES`
  - 確認後に `findstr` で残存チェック。
  - 本格テスト導入前の軽量な確認方法。

- 「CLI表示をUseCase結果に寄せる設計」

  - `runResearchUseCase.ts` が結果を集計。
  - `research.ts` は表示とExit Code反映に集中。
  - 責務分離の実例。

### 有料note / テンプレート化候補

- 「API連携CLIのExit Code設計テンプレート」

  - 成功。
  - 一部失敗。
  - 入力エラー。
  - 設定エラー。
  - 全API失敗。
  - 出力エラー。
  - 予期しないエラー。

- 「M3実装レポートテンプレート」

  - 実装対象。
  - 追加・修正ファイル。
  - 正常系確認。
  - dry-run確認。
  - 一部失敗確認。
  - 全失敗確認。
  - 出力未実施確認。
  - 一時コード削除確認。
  - 完了判定。
  - 次マイルストーン未対応事項。

- 「異常系確認チェックリスト」

  - 一部失敗時に継続するか。
  - 成功分の件数が表示されるか。
  - 全失敗時に正常0件と区別されるか。
  - Exit Codeが正しいか。
  - 一時フォルト注入が残っていないか。
  - ファイル出力が意図せず発生していないか。

- 「検索結果正規化DTOテンプレート」

  - 外部APIレスポンス。
  - 内部DTO。
  - 除外条件。
  - 補完条件。
  - rank方針。
  - retrievedAt方針。

- 「個人開発の品質ゲート手順書」

  - `npm run typecheck`
  - `npm run format`
  - `npm run check`
  - 正常系実行。
  - dry-run実行。
  - 異常系確認。
  - 一時コード残存確認。
  - 出力ファイル確認。

- 「リサーチ自動化ツールのMVP実装ロードマップ」

  - M1：入力YAML。
  - M2-A：dry-run。
  - M2-B：単一API検索。
  - M3：複数検索・正規化・重複排除。
  - M4：CSV出力。
  - M5：Markdownメモ出力。
  - P1：JSON / run-report / キャッシュ / 高度な重複判定。

- 「note記事リサーチ自動化の設計テンプレート」

  - 入力YAML。
  - 検索条件。
  - 検索実行。
  - 正規化。
  - 重複排除。
  - CSV。
  - Markdownメモ。
  - ChatGPTプロンプト。
