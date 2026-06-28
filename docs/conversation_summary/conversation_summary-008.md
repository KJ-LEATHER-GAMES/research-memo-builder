# 引き継ぎまとめ

## 実施内容

- `research_memo_builder` の **M5：Markdown research memo output** について、実装後レビューと完了判定を行った。

- M5の対象は、Brave Search APIの検索結果をもとに、CSV出力に加えて `research-memo.md` を生成する機能。

- 主に以下の機能・ファイルについて確認した。

  - `src/utils/markdownEscape.ts`

    - Markdownインライン文字列のエスケープ処理。
    - `-` の過剰エスケープを解消。

  - `src/renderers/markdownResearchMemoRenderer.ts`

    - `research-memo.md` の本文生成処理。
    - 章構成、検索結果グルーピング、0件時メッセージ、P0注意書きを出力。

  - `src/output/markdownResearchMemoWriter.ts`

    - `research-memo.md` の書き込み処理。
    - UTF-8 without BOM、LF、上書き出力。

  - `src/application/runResearchUseCase.ts`

    - CSV出力とMarkdown出力を接続。
    - 出力失敗時のwarning追加とExit Code `5` への制御。

  - `src/cli/research.ts`

    - M5向けにCLI表示を更新。
    - CSV / Markdownそれぞれの生成状態を表示。

  - `docs/implementation/research-memo-builder-m5-implementation-report.md`

    - M5完了の実装レポート案を作成。
    - ユーザーが保存予定。

- 正常系レビューを実施した。

  - 実行コマンド：

    - `npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/m5-final-check-2`

  - 結果：

    - Generated query count: `15`
    - Executed query count: `15`
    - Succeeded query count: `15`
    - Failed query count: `0`
    - Raw item count: `150`
    - Normalized item count: `150`
    - Deduplicated item count: `139`
    - Removed duplicate count: `11`
    - CSV output: `generated`
    - Markdown memo output: `generated`
    - Exit Code: `0`

  - 生成ファイル：

    - `output\research\m5-final-check-2\search-results.csv`
    - `output\research\m5-final-check-2\research-memo.md`

  - 件数整合：

    - CSV行数: `139`
    - Markdownリンク行数: `139`

  - 文字コード・改行：

    - BOM確認: `23 20 E6`
    - CRLF混入確認: `False`

  - Markdown整形：

    - `-` の過剰エスケープ解消を確認。
    - `## 2. 似たタイトルがあるか` 直後の空行過多解消を確認。
    - P0注意書き出力を確認。

- 準正常系レビューを実施した。

  - 一部API失敗ケース：

    - 一時的な障害注入でQiita向け5クエリを失敗させた。
    - Generated query count: `15`
    - Succeeded query count: `10`
    - Failed query count: `5`
    - Raw item count: `100`
    - Normalized item count: `100`
    - Deduplicated item count: `92`
    - Removed duplicate count: `8`
    - CSV output: `generated`
    - Markdown memo output: `generated`
    - Exit Code: `1`
    - CSV行数: `92`
    - Markdownリンク行数: `92`
    - Markdown内の `Exit Code: 1`、`Succeeded Query Count: 10`、`Failed Query Count: 5` を確認。

  - 全API失敗ケース：

    - 一時的な障害注入で15クエリすべてを失敗させた。
    - Generated query count: `15`
    - Succeeded query count: `0`
    - Failed query count: `15`
    - Raw item count: `0`
    - Normalized item count: `0`
    - Deduplicated item count: `0`
    - Removed duplicate count: `0`
    - CSV output: `generated`
    - Markdown memo output: `generated`
    - Exit Code: `4`
    - CSV行数: `0`
    - Markdownリンク行数: `0`
    - Markdown内の全失敗メッセージを確認。

      - `すべての検索クエリが失敗したため、検索結果候補は生成されませんでした。`

    - Markdown内の `Exit Code: 4`、`Succeeded Query Count: 0`、`Failed Query Count: 15` を確認。

  - 一部失敗・全失敗ともに、MarkdownのBOMなし・LFを確認。
  - 障害注入コード削除後に以下を確認。

    - `npm run check` 成功。
    - `findstr /S /N /I "RMB_FORCE" src\*.ts` 出力なし。

