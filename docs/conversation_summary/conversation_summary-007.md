# 引き継ぎまとめ

## 実施内容

- 前チャットからの引き継ぎを受け、M4「CSV出力仕様の確定」から作業を再開した。

- M4開始時に、以下のファイルを確認対象として整理した。

  - `docs/requirements/research-memo-builder-p0-requirements.md`
  - `docs/design/research-memo-builder-p0-design.md`
  - `docs/implementation/research-memo-builder-m3-implementation-report.md`
  - `src/domain/normalizedSearchResult.ts`
  - `src/application/runResearchUseCase.ts`
  - `src/cli/research.ts`

- 最新ZIPを前提に、M4のCSV出力仕様を検討した。

  - CSVファイル名
  - CSV出力先
  - CSVヘッダー
  - `NormalizedSearchResult` からCSV列へのマッピング
  - `extraSnippets` のCSV表現
  - UTF-8 with BOM
  - CSVエスケープ
  - 0件時のヘッダーのみCSV
  - 既存ファイル上書き
  - 一部API失敗時の成功分CSV出力
  - 全API失敗時のヘッダーのみCSV出力
  - CSV出力失敗時の Exit Code `5`
  - `--out` 指定時の出力先反映
  - dry-run時のCSV未出力

- M4 Step 1〜3として、以下の新規ファイルのコード案を作成した。

  - `src/utils/csvEscape.ts`

    - CSVセル値をエスケープする `escapeCsvValue()` を提案。
    - `null` / `undefined` は空文字扱い。
    - カンマ、ダブルクォート、LF、CRを含む値はダブルクォートで囲む。
    - ダブルクォートは `""` に変換。

  - `src/renderers/csvRenderer.ts`

    - `NormalizedSearchResult[]` からCSV文字列を生成する `renderSearchResultsCsv()` を提案。
    - CSVヘッダーは固定列順。
    - `ExtraSnippets` は `/` 区切りで1セルに格納。
    - `extraSnippets` 内の改行は半角スペースに置換。
    - 0件時はヘッダー行のみ出力。

  - `src/output/csvResearchResultWriter.ts`

    - CSVファイルを書き込む `writeCsvResearchResults()` を提案。
    - 出力ファイル名は `search-results.csv`。
    - 出力先ディレクトリは `mkdir(..., { recursive: true })` で作成。
    - 先頭に `\uFEFF` を付与してUTF-8 with BOMにする。
    - 書き込み失敗時は `CsvResearchResultWriteError` を投げる。

- M4 Step 4として、`src/application/runResearchUseCase.ts` へのCSV出力接続案を作成した。

  - 重複排除後の `deduplicationResult.results` をCSV出力へ渡す。
  - `input.output.csv` が `true` の場合のみCSVを書き込む。
  - 書き込み成功時は `generatedFiles` にCSVパスを追加。
  - 書き込み失敗時は warningを追加し、Exit Codeを `ResearchExitCode.OUTPUT_ERROR`、つまり `5` にする。

- M4 Step 5として、`src/cli/research.ts` の表示更新案を作成した。

  - ヘルプ文言をM4向けに変更。
  - 正常終了時は `M4 search and CSV output completed.` と表示。
  - 一部API失敗時、全API失敗時、CSV出力失敗時の表示を整理。
  - `generatedFiles` の一覧表示を追加。
  - M4では `Markdown output is skipped in M4.` と表示。

- ユーザーにより、M4 Step 1〜5の実装後に以下が実行された。

  - `npm run typecheck`
  - `npm run format`
  - `npm run check`
  - 通常実行
  - `--out` 指定実行
  - dry-run

- M4正常系レビューを行った。

  - 通常実行結果：

    - `Generated query count: 15`
    - `Executed query count: 15`
    - `Succeeded query count: 15`
    - `Failed query count: 0`
    - `Raw item count: 150`
    - `Normalized item count: 150`
    - `Deduplicated item count: 138`
    - `Removed duplicate count: 12`
    - `Exit Code: 0`
    - `output\research\ats-rule-spec\search-results.csv` が生成

  - `--out` 指定実行結果：

    - `output\research\m4-csv-test\search-results.csv` が生成
    - `Exit Code: 0`

  - dry-run結果：

    - Brave Search API呼び出しなし
    - CSV出力なし
    - Markdown出力なし
    - `Exit Code: 0`

