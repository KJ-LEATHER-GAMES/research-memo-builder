# 追加確認レビュー

結論：**M2-Aは完了判定でOKです。**

追加確認の結果、M2-Aで確認すべき項目はほぼ全てクリアしています。設計書上も、M2では `yaml` / `zod` 依存追加、YAML読み込み、Zod schema生成、検索クエリ生成、dry-run実装がタスク化されており、dry-runは「APIを呼ばずに生成クエリとリクエスト予定数を確認できる」ことがExit条件になっています。

---

# 0. 実行結果

追加確認を実施しました。レビューをお願いします。
実装結果はどこに記録すべき？新しくドキュメントを作るべき？実装計画・記録みたいなの？
要件定義書や企画書、設計書の更新箇所はありますか？

C:\Users\monsi\AppProjects\research_memo_builder>npm run che
ck

> research-memo-builder@0.1.0 check
> npm run typecheck && npm run format:check

> research-memo-builder@0.1.0 typecheck
> tsc --noEmit

> research-memo-builder@0.1.0 format:check
> prettier --check "src/**/\*.ts" "research/**/_.yaml" "docs/\*\*/_.md" "\*.json"

Checking formatting...
[warn] docs/memo/Zod.md
[warn] docs/reviews/M2-A-error1_review.md
[warn] docs/reviews/M2-A-result1_review.md
[warn] Code style issues found in 3 files. Run Prettier with --write to fix.

C:\Users\monsi\AppProjects\research_memo_builder>npm run for
mat

> research-memo-builder@0.1.0 format
> prettier --write "src/**/\*.ts" "research/**/_.yaml" "docs/\*\*/_.md" "\*.json"

src/cli/research.ts 42ms (unchanged)
src/domain/outputOptions.ts 2ms (unchanged)
src/domain/researchExitCode.ts 2ms (unchanged)
src/domain/researchInput.ts 2ms (unchanged)
src/domain/searchOptions.ts 1ms (unchanged)
src/domain/searchPlatform.ts 1ms (unchanged)
src/domain/searchQuery.ts 1ms (unchanged)
src/input/researchInputLoader.ts 4ms (unchanged)
src/input/researchInputSchema.ts 14ms (unchanged)
src/services/searchQueryBuilder.ts 1ms (unchanged)
src/utils/safePath.ts 2ms (unchanged)
research/inputs/ats-rule-spec.yaml 10ms (unchanged)
docs/conversation_summary/conversation_summary-001.md 60ms (unchanged)
docs/conversation_summary/conversation_summary-002.md 28ms (unchanged)
docs/conversation_summary/conversation_summary-003.md 37ms (unchanged)
docs/design/research-memo-builder-p0-design.md 59ms (unchanged)
docs/memo/initial_requirement.md 15ms (unchanged)
docs/memo/Zod.md 28ms
docs/proposal/proposal_ver.0.0.1.md 34ms (unchanged)
docs/proposal/proposal_ver.0.0.2.md 44ms (unchanged)
docs/proposal/research-memo-builder_proposal.md 41ms (unchanged)
docs/requirements/research-memo-builder-p0-requirements_Ver.0.0.1.md 36ms (unchanged)
docs/requirements/research-memo-builder-p0-requirements.md 55ms (unchanged)
docs/reviews/design_ver.0.1.0_review.md 14ms (unchanged)  
docs/reviews/design_ver.0.1.0-draft.2.md 17ms (unchanged)
docs/reviews/M2-A-error1_review.md 21ms
docs/reviews/M2-A-result1_review.md 17ms
docs/reviews/proposal_ver.0.0.1_review.md 19ms (unchanged)
docs/reviews/research-memo-builder-p0-requirements_Ver.0.0.1_review.md 23ms (unchanged)
docs/reviews/research-memo-builder-p0-requirements_Ver.0.1.0_review.md 13ms (unchanged)
package-lock.json 4ms (unchanged)
package.json 0ms (unchanged)
tsconfig.json 1ms (unchanged)

C:\Users\monsi\AppProjects\research_memo_builder>npm run che
ck

> research-memo-builder@0.1.0 check
> npm run typecheck && npm run format:check

> research-memo-builder@0.1.0 typecheck
> tsc --noEmit

> research-memo-builder@0.1.0 format:check
> prettier --check "src/**/\*.ts" "research/**/_.yaml" "docs/\*\*/_.md" "\*.json"