- 出力失敗系レビューを実施した。

  - CSV出力失敗ケース：

    - `RMB_FORCE_CSV_OUTPUT_FAILURE=true` による一時的な障害注入で確認。
    - Search execution自体は成功。
    - Deduplicated item count: `139`
    - CSV output: `not generated`
    - Markdown memo output: `generated`
    - Generated files:

      - `output\research\m5-csv-output-failure-check\research-memo.md`

    - Warning:

      - `CSV output failed: Forced CSV output failure`

    - Exit Code: `5`
    - Markdownリンク行数: `139`
    - Markdown内の `Exit Code: 5` とwarningを確認。
    - MarkdownのBOMなし・LFを確認。

  - Markdown出力失敗ケース：

    - `RMB_FORCE_MARKDOWN_OUTPUT_FAILURE=true` による一時的な障害注入で確認。
    - Search execution自体は成功。
    - Deduplicated item count: `139`
    - CSV output: `generated`
    - Markdown memo output: `not generated`
    - Generated files:

      - `output\research\m5-markdown-output-failure-check\search-results.csv`

    - Warning:

      - `Markdown output failed: Forced Markdown output failure`

    - Exit Code: `5`
    - CSV行数: `139`

  - CSV / Markdown両方失敗ケース：

    - CSV writerとMarkdown writerの両方に一時的な障害注入を行って確認。
    - Search execution自体は成功。
    - CSV output: `not generated`
    - Markdown memo output: `not generated`
    - Generated files: `None`
    - Warnings:

      - `CSV output failed: Forced CSV output failure`
      - `Markdown output failed: Forced Markdown output failure`

    - Exit Code: `5`

  - 障害注入コード削除後に以下を確認。

    - `npm run check` 成功。
    - `findstr /S /N /I "RMB_FORCE" src\*.ts` 出力なし。

- M5完了レポートのドラフトを作成した。

  - 保存予定ファイル：

    - `docs/implementation/research-memo-builder-m5-implementation-report.md`

  - 章立て：

    - `1. 概要`
    - `2. 実装内容`
    - `3. Markdown出力仕様`
    - `4. CLI表示更新`
    - `5. 確認結果`
    - `6. 正常系確認`
    - `7. 準正常系確認`
    - `8. 出力失敗系確認`
    - `9. 残課題`
    - `10. M5完了判定`

## 決定事項

- M5は完了と判定する。
- `research-memo.md` は最終記事ではなく、**既存記事リサーチ用のP0メモ**として扱う。
- M5のMarkdown出力では、以下のみを利用する。

  - Brave Search APIから得られるタイトル
  - URL
  - snippet
  - extraSnippets
  - rank
  - query
  - 入力YAML由来のtopic、articleType、keywords、platforms、search条件

- M5では以下を実施しない。

  - 検索結果URLへのHTTPアクセス
  - 記事本文の取得
  - 有料部分の取得
  - 価格の正確な取得
  - AIによる本文要約
  - 競合記事の内容評価
  - note記事本文の自動生成

- `research-memo.md` のファイル仕様は以下で確定。

  - ファイル名：`research-memo.md`
  - 出力先：`resolvedInput.output.dir`
  - CLIの `--out` 指定時は `--out` を優先
  - UTF-8 without BOM
  - LF
  - 既存ファイルは上書き
  - dry-run時は出力しない

- Markdown章構成は以下で確定。

  - `# 既存記事リサーチメモ`
  - `## 対象記事候補`
  - `## 検索条件`
  - `## 1. 検索したキーワード`
  - `## 2. 似たタイトルがあるか`
  - `## 3. どんな切り口が多いか`
  - `## 4. 無料部分で何を約束しているか`
  - `## 5. 価格帯はいくらか`
  - `## 6. 自分ならどこで差別化できるか`
  - `## 7. 記事化判断`
  - `## 8. 次に作るなら`
  - `## P0生成メモ`

- 検索結果の表示単位は以下で確定。

  - `### {Platform} / {Keyword}`
  - `1. [{Title}]({Url})`
  - `Rank`
  - `Snippet`
  - `ExtraSnippets`

- 検索結果の並び順は以下で確定。

  - 入力で指定されたplatform順
  - 入力で指定されたkeyword順
  - rank昇順

- M5のExit Code挙動は以下で確認済み。

  - 正常系：`0`
  - 一部API失敗：`1`
  - 全API失敗：`4`
  - 出力失敗：`5`

- 出力失敗時は、一方の出力が失敗しても、もう一方は可能な限り生成する方針で確定。
- CSV出力失敗時はMarkdownのみ生成し、Exit Code `5` とする。
- Markdown出力失敗時はCSVのみ生成し、Exit Code `5` とする。
- CSV / Markdown両方失敗時は生成ファイルなし、Exit Code `5` とする。
- 一時的な障害注入コードは実装に残さない。
- 最終確認として `findstr /S /N /I "RMB_FORCE" src\*.ts` で出力なしを確認する方針とした。
- M5完了レポートは `docs/implementation/research-memo-builder-m5-implementation-report.md` に保存する方針とした。