- 添付されたCSV出力内容を確認した。

  - ヘッダーは以下で期待どおり。

    ```csv
    Keyword,Platform,Title,Url,Snippet,ExtraSnippets,Rank,Query,RetrievedAt
    ```

  - CSVデータ行数と `Deduplicated item count` が一致していることを確認。

  - 列数は9列で崩れなし。

  - URL重複なし。

  - `Rank` は1〜10の範囲。

  - `ExtraSnippets` の空欄は取得不能ケースとして許容。

- BOM確認で、当初提案した以下のコマンドがPowerShell環境差により失敗した。

  ```powershell
  Format-Hex output\research\m4-csv-test\search-results.csv -Count 3
  ```

  - エラー内容：

    - `Format-Hex : パラメーター名 'Count' に一致するパラメーターが見つかりません。`

- PowerShell 5.1互換のBOM確認コマンドを提案した。

  ```powershell
  $bytes = Get-Content -Path "output\research\m4-csv-test\search-results.csv" -Encoding Byte -TotalCount 3
  ($bytes | ForEach-Object { $_.ToString("X2") }) -join " "
  ```

- ユーザーにより、BOM確認結果が共有された。

  - 出力：

    ```text
    EF BB BF
    ```

  - UTF-8 with BOM確認OKと判定した。

- M4準正常系・異常系確認を実施・レビューした。

  - アクション1：出力エラー Exit Code `5`

    - 実行コマンド：

      ```bat
      npm run research -- --input research/inputs/ats-rule-spec.yaml --out package.json
      echo %ERRORLEVEL%
      ```

    - 結果：

      - 検索処理は成功。
      - CSV出力のみ失敗。
      - `Generated files: None`
      - warningに `CSV output failed` が表示。
      - `Exit Code: 5`
      - OK判定。

  - アクション2：一部API失敗時のCSV出力

    - 一時フォルト注入として `RMB_FORCE_FAILURE_QUERY_INDEX=1` を使用。
    - 結果：

      - `Generated query count: 15`
      - `Executed query count: 15`
      - `Succeeded query count: 14`
      - `Failed query count: 1`
      - `Raw item count: 140`
      - `Normalized item count: 140`
      - `Deduplicated item count: 132`
      - `Removed duplicate count: 8`
      - CSV出力あり。
      - `Exit Code: 1`
      - OK判定。

  - アクション3：全API失敗時のCSV出力

    - 一時フォルト注入として `RMB_FORCE_ALL_FAILURES=1` を使用。
    - 結果：

      - `Generated query count: 15`
      - `Executed query count: 15`
      - `Succeeded query count: 0`
      - `Failed query count: 15`
      - `Raw item count: 0`
      - `Normalized item count: 0`
      - `Deduplicated item count: 0`
      - `Removed duplicate count: 0`
      - CSV出力あり。
      - `Exit Code: 4`
      - OK判定。

  - アクション4：0件CSV確認

    - `output\research\m4-all-failure\search-results.csv` を確認。

    - 内容はヘッダーのみ。

      ```csv
      Keyword,Platform,Title,Url,Snippet,ExtraSnippets,Rank,Query,RetrievedAt
      ```

    - OK判定。

- 追加で、CSV行数確認が行われた。

  - 一部API失敗時：

    ```powershell
    $rows = Import-Csv "output\research\m4-partial-failure\search-results.csv"
    $rows.Count
    ```

    - 結果：`132`
    - `Deduplicated item count: 132` と一致。

  - 全API失敗時：

    ```powershell
    $rows = Import-Csv "output\research\m4-all-failure\search-results.csv"
    $rows.Count
    ```

    - 結果：`0`
    - ヘッダーのみCSVとして期待どおり。

- 一時フォルト注入コード削除後の最終確認が行われた。

  - `npm run check` 成功。
  - `findstr /S /N /I "RMB_FORCE" src\*.ts` は出力なし。
  - 一時フォルト注入コードの残存なしと判定。

