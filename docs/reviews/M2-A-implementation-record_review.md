# implementation-record.md レビュー結果

## 結論

**M2-Aの実装記録としては、概ねOKです。**
このままでも「何を実装し、何を確認し、何が未対応か」は追跡できます。

ただし、**Activeな実装記録として残すなら、軽微な修正を入れてから確定**がよいです。特に重要なのは、`--out` の禁止条件に関する **要件定義書との不整合**です。

---

## 良い点

### 1. M2-Aの範囲が明確

対象マイルストーンが **「入力YAML読み込み + Zod検証 + dry-run」** と明記されており、実装範囲がぶれていません。実装対象ファイルも11ファイル列挙されているため、後から差分追跡しやすいです。

### 2. 実装内容がM2-AのExit条件に合っている

記録されている内容は、M2-Aとして妥当です。

- YAML読み込み
- Zod検証
- `search` 配下のデフォルト補完
- P0対象外出力フラグ検証
- `site:{domain} {keyword}` クエリ生成
- dry-run表示
- `--out` 上書き
- 入力不正時の Exit Code 2

これは設計書上の dry-run仕様、つまり「入力読み込み、バリデーション、デフォルト補完、検索クエリ生成、予定リクエスト数表示、出力予定ディレクトリ表示、API/CSV/Markdownは実行しない」と整合しています。

### 3. 確認結果が残っている

`npm run check`、正常dry-run、`--input`なし、`--out`正常系、`--out`異常系が記録されています。M2-Aの作業ログとして最低限必要な確認は押さえられています。

### 4. 発生エラーと解決策が残っている

TypeScriptの `undefined` 判定、Zodの `.default({})` 型不一致と、その対応方針が記録されています。これは後日note記事化するときにも素材価値が高いです。

---

## 修正した方がよい点

## 1. `--out` の禁止条件が、要件定義書と設計・実装でズレている

ここが一番重要です。

実装記録では、`--out ../tmp` を不正として確認しています。
一方、P0実装設計書では、`--out` の禁止条件は **空文字、絶対パス、`../`** です。

しかし、P0要件定義書側には、`--out` に **`./` を含む場合は入力不正** という記述が残っています。

これは放置しない方がよいです。
理由は、`./output/research/tmp-check` のような相対パスは、通常は安全な相対パスとして扱ってよいからです。

### 推奨判断

`./` は禁止しない。
禁止条件は以下に統一する。

```text
空文字
絶対パス
Windows絶対パス
../ を含むパス
null文字
```

### 修正対象

`docs/research/research-memo-builder-p0-requirements.md` の以下を修正推奨です。

```text
`./` を禁止
```

↓

```text
`../` を禁止
```

---

## 2. 実装記録内に「保存先パス」がない

今回の実装記録はファイル名としては `research-memo-builder-m2-a-implementation-record.md` ですが、本文内に正式配置先が書かれていません。

推奨配置が `docs/implementation/` 配下なら、本文冒頭に以下を追加するとよいです。

```markdown
## 0. 文書情報

- file: docs/implementation/research-memo-builder-m2-a-implementation-record.md
- status: active
- milestone: M2-A
- related:
  - docs/research/research-memo-builder-p0-requirements.md
  - docs/research/research-memo-builder-p0-design.md
```

後でMnemosyne / note素材として再利用するなら、**どの文書が正本か**を追いやすくなります。

---

## 3. dry-run正常系の確認内容が少し粗い

現在は「正常dry-run：Exit Code 0」として記録されています。
ただ、前チャットの引き継ぎでは、正常dry-runで以下まで確認済みでした。

- topic表示
- articleType表示
- search設定表示
- 出力予定ディレクトリ表示
- 予定リクエスト数15表示
- 15件の検索クエリ表示
- Brave Search APIを呼ばない
- CSV/Markdownを出力しない

実装記録にも、ここまで書くと完了判定がかなり強くなります。

### 追記推奨

```markdown
正常dry-runでは、topic、articleType、search設定、出力予定ディレクトリ、予定リクエスト数15、15件の検索クエリが表示されることを確認した。また、Brave Search APIを呼ばず、CSV/Markdownも出力しないことを確認した。
```

---

## 4. 未対応に「M2-Bで扱うもの」と「M3以降で扱うもの」が混在している

未対応欄は正しいですが、M2-B直前の作業判断としては少し粗いです。

現在の未対応：

- `.env` 読み込み
- `BRAVE_API_KEY` 検証
- Brave Search API単一検索
- APIキー未設定時の Exit Code 3
- CSV出力
- Markdown出力

このうち、M2-B対象は前半4つです。CSV/MarkdownはM4/M5寄りです。

### 推奨整理

```markdown
## 7. 未対応

### M2-Bで対応するもの

- .env 読み込み
- BRAVE_API_KEY 検証
- APIキー未設定時の Exit Code 3
- Brave Search API単一検索

### M3以降で対応するもの

- 複数クエリ実行
- 検索結果正規化
- URL完全一致重複排除

### M4以降で対応するもの

- CSV出力

### M5以降で対応するもの

- Markdown出力
```

設計書上も、M2は `.env`、YAML/Zod、dry-run、Brave Search単一検索、APIキー未設定エラーまでが範囲です。

---

## 判定

| 観点               |       判定 | コメント                                   |
| ------------------ | ---------: | ------------------------------------------ |
| M2-A範囲の明確さ   |         OK | 対象マイルストーンと実装対象ファイルが明確 |
| 実装内容の記録     |         OK | 必要な実装要素は記録済み                   |
| 確認コマンド       |         OK | 最低限の確認は残っている                   |
| エラー対応記録     |         OK | TypeScript/Zodの問題と対応が残っている     |
| 未対応整理         | 要軽微修正 | M2-B/M3以降で分類するとよい                |
| 要件・設計との整合 |     要修正 | `--out` の `./` / `../` 不整合を解消すべき |
| Active化可否       | 条件付きOK | `--out` 不整合だけ直せばActive化してよい   |

---

# 次のアクション

1. `implementation-record.md` に文書情報とdry-run詳細確認を追記する。
2. `docs/research/research-memo-builder-p0-requirements.md` の `--out` 禁止条件を `./` ではなく `../` に統一する。
3. その後、M2-Bとして `src/config/env.ts` と `src/adapters/braveSearchClient.ts` の実装に進む。

# まとめ / Summary

## 日本語

- `implementation-record.md` は、M2-A実装記録として概ねOKです。
- 実装対象、確認結果、発生エラー、未対応事項が記録されています。
- ただし、`--out` の禁止条件が要件定義書と設計・実装でズレています。
- `./` 禁止ではなく、`../` 禁止に統一するのがよいです。
- この軽微修正後、M2-Bへ進めます。

## English

- `implementation-record.md` is mostly good as the M2-A implementation record.
- It records target files, test results, errors, and open items.
- But the `--out` rule is not consistent between requirements, design, and implementation.
- It is better to forbid `../`, not `./`.
- After this small fix, you can move to M2-B.