## 未解決事項

- `docs/implementation/research-memo-builder-m5-implementation-report.md` が実ファイルとして保存されたかは、この会話内では未確認。
- M5完了レポート保存後の `npm run check` 実行結果は未確認。
- M5完了レポートの最終レビューは未実施。
- Gitコミットは未実施。
- M5完了後に次のマイルストーンを何にするかは未決定。
- P0全体の完了判定は未確認。
- 今後の改善候補として以下は未実装。

  - Jest等による自動テスト化
  - Markdownレンダラー単体テスト
  - writer単体テスト
  - CLI表示テスト
  - 出力失敗系の自動テスト
  - run report出力
  - P1での競合分析支援
  - 既存記事の切り口分類の半自動化
  - Markdownメモから記事構成案を作る機能

- `docs/design/research-memo-builder-p0-design.md` の細部に、以前「`src/src/output/` のようなディレクトリ表記ゆれがある可能性」が指摘されていたが、この会話では修正確認していない。
- `research-memo.md` の本文中にBrave Search API由来のスニペットが長くなるケースがあるが、P0では許容とした。将来的に短縮や表示制御を入れるかは未決定。
- PowerShellの `Select-String` 表示では、日本語が折り返されて見えるケースがあるが、ファイル自体の改行崩れではないと判断。表示上の問題として扱った。

## 次アクション

- 優先度A：M5完了レポートを保存する。

  - 保存先：

    - `docs/implementation/research-memo-builder-m5-implementation-report.md`

  - この会話で作成したドラフトをそのまま保存する。

- 優先度A：保存後チェックを実行する。

  - 実行コマンド：

    - `npm run check`

  - 期待値：

    - `tsc --noEmit` 成功
    - `prettier --check` 成功
    - `All matched files use Prettier code style!`

- 優先度A：障害注入コードの残骸がないことを念のため再確認する。

  - 実行コマンド：

    - `findstr /S /N /I "RMB_FORCE" src\*.ts`

  - 期待値：

    - 出力なし

- 優先度B：M5完了レポートの最終レビューを行う。

  - 見るファイル：

    - `docs/implementation/research-memo-builder-m5-implementation-report.md`

  - 観点：

    - 事実ベースで書かれているか
    - 正常系、準正常系、出力失敗系の確認結果が漏れていないか
    - Exit Code `0 / 1 / 4 / 5` の説明が正しいか
    - M5範囲外の記述が明確か
    - 次フェーズ課題が過剰に膨らんでいないか

- 優先度B：必要であればGitコミットする。

  - コミット候補：

    - `feat: add markdown research memo output`
    - `docs: add M5 implementation report`

  - 実際のコミット方針は未確認。

- 優先度C：次マイルストーンを決める。

  - 候補：

    - P0全体完了レビュー
    - 自動テスト整備
    - run report出力
    - Markdownメモから記事構成案を作るP1検討
    - note記事化のための素材整理

## 気づき

- CSV出力とMarkdown出力を独立させたことで、一方が失敗してももう一方を生成できる構成になった。
- 出力失敗をExit Code `5` に集約したことで、API失敗とファイル出力失敗を明確に分離できた。
- 正常系だけでなく、一部API失敗、全API失敗、CSV失敗、Markdown失敗、両方失敗まで確認したことで、CLIツールとしての信頼性が上がった。
- `generatedFiles` を実際に生成成功したファイルだけにすることで、CLI表示と実ファイル状態の整合性を保てた。
- Markdown出力は「記事生成」ではなく「人間レビュー用メモ」に限定したことで、P0のスコープが膨らみすぎるのを防げた。
- P0注意書きをMarkdown内に明示することで、検索結果スニペットだけを根拠にした出力であることを利用者が誤解しにくくなった。
- `-` のエスケープ過多は、Markdownとして壊れていなくても、人間が読むメモとしては読みづらくなることが分かった。
- 空行過多も機能不具合ではないが、成果物品質としては修正価値があると分かった。
- PowerShellの `Select-String` 表示では、長い日本語行が折り返され、見かけ上改行されているように見える。ファイル内容確認では、`Get-Content -Encoding utf8` やBOM / LF確認と組み合わせる必要がある。
- 一時的な障害注入は、API障害やファイル権限エラーを待たずに異常系を確認できるため有効だった。
- ただし障害注入コードは必ず削除し、`findstr RMB_FORCE` で残骸確認する運用が必要。
- 実装レポートは、後からnote記事化するときの素材として非常に有効。実装内容だけでなく、確認観点、Exit Code、失敗系の判断理由まで残すと再利用しやすい。
- 「AIでリサーチメモを作る」前に、「AIが生成したメモの限界を明示する」設計が重要だと分かった。
- 個人開発でも、正常系だけで完了にせず、準正常系・出力失敗系まで確認することで、道具として安心して使える状態に近づく。

