# 最終レビュー結果

## 判定

**条件付きで Active化可**です。

`research-memo-builder-p0-design.md` 自体は、P0実装へ進める粒度まで整理できています。特に、入力YAML型、DTO、CLI引数、出力ファイル構成、エラーコード、ディレクトリ構成がM2〜M5の実装タスクへ分解されており、設計書としての完成度は十分です。設計書はM1.5のP0実装設計として、M2以降の実装時に参照する文書と位置づけられています。

ただし、**このままActive化する前に、P0要件定義書の修正が必要**です。理由は、設計書で決めた `--out`、`--dry-run`、exit code体系が、現在のP0要件定義書と一部ズレているためです。

---

# 1. Active化可否

| 観点             | 判定       | コメント                                                                |
| ---------------- | ---------- | ----------------------------------------------------------------------- |
| P0スコープ整合   | OK         | CSV/Markdown出力、Brave Search API、URL完全一致重複排除、安全制約と整合 |
| 入力YAML型       | OK         | Raw / Resolved 分離は妥当                                               |
| DTO設計          | OK         | P0実装に必要なDTOが揃っている                                           |
| CLI引数          | 要修正     | 設計書と要件定義書で `--out` / `--dry-run` の扱いが違う                 |
| 出力ファイル構成 | OK         | P0出力を `search-results.csv` / `research-memo.md` に限定できている     |
| エラーコード     | 要修正     | 設計書と要件定義書でexit code体系が違う                                 |
| ディレクトリ構成 | OK         | M2〜M5の実装に落とせる粒度                                              |
| 未決事項         | 要軽微修正 | Active化するなら「残未決事項」は決定済みにした方がよい                  |
| 企画書との整合   | 概ねOK     | 企画書修正は任意レベル                                                  |

---

# 2. 必須修正：P0要件定義書

## 2.1 CLI要件の修正が必要

現在のP0要件定義書では、CLI要件として以下になっています。

- `--out` は任意実装
- `--dry-run` は必須要件に含めない
- `--use-cache` は実装しない

この記述は、現在の設計書とズレています。要件定義書側では `--out` が任意実装、`--dry-run` が非必須として残っています。

一方、設計書では以下に変更済みです。

- `--out` はP0正式仕様
- `--dry-run` はP0実装必須機能
- `--use-cache` / `--json` / `--run-report` / `--chatgpt-prompt` はP0対象外として指定時エラー
- `--out` はYAMLの `output.dir` より優先

設計書側では、`--out` は正式な任意引数、`--dry-run` はP0で実装必須の確認機能として扱う、と定義されています。

### 修正提案

`docs/research/research-memo-builder-p0-requirements.md` の **12. CLI要件** を更新してください。

````md
## 12. CLI要件

### 12.1 基本実行

P0の基本実行コマンドは以下を想定する。

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml
```
````

| ID         | 要件                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------ |
| P0-CLI-001 | `--input` で入力YAMLを指定できる                                                                 |
| P0-CLI-002 | `--input` 未指定時は入力不正として停止する                                                       |
| P0-CLI-003 | `--out` はP0正式仕様に含める。ただしCLI引数としては任意とする                                    |
| P0-CLI-004 | `--out` 指定時は、入力YAMLの `output.dir` より優先する                                           |
| P0-CLI-005 | `--out` 未指定時は、入力YAMLの `output.dir` を使用する                                           |
| P0-CLI-006 | `--out` には絶対パス、空文字、`../` を許可しない                                                 |
| P0-CLI-007 | `--dry-run` はP0必須機能として実装する                                                           |
| P0-CLI-008 | `--dry-run` 指定時は、APIを呼ばず、CSV/Markdownも出力しない                                      |
| P0-CLI-009 | `--dry-run` 指定時は、入力検証、デフォルト補完、検索クエリ生成、予定リクエスト数表示まで行う     |
| P0-CLI-010 | P0では `--use-cache` を実装しない。指定時は入力不正として停止する                                |
| P0-CLI-011 | P0では `--json`、`--run-report`、`--chatgpt-prompt` を実装しない。指定時は入力不正として停止する |

````

---

## 2.2 exit code体系の修正が必要

現在のP0要件定義書では、多くの即停止エラーが `exit code 1` に集約されています。また、一部API失敗時は正常終了扱いに近い整理になっています。:contentReference[oaicite:3]{index=3}

一方、設計書ではexit codeを次のように細分化しています。

| Exit Code | 意味 |
|---:|---|
| `0` | 成功。0件結果も含む |
| `1` | 部分API失敗 |
| `2` | 入力不正 |
| `3` | APIキー・設定不備 |
| `4` | 全API失敗 |
| `5` | 出力失敗 |
| `9` | 想定外エラー |

設計書では、0件は成功扱い、部分API失敗はExit Code 1、全API失敗はExit Code 4、入力不正はExit Code 2、APIキー不備はExit Code 3と整理されています。:contentReference[oaicite:4]{index=4}

### 修正提案

P0要件定義書の **10. エラー処理要件** を、設計書のexit code体系に合わせて更新してください。

```md
### 10.x P0 exit code定義

