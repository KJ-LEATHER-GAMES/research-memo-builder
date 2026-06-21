# レビュー結果

結論：**M2-Aは実装完了水準です。かなり良いです。**

今回の実行結果は、M2-Aで見るべき主要条件を満たしています。
設計上、`--dry-run` は「APIを呼ばず、CSV/Markdownも出力せず、入力検証・デフォルト補完・検索クエリ生成・予定リクエスト数表示まで行う」仕様です。今回の出力はこの範囲に合っています。

---

# 0. 実行結果

修正後の実行結果です。レビューをお願いします。

上記修正案を反映後下記を実行
C:\Users\monsi\AppProjects\research_memo_builder>npm run format   

> research-memo-builder@0.1.0 format
> prettier --write "src/**/*.ts" "research/**/*.yaml" "docs/**/*.md" "*.json"

src/cli/research.ts 45ms
src/domain/outputOptions.ts 2ms (unchanged)
src/domain/researchExitCode.ts 2ms (unchanged)
src/domain/researchInput.ts 2ms (unchanged)
src/domain/searchOptions.ts 1ms (unchanged)
src/domain/searchPlatform.ts 1ms (unchanged)
src/domain/searchQuery.ts 1ms (unchanged)
src/input/researchInputLoader.ts 3ms (unchanged)
src/input/researchInputSchema.ts 13ms
src/services/searchQueryBuilder.ts 2ms (unchanged)
src/utils/safePath.ts 2ms (unchanged)
research/inputs/ats-rule-spec.yaml 10ms (unchanged)
docs/conversation_summary/conversation_summary-001.md 60ms (unchanged)
docs/conversation_summary/conversation_summary-002.md 27ms (unchanged)
docs/conversation_summary/conversation_summary-003.md 41ms (unchanged)
docs/design/research-memo-builder-p0-design.md 71ms (unchanged)
docs/memo/initial_requirement.md 11ms (unchanged)
docs/proposal/proposal_ver.0.0.1.md 41ms (unchanged)
docs/proposal/proposal_ver.0.0.2.md 44ms (unchanged)
docs/proposal/research-memo-builder_proposal.md 42ms (unchanged)
docs/requirements/research-memo-builder-p0-requirements_Ver.0.0.1.md 37ms (unchanged)
docs/requirements/research-memo-builder-p0-requirements.md 51ms (unchanged)
docs/reviews/design_ver.0.1.0_review.md 16ms (unchanged)    
docs/reviews/design_ver.0.1.0-draft.2.md 24ms (unchanged)
docs/reviews/proposal_ver.0.0.1_review.md 18ms (unchanged)  
docs/reviews/research-memo-builder-p0-requirements_Ver.0.0.1_review.md 27ms (unchanged)
docs/reviews/research-memo-builder-p0-requirements_Ver.0.1.0_review.md 23ms (unchanged)
package-lock.json 4ms (unchanged)
package.json 1ms (unchanged)
tsconfig.json 1ms (unchanged)

C:\Users\monsi\AppProjects\research_memo_builder>npm run typecheck

> research-memo-builder@0.1.0 typecheck
> tsc --noEmit


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

`--input`なしで実行


C:\Users\monsi\AppProjects\research_memo_builder>npm run research -- --dry-run

> research-memo-builder@0.1.0 research
> tsx src/cli/research.ts --dry-run

Input error
--input is required

research/inputs/ats-rule-spec.yaml から search: を一時的に削除して実行


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

## 

research/inputs/ats-rule-spec.yaml から search: を戻し、output.json: trueに変更して実行。

```bash
C:\Users\monsi\AppProjects\research_memo_builder>npm run research -- --input research/inputs/ats-rule-spec.yaml --dry-run

> research-memo-builder@0.1.0 research
> tsx src/cli/research.ts --input research/inputs/ats-rule-spec.yaml --dry-run

Input error
Research input validation failed.
- output.json: output.json must be false in P0
```

---

# 1. 正常系レビュー

## `npm run format`

```text
All files formatted
```

問題なしです。
Prettier対象ファイルも想定どおりです。

## `npm run typecheck`

```text
tsc --noEmit
```

エラーなし。

前回の以下2系統の問題は解消済みです。

| 前回エラー                                        | 状態 |
| -------------------------------------------- | -- |
| `current` / `inputPath` が `undefined` かもしれない | 解消 |
| Zod `.default({})` の型不一致                     | 解消 |

これは良い修正です。

---

# 2. dry-run正常系レビュー

実行結果：

```text
Research Memo Builder dry-run completed.
...
Planned requests
  15
...
No Brave Search API calls were made.
No CSV or Markdown files were written.
```

OKです。

特に良い点はここです。

| 確認項目             |                            結果 | 判定 |
| ---------------- | ----------------------------: | -- |
| YAML読み込み         |                 topicが表示されている | OK |
| Zod検証            |                      入力が通っている | OK |
| デフォルト値           |      `countPerQuery: 10` など表示 | OK |
| クエリ生成            |                         15件生成 | OK |
| 生成順              | note → Qiita → Zenn、各keyword順 | OK |
| API呼び出しなし        |                        明示表示あり | OK |
| CSV/Markdown出力なし |                        明示表示あり | OK |

5キーワード × 3媒体 = 15クエリの生成も、P0要件の想定どおりです。

---

# 3. 異常系レビュー

## `--input` なし

```text
Input error
--input is required
```

OKです。

P0要件では `--input` 未指定時は入力不正として停止する仕様なので、今回の挙動は合っています。

---

## `search:` を削除

