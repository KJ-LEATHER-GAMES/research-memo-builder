# Zodとは？

**Zodは、TypeScriptで使う「入力データの検査ツール」です。**
公式には、TypeScript-first なバリデーションライブラリとして説明されています。スキーマを定義し、そのスキーマを使って、文字列・数値・配列・複雑なオブジェクトなどを検証できます。([Zod][1])

もっと噛み砕くと、Zodはこういう役割です。

```text
外から来たデータ
  ↓
本当に期待どおりの形かチェック
  ↓
OKなら、TypeScriptで安全に使えるデータにする
  ↓
NGなら、どこが悪いかエラーにする
```

今回の Research Memo Builder では、**YAMLファイルを読んだあと、その中身が正しいか確認するため**に使います。

---

# なぜZodが必要なのか

TypeScriptには型があります。

たとえば、こういう型を作れます。

```ts
type SearchOptions = {
  countPerQuery: number;
  country: string;
  searchLang: string;
  uiLang: string;
  extraSnippets: boolean;
};
```

これを見ると、

```text
countPerQuery は number
country は string
extraSnippets は boolean
```

と分かります。

ただし、ここに大事な落とし穴があります。

## TypeScriptの型は、実行中には消える

TypeScriptの型は、開発中には助けてくれます。
でも、実行時には基本的に型情報は消えます。

つまり、YAMLからこんなデータが来ても、

```yaml
search:
  countPerQuery: "多め"
  extraSnippets: yes
```

TypeScriptの型だけでは、**実行中に自動で止めてくれるわけではありません**。

そこでZodを使います。

---

# Zodのイメージ

Zodは、入力データに対する**検問所**です。

```text
YAML
  ↓
unknown
  ↓
Zod検査
  ↓
ResolvedResearchInput
```

今回のプロジェクトでは、YAMLを読むと最初は `unknown` として扱います。

```ts
const rawInput: unknown = await loadResearchInputFile(inputPath);
```

この時点では、まだ信用しません。

その後、Zodで検証します。

```ts
const resolvedInput = validateAndResolveResearchInput(rawInput);
```

これにより、

```text
topic は空ではないか
keywords は配列か
platforms は1〜3件か
site は note.com のようなドメイン形式か
countPerQuery は1〜20か
output.json は false か
```

などを確認します。

---

# Zodでやること

Zodで主にやるのは、次の4つです。

| 役割           | 内容                              | 今回の例                          |
| -------------- | --------------------------------- | --------------------------------- |
| 型チェック     | 文字列・数値・boolean・配列か確認 | `topic` は string                 |
| 制約チェック   | 範囲や空文字を確認                | `countPerQuery` は1〜20           |
| デフォルト補完 | 省略時に既定値を入れる            | `searchLang: "ja"`                |
| エラー表示     | どこが悪いか出す                  | `output.json must be false in P0` |

---

# かなり小さい例

たとえば、記事タイトルを検証したいとします。

```ts
import { z } from "zod";

const topicSchema = z.string().min(1);

const result = topicSchema.safeParse(
  "家庭内ルールを書き出したら、仕様書になっていた話",
);

console.log(result.success);
```

これは成功します。

```text
true
```

でも、空文字なら失敗します。

```ts
const result = topicSchema.safeParse("");
```

```text
false
```

Zodでは、まず `z.string()` のように**期待する形**を作ります。
この期待する形を **schema / スキーマ** と呼びます。Zod公式でも、データを検証するには最初に schema を定義すると説明されています。([Zod][2])

---

# スキーマとは？

スキーマは、かなり単純に言うと、

```text
このデータは、こういう形で来てください
```

というルール表です。

たとえば今回の `search` はこうです。

```yaml
search:
  countPerQuery: 10
  country: JP
  searchLang: ja
  uiLang: ja-JP
  extraSnippets: true
```

これをZodで表すと、ざっくりこうなります。