Checking formatting...
All matched files use Prettier code style!

C:\Users\monsi\AppProjects\research_memo_builder>npm run research -- --dry-run

> research-memo-builder@0.1.0 research
> tsx src/cli/research.ts --dry-run

Input error
--input is required

C:\Users\monsi\AppProjects\research_memo_builder>echo %ERRORLEVEL%
2

C:\Users\monsi\AppProjects\research_memo_builder>npm run research -- --input research/inputs/ats-rule-spec.yaml --dry-run

> research-memo-builder@0.1.0 research
> tsx src/cli/research.ts --input research/inputs/ats-rule-spec.yaml --dry-run

Research Memo Builder dry-run completed.

Input
File: research/inputs/ats-rule-spec.yaml
Topic: 家庭内ルールを書き出したら、仕様書になっていた話  
 Article types: devDiary

Search options
countPerQuery: 10
country: JP
searchLang: ja
uiLang: ja-JP
extraSnippets: true

Output
Planned output dir: output/research/ats-rule-spec
CSV output: skipped in dry-run
Markdown output: skipped in dry-run

Planned requests
15

Generated queries

1. [note] site:note.com 家庭内ルール 仕様書 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
2. [note] site:note.com 家庭内ルール 要件定義 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
3. [note] site:note.com 家庭内 ポイント制度 設計 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
4. [note] site:note.com 子育て 仕組み化 note (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
5. [note] site:note.com 家庭内ルール プロダクト設計 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
6. [Qiita] site:qiita.com 家庭内ルール 仕様書 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
7. [Qiita] site:qiita.com 家庭内ルール 要件定義 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
8. [Qiita] site:qiita.com 家庭内 ポイント制度 設計 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
9. [Qiita] site:qiita.com 子育て 仕組み化 note (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
10. [Qiita] site:qiita.com 家庭内ルール プロダクト設計 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
11. [Zenn] site:zenn.dev 家庭内ルール 仕様書 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
12. [Zenn] site:zenn.dev 家庭内ルール 要件定義 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
13. [Zenn] site:zenn.dev 家庭内 ポイント制度 設計 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
14. [Zenn] site:zenn.dev 子育て 仕組み化 note (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
15. [Zenn] site:zenn.dev 家庭内ルール プロダクト設計 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)

No Brave Search API calls were made.
No CSV or Markdown files were written.

C:\Users\monsi\AppProjects\research_memo_builder>echo %ERRORLEVEL%
0

C:\Users\monsi\AppProjects\research_memo_builder>npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/tmp-check --dry-run

> research-memo-builder@0.1.0 research
> tsx src/cli/research.ts --input research/inputs/ats-rule-spec.yaml --out output/research/tmp-check --dry-run

Research Memo Builder dry-run completed.

Input
File: research/inputs/ats-rule-spec.yaml
Topic: 家庭内ルールを書き出したら、仕様書になっていた話  
 Article types: devDiary

Search options
countPerQuery: 10
country: JP
searchLang: ja
uiLang: ja-JP
extraSnippets: true

Output
Planned output dir: output/research/tmp-check
CSV output: skipped in dry-run
Markdown output: skipped in dry-run

Planned requests
15

Generated queries

1. [note] site:note.com 家庭内ルール 仕様書 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
2. [note] site:note.com 家庭内ルール 要件定義 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
3. [note] site:note.com 家庭内 ポイント制度 設計 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
4. [note] site:note.com 子育て 仕組み化 note (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
5. [note] site:note.com 家庭内ルール プロダクト設計 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
6. [Qiita] site:qiita.com 家庭内ルール 仕様書 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
7. [Qiita] site:qiita.com 家庭内ルール 要件定義 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
8. [Qiita] site:qiita.com 家庭内 ポイント制度 設計 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
9. [Qiita] site:qiita.com 子育て 仕組み化 note (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
10. [Qiita] site:qiita.com 家庭内ルール プロダクト設計 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
11. [Zenn] site:zenn.dev 家庭内ルール 仕様書 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
12. [Zenn] site:zenn.dev 家庭内ルール 要件定義 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
13. [Zenn] site:zenn.dev 家庭内 ポイント制度 設計 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
14. [Zenn] site:zenn.dev 子育て 仕組み化 note (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)
15. [Zenn] site:zenn.dev 家庭内ルール プロダクト設計 (count=10, country=JP, search_lang=ja, ui_lang=ja-JP, extra_snippets=true)

No Brave Search API calls were made.
No CSV or Markdown files were written.

C:\Users\monsi\AppProjects\research_memo_builder>npm run research -- --input research/inputs/ats-rule-spec.yaml --out ../tmp --dry-run

> research-memo-builder@0.1.0 research
> tsx src/cli/research.ts --input research/inputs/ats-rule-spec.yaml --out ../tmp --dry-run

Input error
--out is invalid: use a relative path without absolute path notation or '../'

---

# 1. 実行結果レビュー

## 1.1 `npm run check`

最初は以下で失敗。

```text
[warn] docs/memo/Zod.md
[warn] docs/reviews/M2-A-error1_review.md
[warn] docs/reviews/M2-A-result1_review.md
```

これは**コード不具合ではなく、追加したMarkdown 3ファイルのPrettier未整形**です。
その後 `npm run format` を実行し、再度 `npm run check` が通っています。

```text
All matched files use Prettier code style!
```

判定：**OK**

---

## 1.2 `--input` なし

```bash
npm run research -- --dry-run
echo %ERRORLEVEL%
```

結果：

```text
Input error
--input is required
2
```

判定：**OK**

P0では `--input` 未指定時は入力不正として停止する仕様です。今回、表示内容もExit Codeも期待どおりです。

---

## 1.3 正常dry-run

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml --dry-run
echo %ERRORLEVEL%
```

結果：

```text
Research Memo Builder dry-run completed.
Planned requests
  15
No Brave Search API calls were made.
No CSV or Markdown files were written.
0
```

判定：**OK**

確認できていること：

| 項目                              | 結果 |
| --------------------------------- | ---- |
| YAML読み込み                      | OK   |
| Zod検証                           | OK   |
| `search` デフォルト補完           | OK   |
| `platforms × keywords` クエリ生成 | OK   |
| 15リクエスト見積もり              | OK   |
| API未呼び出し                     | OK   |
| CSV/Markdown未出力                | OK   |
| 正常時Exit Code `0`               | OK   |

---

## 1.4 `--out` 正常系

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/tmp-check --dry-run
```

結果：

```text
Planned output dir: output/research/tmp-check
```

判定：**OK**

設計書では、`--out` 指定時は入力YAMLの `output.dir` より優先する方針です。今回の挙動はその方針に合っています。

---

## 1.5 `--out ../tmp` 異常系

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml --out ../tmp --dry-run
```

結果：

```text
Input error
--out is invalid: use a relative path without absolute path notation or '../'
```

判定：**OK**

`../` を禁止できています。
P0では出力先に絶対パスや `../` を許可しないため、この挙動で問題ありません。

---

# 2. M2-A完了判定

## 判定

**M2-Aは完了でよいです。**

```text
M2-A：入力YAML読み込み + Zod検証 + dry-run
Status: Done
```

## 完了根拠

| 確認項目                               | 判定 |
| -------------------------------------- | ---- |
| `npm run check` が通る                 | OK   |
| `--input` 未指定でExit Code 2          | OK   |
| 正常dry-runでExit Code 0               | OK   |
| `--out` がYAMLの `output.dir` を上書き | OK   |
| `--out ../tmp` を入力不正として停止    | OK   |
| APIを呼ばない                          | OK   |
| CSV/Markdownを出力しない               | OK   |

---

# 3. 実装結果はどこに記録すべきか

結論：**新しく「実装記録」ドキュメントを作るのがよいです。**

要件定義書・企画書・設計書は、基本的に以下の役割です。

| 文書       | 役割                           |
| ---------- | ------------------------------ |
| 企画書     | なぜ作るか、全体方針、スコープ |
| 要件定義書 | 何を満たすべきか               |
| 設計書     | どう実装する方針か             |
| 実装記録   | 実際に何を作り、何を確認したか |

今回の内容は「実装結果」と「検証ログ」なので、**要件定義書や企画書に直接混ぜない方がよい**です。

---

# 4. 作るべきドキュメント案

おすすめはこれです。

```text
docs/implementation/research-memo-builder-m2-a-implementation-record.md
```

または、既存構成に合わせるなら以下でもOKです。

```text
docs/reviews/M2-A-result1_review.md
```

ただし、`docs/reviews` は「レビュー結果」置き場として使い、**実装作業の正本記録**は別にした方が整理しやすいです。

私の推奨は以下です。

```text
docs/implementation/
  research-memo-builder-m2-a-implementation-record.md
```

---

# 5. 実装記録ドキュメントの構成案

以下の構成で十分です。

```markdown
# Research Memo Builder M2-A 実装記録

## 1. 対象マイルストーン

M2-A：入力YAML読み込み + Zod検証 + dry-run

## 2. 実装日

2026-06-21

## 3. 実装対象

- src/domain/researchInput.ts
- src/domain/searchPlatform.ts
- src/domain/searchOptions.ts
- src/domain/outputOptions.ts
- src/domain/searchQuery.ts
- src/domain/researchExitCode.ts
- src/input/researchInputSchema.ts
- src/input/researchInputLoader.ts
- src/services/searchQueryBuilder.ts
- src/utils/safePath.ts
- src/cli/research.ts

## 4. 実装内容

- YAML読み込み処理を追加
- Zodによる入力検証を追加
- search配下のデフォルト補完を追加
- P0対象外出力フラグの検証を追加
- site指定検索クエリ生成を追加
- dry-run表示を追加
- --out の上書き処理を追加
- 入力不正時のExit Code 2を確認

## 5. 確認結果

| 確認         | コマンド                                                                                                 | 結果        |
| ------------ | -------------------------------------------------------------------------------------------------------- | ----------- |
| format/check | npm run check                                                                                            | OK          |
| inputなし    | npm run research -- --dry-run                                                                            | Exit Code 2 |
| 正常dry-run  | npm run research -- --input research/inputs/ats-rule-spec.yaml --dry-run                                 | Exit Code 0 |
| --out上書き  | npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/tmp-check --dry-run | OK          |
| --out不正    | npm run research -- --input research/inputs/ats-rule-spec.yaml --out ../tmp --dry-run                    | Input error |

## 6. 発生した問題と対応

### TypeScript undefined判定

- `argv[index]` と `cliArgs.input` が `undefined` の可能性ありとして検出された
- 明示チェックを追加して解消

### Zod default指定

- `.default({})` が最終出力型と合わず型エラー
- `z.preprocess((value) => value ?? {}, schema)` に変更して解消

## 7. 未対応

- .env 読み込み
- BRAVE_API_KEY 検証
- Brave Search API単一検索
- APIキー未設定時のExit Code 3
- CSV出力
- Markdown出力

## 8. 次アクション

M2-B：.env読み込み + Brave Search API単一検索へ進む。
```

---

# 6. 企画書・要件定義書・設計書の更新要否

## 6.1 企画書

**更新不要**です。

理由：今回の実装は、企画・スコープ・採用技術の変更ではありません。
企画書はTypeScript CLIとして構築し、初期MVPではBrave Search APIから検索結果を取得し、CSVとMarkdownを出力する方針を定める文書です。

今回のM2-A実装は、その方針内の進捗です。

---

## 6.2 要件定義書

**基本は更新不要**です。

ただし、1点だけ確認が必要です。

### 確認ポイント：`--out` の禁止条件

現在の実装は以下です。

| パス                          | 実装挙動   |
| ----------------------------- | ---------- |
| `output/research/tmp-check`   | OK         |
| `../tmp`                      | NG         |
| 絶対パス                      | NG想定     |
| `./output/research/tmp-check` | おそらくOK |

設計書側は、`--out` の不正条件を以下の3つにしています。

```text
空文字
絶対パス
../ を含む
```

このため、**設計書基準なら現実装でOK**です。

一方で、もし手元の要件定義書に

```text
./ を許可しない
```

と書いてあるなら、そこは**要件定義書側を修正するか、実装側を厳しくするか**を決める必要があります。

私の推奨は、**要件定義書を設計書に合わせて「絶対パス、空文字、`../` を禁止」に統一**です。
`./output/...` はプロジェクト配下の相対パスなので、P0の安全制約として禁止する必要性は低いです。

---

## 6.3 設計書

**大きな更新は不要**です。

理由：今回の実装内容は、設計書のM2タスク分解に沿っています。M2-2〜M2-6は今回の実装で完了したと見なせます。

ただし、次のどちらかは追加してもよいです。

### 軽微更新案

設計書に「実装進捗」を入れるなら、末尾に以下のような章を追加します。

```markdown
## 14. 実装進捗

| Milestone | Status |     完了日 | 備考                                   |
| --------- | ------ | ---------: | -------------------------------------- |
| M2-A      | done   | 2026-06-21 | YAML読み込み、Zod検証、dry-runまで完了 |
| M2-B      | todo   |          - | .env読み込み、Brave Search API単一検索 |
```

ただし、私はこれは**設計書には入れない方がよい**と考えます。
理由は、設計書が進捗管理表になり始めると、後から読みにくくなるためです。

---

# 7. 推奨ドキュメント運用

おすすめは、以下の4層です。

```text
docs/
  proposal/        # 企画・方針
  requirements/    # 要件
  design/          # 設計
  implementation/  # 実装記録
  reviews/         # レビュー記録
  memo/            # 学習メモ・調査メモ
```

今回ならこうです。

| 内容                   | 置き場所                                                                  |
| ---------------------- | ------------------------------------------------------------------------- |
| Zodとは何か            | `docs/memo/Zod.md`                                                        |
| M2-Aエラー原因レビュー | `docs/reviews/M2-A-error1_review.md`                                      |
| M2-A結果レビュー       | `docs/reviews/M2-A-result1_review.md`                                     |
| M2-Aの公式な実装結果   | `docs/implementation/research-memo-builder-m2-a-implementation-record.md` |

---

# 8. 今回作るなら、この1ファイルで十分

最小構成でいくなら、新規作成はこれだけでよいです。

```text
docs/implementation/research-memo-builder-m2-a-implementation-record.md
```

このファイルに、以下を集約します。

```text
何を作ったか
何を確認したか
どのエラーが出たか
どう直したか
完了判定
次にやること
```

既に `docs/reviews/M2-A-error1_review.md` と `docs/reviews/M2-A-result1_review.md` があるなら、実装記録からそれらを参照する形がよいです。

---

# 9. 現時点の更新判断

| 文書         |     更新要否 | 判断                                       |
| ------------ | -----------: | ------------------------------------------ |
| 企画書       |         不要 | 方針変更なし                               |
| 要件定義書   |     条件付き | `--out` の `./` 禁止記述がある場合だけ修正 |
| 設計書       |         不要 | 実装は設計どおり                           |
| 実装記録     | 新規作成推奨 | M2-A完了を残すため                         |
| レビュー記録 |     既存でOK | 追加した2ファイルは継続利用可              |
| 学習メモ     |     既存でOK | `docs/memo/Zod.md` は妥当                  |

---

# 10. M2-A完了記録として残すべき結論

実装記録には、この結論を明記してください。

```text
M2-Aは完了。
YAML読み込み、Zod検証、searchデフォルト補完、P0対象外出力フラグ検証、検索クエリ生成、dry-run表示、--out上書き、入力不正時Exit Code 2を確認済み。
Brave Search API呼び出し、.env読み込み、CSV/Markdown出力は未実装であり、M2-B以降で扱う。
```

---

# 次のアクション

次は、まず以下を作成するのがよいです。

```text
docs/implementation/research-memo-builder-m2-a-implementation-record.md
```

その後、要件定義書の `--out` 記述だけ確認してください。
`./` 禁止と書いてある場合は、設計書に合わせて **「空文字、絶対パス、`../` を禁止」**へ統一するのが推奨です。

---

# まとめ / Summary

## 日本語

- 追加確認結果はOKです。M2-Aは完了判定でよいです。
- `npm run check`、Exit Code 2/0、`--out` 正常系・異常系が確認できています。
- 実装結果は、要件定義書や設計書ではなく、新規の実装記録に残すのがよいです。
- 推奨ファイルは `docs/implementation/research-memo-builder-m2-a-implementation-record.md` です。
- 企画書と設計書の更新は不要です。
- 要件定義書は、`--out` の `./` 禁止記述がある場合だけ、設計書に合わせて修正するとよいです。

## English

- The additional checks are OK. M2-A can be marked as done.
- `npm run check`, Exit Code 2/0, and `--out` normal/error cases are confirmed.
- The implementation result should be recorded in a new implementation record, not in the requirements or design document.
- The recommended file is `docs/implementation/research-memo-builder-m2-a-implementation-record.md`.
- The proposal and design documents do not need updates.
- The requirements document only needs an update if it says `./` is not allowed for `--out`.