## 記事にできそうな切り口

### 開発日記向き

- 「CSVが出たら終わり」ではなく、記事化前のMarkdownメモまで作った話。
- 個人開発で、AIとの会話からリサーチ支援CLIを育てていく過程。
- `research-memo.md` を“完成記事”ではなく“人間レビュー用メモ”にした判断。
- 正常系だけで終わらせず、一部失敗・全失敗・出力失敗まで確認した話。
- 「検索結果は取れているのに、ファイル出力だけ失敗する」ケースまで考えた話。
- `-` のエスケープ過多や空行過多など、機能としては動くが成果物として気になる部分を直した話。
- PowerShellで文字化け・折り返しに悩みながら、UTF-8 without BOMとLFを確認した話。
- 障害注入コードを入れて、わざと壊してから直す確認をした話。
- AIに実装だけでなく、確認手順、レビュー観点、実装レポートまで伴走させた話。
- 「note記事を書くためのリサーチメモを作るツール」自体がnote記事の素材になっている話。

### 技術記事向き

- TypeScript CLIでCSV / Markdownの複数出力を設計する方法。
- `generatedFiles` と `warnings` による出力結果管理。
- Exit Code設計：

  - `0`: success
  - `1`: partial API failure
  - `4`: all API failure
  - `5`: output error

- CSV出力とMarkdown出力を独立させるUseCase設計。
- Renderer / Writer分離の設計。

  - `markdownResearchMemoRenderer.ts`
  - `markdownResearchMemoWriter.ts`

- Markdownエスケープ処理の設計。

  - どこまでエスケープするか
  - 過剰エスケープの副作用

- Markdown出力の0件時メッセージ設計。

  - 正常0件
  - 一部成功だが候補0件
  - 全API失敗

- CLI表示設計。

  - 実行結果
  - 出力ファイル
  - warning
  - failed API requests

- 異常系確認のための一時的な障害注入パターン。
- `findstr RMB_FORCE` による障害注入コード残骸チェック。
- UTF-8 without BOM / LF の確認手順。
- PowerShell / コマンドプロンプトでのCLI確認手順。
- CSV行数とMarkdownリンク行数の整合確認方法。
- Brave Search API結果を直接HTTPアクセスせずにP0メモへ変換する設計。
- P0スコープ制御としての「取得しないこと」の設計。
- UseCase内で複数出力の失敗をどう扱うか。
- 出力失敗時も成功したファイルだけを `generatedFiles` に含める設計。

### 有料note / テンプレート化候補

- CLI実装完了チェックリスト。

  - 静的チェック
  - 正常系
  - 一部失敗
  - 全失敗
  - 出力失敗
  - 文字コード
  - 障害注入コード削除

- Markdown出力仕様テンプレート。

  - 目的
  - 入力
  - 出力
  - 章構成
  - 0件時
  - 注意書き
  - エンコーディング
  - エラー時挙動

- Exit Code設計テンプレート。

  - 正常
  - 入力エラー
  - 設定エラー
  - 一部外部API失敗
  - 全外部API失敗
  - 出力失敗
  - 予期せぬ例外

- 実装レポートテンプレート。

  - 概要
  - 実装内容
  - 仕様
  - CLI更新
  - 確認結果
  - 正常系確認
  - 準正常系確認
  - 出力失敗系確認
  - 残課題
  - 完了判定

- 異常系レビュー手順書。

  - API一部失敗
  - API全失敗
  - CSV出力失敗
  - Markdown出力失敗
  - 両方失敗

- AIにレビューしてもらうための確認結果貼り付けテンプレート。
- `research-memo.md` のP0注意書きテンプレート。
- 「AI生成物を過信しないための免責・注意書き」テンプレート。
- 「人間レビュー用メモ」と「完成記事」を分ける判断基準。
- note記事リサーチ自動化CLIの設計テンプレート。
- 個人開発のMVP完了判定テンプレート。
- 障害注入コードを使った手動テスト手順テンプレート。