```ts
const searchOptionsSchema = z.object({
  countPerQuery: z.number().int().min(1).max(20).default(10),
  country: z.string().default("JP"),
  searchLang: z.string().default("ja"),
  uiLang: z.string().default("ja-JP"),
  extraSnippets: z.boolean().default(true),
});
```

意味はこうです。

```text
countPerQuery は整数。1以上20以下。なければ10。
country は文字列。なければJP。
searchLang は文字列。なければja。
uiLang は文字列。なければja-JP。
extraSnippets はboolean。なければtrue。
```

---

# parse と safeParse の違い

Zodには、代表的に2つの検証方法があります。

| メソッド      | 失敗時                 | 使いどころ                |
| ------------- | ---------------------- | ------------------------- |
| `parse()`     | 例外を投げる           | 失敗したら即停止したい    |
| `safeParse()` | 結果オブジェクトを返す | 成功/失敗で処理を分けたい |

公式ドキュメントでも、`safeParse` は失敗時に例外を投げず、成功データまたはエラーを含む結果オブジェクトを返す方法として説明されています。([GitHub][3])

今回の実装案では `safeParse()` を使っています。

```ts
const result = researchInputSchema.safeParse(raw);

if (!result.success) {
  // エラー内容を整形して投げる
}

return result.data;
```

この形にすると、エラー表示を自分たちのCLI向けに整形しやすいです。

---

# 今回のプロジェクトでの役割

Research Memo Builderでは、Zodはここに置きます。

```text
src/input/researchInputSchema.ts
```

役割はこれです。

```text
YAMLを読む
  ↓
まだ信用しない unknown
  ↓
Zodで検証
  ↓
ResolvedResearchInput にする
  ↓
検索クエリ生成へ渡す
```

つまり、Zodは **入力境界の門番** です。

---

# Zodがない場合に起きること

Zodなしだと、たとえばYAMLにこう書いても、後続処理まで進んでしまう可能性があります。

```yaml
search:
  countPerQuery: many
```

本来は数値が必要です。

でも、検証が甘いと後で、

```text
APIリクエストを作るところで壊れる
CSV出力のところで壊れる
原因が分かりにくい
```

ということになります。

Zodを使うと、入口で止められます。

```text
Input error
- search.countPerQuery: search.countPerQuery must be a number
```

これはかなり大きいです。
**壊れるなら、入口で壊す。**
これがZod採用の実務的な価値です。

---

# 今回の入力YAMLで見ると

正常な入力はこうです。

```yaml
topic: 家庭内ルールを書き出したら、仕様書になっていた話

articleType:
  devDiary: true
  techArticle: false
  paidNoteCandidate: false

keywords:
  - 家庭内ルール 仕様書
  - 家庭内ルール 要件定義

platforms:
  - name: note
    site: note.com

search:
  countPerQuery: 10

output:
  dir: output/research/ats-rule-spec
  csv: true
  markdownMemo: true
```

Zodは、これを検証して、足りない `search` 項目を補完できます。

```ts
search: {
  countPerQuery: 10,
  country: "JP",
  searchLang: "ja",
  uiLang: "ja-JP",
  extraSnippets: true
}
```

つまり、YAMLには全部書かなくても、プログラム内部では完全な形にできます。

---

# 初学者向けの理解ポイント

## 1. TypeScriptの型だけでは、外部入力は守れない

`.ts` ファイルの中で作った値なら、TypeScriptがかなり守ってくれます。

でも、次のような外部入力は別です。

```text
YAML
JSON
.env
APIレスポンス
ユーザー入力
CSV
```

これらは、TypeScriptの外から来ます。

だから、実行時に検証する必要があります。

---

## 2. Zodは「型」と「検証」を近くに置ける

普通に手書きで検証すると、こうなりがちです。

```ts
if (typeof input.topic !== "string") {
  throw new Error("topic must be string");
}

if (input.topic.trim().length === 0) {
  throw new Error("topic must not be empty");
}
```

項目が増えると、かなりつらいです。