| Exit Code | 名前 | ケース | 出力方針 |
|---:|---|---|---|
| 0 | SUCCESS | 全処理成功。検索結果0件も含む | CSV/Markdownを生成する |
| 1 | PARTIAL_API_FAILURE | 一部クエリがAPI失敗したが、1件以上のクエリは成功 | 成功分からCSV/Markdownを生成する |
| 2 | INPUT_ERROR | CLI引数不正、入力ファイル不正、YAML不正、入力値不正 | 出力しない |
| 3 | CONFIG_ERROR | `.env` または `BRAVE_API_KEY` 不備 | 出力しない |
| 4 | ALL_API_FAILURE | 生成クエリはあるが、全クエリのAPI呼び出しが失敗 | 可能なら空CSV/失敗メモを生成する |
| 5 | OUTPUT_ERROR | 出力ディレクトリ作成失敗、ファイル書き込み失敗 | 不完全の可能性あり |
| 9 | UNEXPECTED_ERROR | 想定外例外 | 不定 |
````

特に、以下の2点は必ず修正してください。

```md
- 一部API失敗時は Exit Code 1 とする
- 全API失敗時は Exit Code 4 とする
```

---

## 2.3 P0実装受け入れ条件の追加が必要

現在のP0実装受け入れ条件には、`--out` と `--dry-run` が明示されていません。要件定義書にはP0実装受け入れ条件があり、CSV/Markdown生成、APIキー漏洩防止、検索結果URLへ直接HTTPアクセスしないことなどは定義されています。

設計決定を反映するなら、以下を追加した方がよいです。

```md
| ID         | 受け入れ条件                                                              |
| ---------- | ------------------------------------------------------------------------- |
| P0-IAC-021 | `--out` を指定した場合、入力YAMLの `output.dir` より `--out` が優先される |
| P0-IAC-022 | `--out` に絶対パス、空文字、`../` が含まれる場合は入力不正として停止する  |
| P0-IAC-023 | `--dry-run` 指定時はBrave Search APIを呼び出さない                        |
| P0-IAC-024 | `--dry-run` 指定時はCSV/Markdownを出力しない                              |
| P0-IAC-025 | `--dry-run` 指定時は検索クエリ一覧と予定リクエスト数を表示する            |
| P0-IAC-026 | 入力不正時は Exit Code 2 で終了する                                       |
| P0-IAC-027 | APIキー不備時は Exit Code 3 で終了する                                    |
| P0-IAC-028 | 一部API失敗時は Exit Code 1 で終了し、成功分からCSV/Markdownを生成する    |
| P0-IAC-029 | 全API失敗時は Exit Code 4 で終了する                                      |
| P0-IAC-030 | 出力失敗時は Exit Code 5 で終了する                                       |
```

---

# 3. 設計書側の修正提案

## 3.1 frontmatterをActive化する

現在の設計書は以下です。

```yaml
status: draft
version: 0.1.0-draft.2
```

Active化時は以下に変更してください。

```yaml
status: active
version: 1.0.0
```

設計書はM1.5のP0実装設計として、M2以降の実装に参照される前提になっています。

---

## 3.2 「残未決事項」は決定済みにした方がよい

現在、設計書には残未決事項として以下があります。

- CLI引数パーサーを使うか、自前で実装するか
- CSVライブラリを使うか

ただし、どちらも推奨方針がすでに明確です。設計書では、CSV文字コード、`--out`、`--dry-run`、入力バリデーション、HTTPクライアントは決定済みで、残未決事項はCLI引数パーサーとCSVライブラリのみとされています。