- フォルト注入削除後の正常復帰確認が行われた。

  - 実行コマンド：

    ```bat
    npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/m4-final-check
    echo %ERRORLEVEL%
    ```

  - 結果：

    - `Generated query count: 15`
    - `Executed query count: 15`
    - `Succeeded query count: 15`
    - `Failed query count: 0`
    - `Raw item count: 150`
    - `Normalized item count: 150`
    - `Deduplicated item count: 140`
    - `Removed duplicate count: 10`
    - CSV出力あり。
    - `Exit Code: 0`
    - OK判定。

- 添付された `output/research/m4-final-check/search-results.csv` を確認した。

  - BOM：`EF BB BF`

  - 総行数：141

  - データ行数：140

  - 列数：9

  - ヘッダー：

    ```csv
    Keyword,Platform,Title,Url,Snippet,ExtraSnippets,Rank,Query,RetrievedAt
    ```

  - CLI表示の `Deduplicated item count: 140` とCSVデータ行数140が一致。

  - OK判定。

- M4実装レポートを作成した。

  - 保存先：

    - `docs/implementation/research-memo-builder-m4-implementation-report.md`

  - 主な記載内容：

    - M4概要
    - 実装対象
    - 追加・修正ファイル
    - CSV出力仕様
    - CSV列マッピング
    - `ExtraSnippets` の扱い
    - CSVエスケープ
    - Exit Code方針
    - 正常系確認
    - `--out` 指定確認
    - dry-run確認
    - BOM確認
    - 出力エラー Exit Code `5`
    - 一部API失敗時のCSV出力
    - 全API失敗時のCSV出力
    - 0件CSV確認
    - 一時フォルト注入コード削除確認
    - フォルト注入削除後の正常復帰確認
    - M4完了判定
    - 未対応事項
    - M5への次アクション

- ユーザーにより、M4実装レポートが保存された。

  - 添付ファイル：

    - `research-memo-builder-m4-implementation-report.md`

- 保存後のM4実装レポートを最終レビューした。

  - 内容面はM4完了レポートとしてOKと判定。
  - ただし、frontmatterの `source_documents` が `*` 箇条書きになっており、YAMLとして不正と指摘した。
  - 修正案として、`source_documents` を `-` のYAML配列形式に直すよう提案した。
  - frontmatter修正後は、Active版として採用可と判定した。

## 決定事項

- M4の対象はCSV出力実装とする。

  - M3で実装済みの検索実行・検索結果正規化・URL完全一致重複排除の結果をCSV化する。
  - Markdown出力はM4対象外とし、M5で扱う。

- CSVファイル名は `search-results.csv` とする。

- CSV出力先は `resolvedInput.output.dir` とする。

- CLIで `--out` が指定された場合は、`output.dir` より `--out` の指定先を優先する。

- CSVはUTF-8 with BOMで出力する。

  - BOMは先頭3バイト `EF BB BF` として確認する。
  - PowerShell環境差を避ける場合は、`Get-Content -Encoding Byte -TotalCount 3` を使う。

- CSVヘッダーは以下の固定列順とする。

  ```csv
  Keyword,Platform,Title,Url,Snippet,ExtraSnippets,Rank,Query,RetrievedAt
  ```

- `NormalizedSearchResult` からCSV列へのマッピングは以下とする。

  - `Keyword` ← `keyword`
  - `Platform` ← `platform`
  - `Title` ← `title`
  - `Url` ← `url`
  - `Snippet` ← `snippet`
  - `ExtraSnippets` ← `extraSnippets`
  - `Rank` ← `rank`
  - `Query` ← `query`
  - `RetrievedAt` ← `retrievedAt`

- `extraSnippets` は `/` 区切りで1セルに格納する。

- `extraSnippets` 内の改行は半角スペースに置換する。

- CSVセル値にカンマ、ダブルクォート、LF、CRが含まれる場合は、値全体をダブルクォートで囲む。

- CSVセル値内のダブルクォートは `""` にエスケープする。

- 既存CSVファイルは確認なしで上書きする。

- 出力ディレクトリが存在しない場合は作成する。