Zodならこう書けます。

```ts
const schema = z.object({
  topic: z.string().trim().min(1),
});
```

短く、読みやすく、ルールがまとまります。

---

## 3. Zodを通った後のデータは安心して使える

Zod検証前：

```ts
rawInput: unknown;
```

Zod検証後：

```ts
resolvedInput: ResolvedResearchInput;
```

この差が重要です。

```text
検証前：何が入っているか分からない
検証後：必要な形になっている
```

---

# 今回の実装でZodがチェックする項目

M2-Aでは、主にこれをチェックします。

| YAML項目               | チェック内容                   |
| ---------------------- | ------------------------------ |
| `topic`                | 文字列、空文字NG               |
| `articleType`          | 3項目がboolean、最低1つtrue    |
| `keywords`             | 1〜5件、各要素は空文字NG       |
| `platforms`            | 1〜3件、site重複NG             |
| `platforms[].site`     | `note.com` 形式のみ、URL形式NG |
| `search.countPerQuery` | 1〜20                          |
| `search.country`       | 省略時 `JP`                    |
| `search.searchLang`    | 省略時 `ja`                    |
| `search.uiLang`        | 省略時 `ja-JP`                 |
| `search.extraSnippets` | 省略時 `true`                  |
| `output.dir`           | 相対パスのみ                   |
| `output.csv`           | P0では `true` のみ             |
| `output.markdownMemo`  | P0では `true` のみ             |
| `output.json`          | P0では `false` のみ            |
| `output.runReport`     | P0では `false` のみ            |
| `output.chatgptPrompt` | P0では `false` のみ            |

---

# たとえるなら

今回のシステム全体を工場に例えると、Zodは**受入検査工程**です。

```text
部品が届く = YAMLを読む
受入検査 = Zodで検証する
合格品だけラインに流す = ResolvedResearchInputにして後続処理へ渡す
不良品は止める = Input errorで終了する
```

受入検査なしで組立ラインに流すと、後工程で原因不明の不具合が出ます。

Zodを入れると、入口でこう言えます。

```text
この入力は使えます
この入力は使えません
使えない理由はここです
```

---

# 今回のプロジェクトでの一言定義

このプロジェクトに限って言えば、Zodはこう定義できます。

> **Zodは、入力YAMLを「信用できない外部データ」から「安全に使えるResolvedResearchInput」へ変換するための検証レイヤー。**

これが一番重要です。

---

# 次のアクション

次は、先ほどの `researchInputSchema.ts` を実装したあと、**わざと壊したYAML**で確認すると理解が一気に深まります。

おすすめはこの3つです。

```text
1. output.json: true にして止まるか見る
2. platforms[].site: https://note.com にして止まるか見る
3. search.countPerQuery: 30 にして止まるか見る
```

---

# まとめ / Summary

## 日本語

- Zodは、TypeScriptで使う入力データ検証ライブラリです。
- TypeScriptの型は実行時には外部入力を守れないため、YAMLやAPIレスポンスには実行時検証が必要です。
- Zodは、入力データが期待どおりの形か確認し、OKなら安全に使えるデータとして返します。
- 今回のResearch Memo Builderでは、YAMLを `ResolvedResearchInput` に変換する門番として使います。
- Zodは「外から来たデータを、後続処理に流してよいか判定する受入検査」と考えると分かりやすいです。

## English

- Zod is a validation library for TypeScript.
- TypeScript types do not fully protect external data at runtime.
- Zod checks if input data has the expected shape.
- If the data is valid, Zod returns safe data for the program.
- In this project, Zod is the gatekeeper that converts YAML input into `ResolvedResearchInput`.

[1]: https://zod.dev/?utm_source=chatgpt.com "Zod: Intro"
[2]: https://zod.dev/api?utm_source=chatgpt.com "Defining schemas | Zod"
[3]: https://v3.zod.dev/?utm_source=chatgpt.com "Zod | Documentation"