結果：

```text
Search options
  countPerQuery: 10
  country: JP
  searchLang: ja
  uiLang: ja-JP
  extraSnippets: true
```

OKです。

これはかなり重要です。
`search` 配下が丸ごと未指定でも、Zod schema側でP0既定値を補完できています。

M2-Aの中で一番価値がある確認の1つです。

---

## `output.json: true`

```text
Input error
Research input validation failed.
- output.json: output.json must be false in P0
```

OKです。

P0では `output.json`、`output.runReport`、`output.chatgptPrompt` が `true` の場合は入力不正として止める方針なので、期待どおりです。

---

# 4. M2-A Exit条件との照合

| M2-A Exit条件                     | 実行結果                      | 判定 |
| ------------------------------- | ------------------------- | -- |
| YAMLを読める                        | topic表示あり                 | OK |
| Zodで入力検証できる                     | 正常系・異常系とも動作               | OK |
| `search` 配下のデフォルト補完             | `search:` 削除で確認済み         | OK |
| P0対象外フラグ `true` を弾ける            | `output.json: true` で確認済み | OK |
| `platforms × keywords` で検索クエリ生成 | 15件生成                     | OK |
| 予定リクエスト数を表示                     | `Planned requests 15`     | OK |
| 出力予定ディレクトリを表示                   | `Planned output dir` 表示   | OK |
| APIを呼ばない                        | 明示表示あり                    | OK |
| CSV/Markdownを出力しない              | 明示表示あり                    | OK |
| 型チェックが通る                        | `tsc --noEmit` OK         | OK |

**判定：M2-Aは完了でよいです。**

---

# 5. 追加で確認したい軽微ポイント

M2-A完了判定には十分ですが、次へ進む前に以下だけ確認すると堅いです。

## 5.1 `npm run check`

個別に `format` と `typecheck` は通っていますが、最後に統合確認として実行しておくとよいです。

```bash
npm run check
```

期待：

```text
All matched files use Prettier code style!
```

---

## 5.2 Exit Code確認

エラー表示はOKですが、Exit Code 2 になっているかも確認するとP0要件により近づきます。

Windows CMDなら、エラー発生直後に以下を実行します。

```bash
echo %ERRORLEVEL%
```

例：

```bash
npm run research -- --dry-run
echo %ERRORLEVEL%
```

期待：

```text
2
```

正常系なら期待値は `0` です。

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml --dry-run
echo %ERRORLEVEL%
```

期待：

```text
0
```

---

## 5.3 `--out` の確認

まだ `--out` の動作確認がログにありません。
M2-Bに行く前に、これは確認しておくとよいです。

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/tmp-check --dry-run
```

期待：

```text
Planned output dir: output/research/tmp-check
```

異常系も1つ確認します。

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml --out ../tmp --dry-run
```

期待：

```text
Input error
```

---

# 6. 注意点：`--out` の仕様に小さな揺れがあります

ここは次に進む前に整理した方がいいです。

設計書側では、`--out` は以下を入力不正にするとされています。

```text
空文字
絶対パス
../ を含むパス
```

一方、要件定義側の一部では `./` を許可しない記述が見えます。 

現在の `safePath.ts` は、おそらく以下の挙動です。

| 入力                      | 現コードの想定挙動 |
| ----------------------- | --------- |
| `../tmp`                | NG        |
| `C:\tmp`                | NG        |
| `/tmp`                  | NG        |
| `output/research/tmp`   | OK        |
| `./output/research/tmp` | OKの可能性あり  |

もし正本を「`../` 禁止」にするなら現状でOKです。
もし正本を「`./` も禁止」にするなら、`safePath.ts` に追加チェックが必要です。

私の推奨は、**P0では `../` と絶対パス禁止を正とし、`./output/...` は許可してよい**です。
理由は、`./output/...` はプロジェクト配下の相対パスであり、安全上の問題が小さいためです。

ただし、ドキュメント上の表記は統一した方がよいです。

---

# 7. 現時点のステータス

```text
M1    プロジェクト初期化          完了
M1.5  P0実装設計 Active化        完了
M2-A  YAML + Zod + dry-run       完了判定OK
M2-B  .env + Brave単一検索       次に着手
```

---

# 次のアクション

次は **M2-B：.env読み込み + Brave Search API単一検索** に進んでよいです。

着手前に、最後の締めとして以下を実行してください。

```bash
npm run check
npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/tmp-check --dry-run
npm run research -- --input research/inputs/ats-rule-spec.yaml --out ../tmp --dry-run
```

その後、M2-Bでは以下を作成・修正します。

```text
src/config/env.ts
src/adapters/braveSearchClient.ts
src/domain/searchExecution.ts
src/application/runResearchUseCase.ts
src/cli/research.ts
```

---

# まとめ / Summary

## 日本語

* フォーマット、型チェック、dry-run正常系はOKです。
* `--input` なし、`search:` 省略、`output.json: true` の異常系も期待どおりです。
* M2-AのExit条件は満たしているため、M2-Aは完了判定でよいです。
* 追加確認として、`npm run check`、Exit Code、`--out` の正常系・異常系を確認するとさらに堅いです。
* 次は M2-B：`.env` 読み込み + Brave Search API単一検索 に進めます。

## English

* Format, type check, and normal dry-run are OK.
* Error cases for missing `--input`, missing `search`, and `output.json: true` are also OK.
* M2-A meets the exit conditions.
* It is good to also check `npm run check`, exit codes, and `--out`.
* The next step is M2-B: `.env` loading and one Brave Search API request.