- 0件時はヘッダーのみCSVを出力する。

- 一部API失敗時は成功分のみCSV出力し、Exit Codeは `1` とする。

- 全API失敗時はヘッダーのみCSV出力し、Exit Codeは `4` とする。

- CSV出力失敗時は、検索処理の結果にかかわらず最終Exit Codeを `5` とする。

- dry-run時はCSVを出力しない。

- `generatedFiles` には、CSV出力成功時に出力ファイルパスを格納する。

- M4の実装確認では、一部API失敗・全API失敗の再現に一時フォルト注入を使用した。

  - `RMB_FORCE_FAILURE_QUERY_INDEX`
  - `RMB_FORCE_ALL_FAILURES`

- 一時フォルト注入コードは確認後に削除する。

- M4は、frontmatter修正後に完了・Active版として扱ってよい。

## 未解決事項

- `docs/implementation/research-memo-builder-m4-implementation-report.md` のfrontmatter修正が未確認。

  - 現状の添付では `source_documents` が `*` 箇条書きになっており、YAMLとして不正。
  - `-` のYAML配列形式へ修正が必要。
  - 修正後の `npm run check` 結果は未確認。

- M5：Markdownメモ出力は未実装。

  - Markdownメモレンダラー未実装。
  - Markdownファイル書き込み処理未実装。
  - Markdown章構成の実装未対応。
  - 検索条件サマリー出力未対応。
  - 類似タイトル一覧出力未対応。
  - スニペット出力未対応。
  - P0注意書き出力未対応。
  - 一部失敗時のMarkdown注意書き未対応。
  - 全失敗時のMarkdown出力方針は要確認。

- P0対象外出力フラグの制御は、M4時点では未実装または未確認。

  - `output.notion`
  - `output.googleDocs`
  - `output.pdf`

- テスト自動化は未対応。

  - M4では手動確認で検証した。
  - `csvEscape.ts`
  - `csvRenderer.ts`
  - `csvResearchResultWriter.ts`
  - Exit Code分岐
  - `--out` 反映
  - dry-run制御
  - これらは将来的にユニットテスト化候補。

- M4確認で使用したCSV検索結果件数は、Brave Search APIの結果に依存するため実行タイミングで変動する。

  - 正常系1回目：`Deduplicated item count: 138`
  - 出力エラー確認時：`Deduplicated item count: 139`
  - 最終確認：`Deduplicated item count: 140`
  - 件数整合性が取れていれば問題なしと判断済み。

- M3から残っている可能性のある一時互換フィールドの最終扱いは未確認。

  - `firstQuery`
  - `retrievedItemCount`
  - `executionResult`
  - M4実装に影響は出ていないが、将来的な整理候補。

## 次アクション

- P0：まずM4実装レポートのfrontmatterを修正する。

  - 対象ファイル：

    - `docs/implementation/research-memo-builder-m4-implementation-report.md`

  - 修正対象：

    ```yaml
    source_documents:

    * docs/requirements/research-memo-builder-p0-requirements.md
    * docs/design/research-memo-builder-p0-design.md
    ```

  - 修正後の形式：

    ```yaml
    source_documents:
      - docs/requirements/research-memo-builder-p0-requirements.md
      - docs/design/research-memo-builder-p0-design.md
      - docs/implementation/research-memo-builder-m3-implementation-report.md
      - src/domain/normalizedSearchResult.ts
      - src/domain/researchExitCode.ts
      - src/domain/researchRunResult.ts
      - src/application/runResearchUseCase.ts
      - src/cli/research.ts
      - src/utils/csvEscape.ts
      - src/renderers/csvRenderer.ts
      - src/output/csvResearchResultWriter.ts
    ```

- P1：frontmatter修正後、最終チェックを実行する。

  ```bat
  npm run check
  ```

- P2：M4を正式完了扱いにする。

  - `npm run check` 成功
  - M4実装レポートのfrontmatter修正済み
  - 以上を確認できれば、M4は正式完了。