Active化するなら、ここは「未決事項」として残さず、以下のように **P0実装方針** として決め切るのがよいです。

```md
## 12. P0実装方針

P0実装開始時点で、以下を実装方針として採用する。

| ID        | 項目            | P0方針               | P1以降                                    |
| --------- | --------------- | -------------------- | ----------------------------------------- |
| DD-P0-006 | CLI引数パーサー | P0では自前実装とする | 引数が増えた場合に commander 等を検討する |
| DD-P0-007 | CSV生成         | P0では自前実装とする | 複雑化した場合にCSVライブラリを検討する   |
```

これで、Active文書に「未決」が残らなくなります。

---

## 3.3 設計完了条件はOK

設計書のP0設計完了条件は、Active化のチェックリストとして十分です。入力YAML、DTO、CLI引数、出力、CSV、Markdown、Exit Code、ディレクトリ構成、設計決定、M2〜M5実装タスクが条件に含まれています。

ここは修正不要です。

---

# 4. 企画書の修正要否

## 判定

**必須修正は不要**です。

企画書は上位方針の文書であり、P0/P1境界、Brave Search API採用、CSV/Markdown優先、JSON/run-report/ChatGPT分析プロンプトはP1という方針が定義されています。

ただし、きれいに整えるなら任意で以下を追記してもよいです。

```md
### M1.5：P0実装設計

完了条件：

- `docs/research/research-memo-builder-p0-design.md` が作成されている
- 入力YAML型が定義されている
- DTOが定義されている
- CLI引数が定義されている
- 出力ファイル構成が定義されている
- エラーコードが定義されている
- ディレクトリ構成が定義されている
```

ただし、これは必須ではありません。企画書はActiveのままで問題ありません。

---

# 5. 最終判定

## Active化前に必要な修正

| 優先度 | 対象         | 修正内容                                                     | 必須 |
| ------ | ------------ | ------------------------------------------------------------ | ---- |
| A      | P0要件定義書 | CLI要件を設計書に合わせて更新                                | 必須 |
| A      | P0要件定義書 | exit code体系を設計書に合わせて更新                          | 必須 |
| A      | P0要件定義書 | P0実装受け入れ条件に `--out` / `--dry-run` / exit codeを追加 | 必須 |
| B      | P0設計書     | frontmatterを `status: active` / `version: 1.0.0` に変更     | 必須 |
| B      | P0設計書     | 残未決事項を「P0実装方針」として決定済みに変更               | 推奨 |
| C      | 企画書       | M1.5マイルストーンを追記                                     | 任意 |

---

# 6. Active化判定コメント

以下の状態になれば、`research-memo-builder-p0-design.md` は **Active化して問題ありません**。

```text
- P0要件定義書のCLI要件が、設計書の `--out` / `--dry-run` 方針と一致している
- P0要件定義書のexit code体系が、設計書の 0/1/2/3/4/5/9 と一致している
- P0実装受け入れ条件に、`--out` / `--dry-run` / exit codeが追加されている
- 設計書frontmatterが status: active / version: 1.0.0 になっている
- 設計書に未決事項が残っていない、または実装を止めない検討事項として明記されている
```

---

# 次のアクション

次は、まず **P0要件定義書のCLI要件・exit code・受け入れ条件を更新**してください。その後、`research-memo-builder-p0-design.md` のfrontmatterを `status: active / version: 1.0.0` に変更し、「残未決事項」を「P0実装方針」に置き換えればActive化できます。

# まとめ / Summary

## 日本語

- `research-memo-builder-p0-design.md` は、内容としてはActive化できる水準です。
- ただし、P0要件定義書と `--out`、`--dry-run`、exit code体系がズレています。
- Active化前に、P0要件定義書のCLI要件、エラー処理要件、P0実装受け入れ条件を修正してください。
- 企画書の修正は任意です。M1.5マイルストーンを追記するとより整理されます。

## English

- `research-memo-builder-p0-design.md` is good enough to become active.
- But it does not fully match the P0 requirements document yet.
- Please update the CLI requirements, error code rules, and implementation acceptance criteria first.
- Updating the proposal is optional. Adding an M1.5 milestone would make it clearer.