- P3：次チャットでM5に進む。

  - 最初に確認するファイル候補：

    - `docs/requirements/research-memo-builder-p0-requirements.md`
    - `docs/design/research-memo-builder-p0-design.md`
    - `docs/implementation/research-memo-builder-m4-implementation-report.md`
    - `src/domain/normalizedSearchResult.ts`
    - `src/domain/researchRunResult.ts`
    - `src/application/runResearchUseCase.ts`
    - `src/cli/research.ts`
    - `src/renderers/csvRenderer.ts`
    - `src/output/csvResearchResultWriter.ts`

  - M5で最初に検討する論点：

    - Markdownファイル名
    - Markdown出力先
    - Markdown章構成
    - 検索条件サマリーの形式
    - 類似タイトル一覧の形式
    - スニペット表示形式
    - 一部API失敗時の注意書き
    - 全API失敗時にMarkdownを出すか
    - 0件時Markdownの内容
    - `generatedFiles` へのMarkdownパス追加
    - CLI表示更新

## 気づき

- CSV出力は「検索処理の成功/失敗」と「ファイル出力の成功/失敗」を分けて考える必要がある。

  - API一部失敗でもCSV出力は成功しうる。
  - API全失敗でもヘッダーのみCSV出力は成功しうる。
  - 検索が成功してもCSV出力に失敗すればExit Codeは `5` になる。

- Exit Codeの優先順位を決めておくと、CLIツールの挙動が明確になる。

  - 今回はCSV出力失敗を最優先の `5` とした。
  - 「検索結果は取れているが成果物を書けない」状態は、利用者にとって失敗として扱うべきと判断できた。

- PowerShellコマンドは環境差がある。

  - `Format-Hex -Count` は環境によって使えない。
  - PowerShell 5.1互換の `Get-Content -Encoding Byte -TotalCount 3` の方が安定した。
  - 手順書では環境互換性の高い確認コマンドを優先した方がよい。

- CSVの正しさは「ファイルができた」だけでは不十分。

  - BOM確認
  - ヘッダー確認
  - 列数確認
  - データ行数確認
  - CLI表示件数との一致確認
  - 一部失敗・全失敗時の出力確認
  - ここまで見て初めて、出力機能として信頼できる。

- 0件CSVの扱いは、ヘッダーのみ出力にしておくと後続処理や確認が安定する。

  - ファイルがない状態より、ヘッダーのみCSVの方が形式検証しやすい。
  - Markdown出力や後続処理でも「結果0件」を明示しやすい。

- 一時フォルト注入は、API依存の準正常系・異常系確認に有効。

  - 外部APIの失敗を待たずに、部分失敗・全失敗を安定再現できる。
  - ただし、本番コードに残さないための `findstr` 確認が必須。

- 実装レポートのfrontmatterは、ドキュメントとしての見た目だけでなく、機械処理可能性も考慮する必要がある。

  - `*` 箇条書きはMarkdownとして見えても、YAML frontmatterとしては不正。
  - Mnemosyneや将来のメタデータ抽出に使うなら、YAMLとして正しい形式が重要。

- 検索結果件数はAPIの実行タイミングで変動する。

  - 重要なのは固定件数ではなく、件数間の整合性。
  - `Raw >= Normalized >= Deduplicated`
  - `Removed duplicate count = Normalized - Deduplicated`
  - `CSVデータ行数 = Deduplicated item count`
  - この関係が成立していればよい。

## 記事にできそうな切り口

### 開発日記向き

- 「CSVを出すだけ」のつもりが、考えることが多かった話

  - BOM
  - Excel文字化け
  - 0件時
  - 一部失敗時
  - 全失敗時
  - 出力失敗時
  - dry-run
  - ただのCSV出力でも、運用を考えると仕様が増える。

- 個人開発でExit Codeを真面目に設計した話

  - 成功 `0`
  - 一部失敗 `1`
  - 入力不正 `2`
  - APIキー不備 `3`
  - 全API失敗 `4`
  - 出力失敗 `5`
  - CLIツールとしての使いやすさにつながる。

- 「APIは成功したのに失敗」になるケースを考えた話

  - 検索成功
  - CSV書き込み失敗
  - 成果物が作れなければ利用者にとっては失敗
  - Exit Code `5` の意味。

- Windows環境でBOM確認に詰まった話

  - `Format-Hex -Count` が使えない。
  - PowerShell環境差に気づく。
  - 互換コマンドに切り替える。
  - 実装だけでなく確認手順も環境依存する。

- 一時フォルト注入で異常系を確認した話

  - 外部APIの失敗を待たない。
  - 失敗を意図的に作る。
  - 確認後は必ず削除。
  - `findstr` で残存確認。

- 「完了」と言える条件を増やしていった話

  - 実装完了
  - typecheck完了
  - CSV出力完了
  - BOM確認完了
  - 部分失敗確認完了
  - 全失敗確認完了
  - 出力エラー確認完了
  - レポート化完了
  - 完了条件を具体化する価値。

### 技術記事向き

- TypeScript CLIでCSV出力を設計する手順

  - DTO設計
  - Renderer
  - Writer
  - UseCase接続
  - CLI表示
  - Exit Code制御

- `NormalizedSearchResult[]` からCSVを生成する設計

  - ドメイン型
  - CSV行DTO
  - ヘッダー固定
  - 列マッピング
  - `extraSnippets` の1セル化
  - rankを再採番しない判断。

- CSVエスケープの最小実装

  - カンマ
  - ダブルクォート
  - LF
  - CR
  - `null` / `undefined`
  - 日本語対応
  - Excelで開く前提のBOM付与。

- CLIツールにおけるExit Code設計

  - 正常系
  - 部分失敗
  - 全失敗
  - 入力不正
  - APIキー不備
  - 出力失敗
  - Exit Code優先順位。

- UseCaseで出力処理を接続する設計

  - 検索実行
  - 正規化
  - 重複排除
  - CSV出力
  - `generatedFiles`
  - warning
  - Exit Code更新。

- CSV出力のテスト観点チェックリスト

  - ファイル生成
  - BOM
  - ヘッダー
  - 列数
  - 行数
  - `--out`
  - dry-run
  - 一部失敗
  - 全失敗
  - 出力失敗。

- 外部API依存処理の異常系確認

  - 一時フォルト注入
  - 部分失敗
  - 全失敗
  - 確認後の削除
  - 残存チェック。

- Markdown frontmatterの罠

  - Markdownとして見える箇条書きとYAMLとして正しい配列は違う。
  - `*` ではなく `-` を使う。
  - ドキュメントを将来機械処理するならfrontmatterの妥当性が重要。

### 有料note / テンプレート化候補

- CLI出力機能の完了チェックリスト

  - 出力ファイル名
  - 出力先
  - 上書き方針
  - 文字コード
  - BOM
  - 改行コード
  - 0件時
  - 部分失敗時
  - 全失敗時
  - 出力失敗時
  - dry-run
  - `generatedFiles`
  - Exit Code。

- CSV出力仕様テンプレート

  - ファイル仕様
  - ヘッダー
  - 列マッピング
  - エスケープ規則
  - 文字コード
  - 失敗時動作
  - 確認コマンド。

- Exit Code設計テンプレート

  - 状態
  - Exit Code
  - CLI表示
  - 成果物出力有無
  - recovery可否
  - 後続処理への影響。

- 実装レポートテンプレート

  - 概要
  - 実装対象
  - 追加・修正ファイル
  - 仕様
  - 確認結果
  - 決定事項
  - 完了判定
  - 未対応事項
  - 次アクション。

- 異常系確認手順テンプレート

  - 出力エラー
  - 一部API失敗
  - 全API失敗
  - 0件
  - 環境変数による一時フォルト注入
  - 削除確認
  - 正常復帰確認。

- Windows向け確認コマンド集

  - `echo %ERRORLEVEL%`
  - `Import-Csv`
  - `$rows.Count`
  - `Get-Content -Encoding Byte -TotalCount`
  - `findstr /S /N /I`
  - `dir`

- AIと進める個人開発レビュー用プロンプト集

  - 仕様確定依頼
  - コード案作成依頼
  - 実行結果レビュー依頼
  - 異常系確認手順作成依頼
  - 実装レポート作成依頼
  - 最終レビュー依頼
  - 次チャット引き継ぎ依頼。
