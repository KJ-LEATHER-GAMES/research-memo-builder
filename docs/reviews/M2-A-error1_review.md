# 型チェックエラーの整理

今回のエラーは、**フォーマットではなくTypeScriptの静的チェックで止まっています**。
原因は大きく2つです。

| 発生ファイル                             | エラー数 | 主因                                 |
| ---------------------------------- | ---: | ---------------------------------- |
| `src/cli/research.ts`              |   3件 | `undefined` の可能性をTypeScriptが消せていない |
| `src/input/researchInputSchema.ts` |   1件 | Zodの `.default({})` の指定が型的に不正      |

---

# 1. `src/cli/research.ts` のエラー

## エラー1

```text
src/cli/research.ts:104:13 - error TS18048: 'current' is possibly 'undefined'.

104         if (current.startsWith("--")) {
                ~~~~~~~
```

## 原因

対象コードは、おそらくこの部分です。

```ts
const current = argv[index];

switch (current) {
  ...
  default: {
    if (current.startsWith("--")) {
      ...
    }
  }
}
```

`argv` は `string[]` ですが、`argv[index]` は TypeScript上では **`string | undefined`** と見なされることがあります。

特に `noUncheckedIndexedAccess` が有効、またはそれに近い厳しめの設定だと、

```ts
argv[index]
```

は、

```ts
string | undefined
```

になります。

つまりTypeScriptはこう考えています。

```text
index が範囲外だったら undefined かもしれない
undefined に startsWith は使えない
```

人間から見ると `for (let index = 0; index < argv.length; index += 1)` なので安全に見えます。
でもTypeScriptは、配列アクセスとループ条件をそこまで強く関連づけてくれません。

---

## 解決策

`current` を取り出した直後に、`undefined` を弾きます。

```ts
const current = argv[index];

if (current === undefined) {
  throw new CliArgumentError("Unexpected missing CLI argument");
}
```

---

# 2. `inputPath` のエラー

## エラー2

```text
src/cli/research.ts:196:48 - error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.

196   const rawInput = await loadResearchInputFile(inputPath);
                                                   ~~~~~~~~~
```

## エラー3

```text
src/cli/research.ts:210:21 - error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.

210   printDryRunResult(inputPath, resolvedInputWithOutputOverride, queries);
                        ~~~~~~~~~
```

## 原因

`ResearchCliArgs` の型では、`input` は任意です。

```ts
type ResearchCliArgs = {
  input?: string;
  out?: string;
  dryRun: boolean;
  help: boolean;
};
```

そのため、ここで

```ts
const inputPath = cliArgs.input;
```

とすると、TypeScript上の型はこうなります。

```ts
string | undefined
```

`parseCliArgs()` の中で `--input` 必須チェックをしていても、TypeScriptはそれを `run()` 側では理解できません。

つまりTypeScriptから見ると、

```text
cliArgs.input は undefined かもしれない
loadResearchInputFile は string を要求している
だから危険
```

という判定です。

---

## 解決策

`run()` の中でも、明示的に `inputPath` をチェックします。

```ts
const inputPath = cliArgs.input;

if (!inputPath) {
  throw new CliArgumentError("--input is required");
}
```

これは実行上は重複チェックですが、TypeScriptに対して、

```text
ここから下の inputPath は string です
```

と伝える効果があります。

---

# 3. `src/input/researchInputSchema.ts` のZodエラー

## エラー4

```text
src/input/researchInputSchema.ts:95:12 - error TS2769: No overload matches this call.

95   .default({});
              ~~
```

## 原因

対象はこの部分です。

```ts
const searchOptionsSchema = z
  .object({
    countPerQuery: z.number().int().min(1).max(20).default(10),
    country: nonEmptyTrimmedString.default("JP"),
    searchLang: nonEmptyTrimmedString.default("ja"),
    uiLang: nonEmptyTrimmedString.default("ja-JP"),
    extraSnippets: z.boolean().default(true),
  })
  .strict()
  .default({});
```

やりたいことは正しいです。

```text
search が省略されたら {}
↓
中の各項目 default を適用
↓
countPerQuery: 10 などを補完
```

ただし、Zodの `.default({})` は、型的には **最終的な出力型に合う値**を求めます。

このschemaの出力型はこれです。

```ts
{
  countPerQuery: number;
  country: string;
  searchLang: string;
  uiLang: string;
  extraSnippets: boolean;
}
```

でも指定しているdefaultはこれです。

```ts
{}
```

つまりTypeScriptから見ると、

```text
{} には countPerQuery, country, searchLang, uiLang, extraSnippets がない
だから default 値として不正
```

ということです。

---

## 解決策

`.default({})` ではなく、**前処理で undefined を `{}` に変換してから object schema に渡す**形にします。

使うのは `z.preprocess()` です。

```ts
const searchOptionsSchema = z.preprocess(
  (value) => value ?? {},
  searchOptionsBodySchema,
);
```

これなら流れはこうなります。

```text
search が undefined
  ↓
z.preprocess で {}
  ↓
object schema に渡す
  ↓
各項目の default が効く
  ↓
完全な search options になる
```

---

# 修正案1：`src/cli/research.ts`

`parseCliArgs()` の冒頭ループ内を修正します。

## 修正前

```ts
for (let index = 0; index < argv.length; index += 1) {
  const current = argv[index];

  switch (current) {
```

## 修正後

```ts
for (let index = 0; index < argv.length; index += 1) {
  const current = argv[index];

  if (current === undefined) {
    throw new CliArgumentError("Unexpected missing CLI argument");
  }

  switch (current) {
```

---

次に `run()` の中を修正します。

## 修正前

```ts
const inputPath = cliArgs.input;
const rawInput = await loadResearchInputFile(inputPath);
const resolvedInput = validateAndResolveResearchInput(rawInput);
```

## 修正後

```ts
const inputPath = cliArgs.input;

if (!inputPath) {
  throw new CliArgumentError("--input is required");
}

const rawInput = await loadResearchInputFile(inputPath);
const resolvedInput = validateAndResolveResearchInput(rawInput);
```

これで `inputPath` は `string` として扱われます。

---

# 修正案2：`src/input/researchInputSchema.ts`

`searchOptionsSchema` だけ差し替えてください。

## 修正前

```ts
const searchOptionsSchema = z
  .object({
    countPerQuery: z
      .number({
        error: "search.countPerQuery must be a number",
      })
      .int("search.countPerQuery must be an integer")
      .min(1, "search.countPerQuery must be at least 1")
      .max(20, "search.countPerQuery must be 20 or less")
      .default(10),
    country: nonEmptyTrimmedString.default("JP"),
    searchLang: nonEmptyTrimmedString.default("ja"),
    uiLang: nonEmptyTrimmedString.default("ja-JP"),
    extraSnippets: z
      .boolean({
        error: "search.extraSnippets must be boolean",
      })
      .default(true),
  })
  .strict()
  .default({});
```

## 修正後

```ts
const searchOptionsBodySchema = z
  .object({
    countPerQuery: z
      .number({
        error: "search.countPerQuery must be a number",
      })
      .int("search.countPerQuery must be an integer")
      .min(1, "search.countPerQuery must be at least 1")
      .max(20, "search.countPerQuery must be 20 or less")
      .default(10),
    country: nonEmptyTrimmedString.default("JP"),
    searchLang: nonEmptyTrimmedString.default("ja"),
    uiLang: nonEmptyTrimmedString.default("ja-JP"),
    extraSnippets: z
      .boolean({
        error: "search.extraSnippets must be boolean",
      })
      .default(true),
  })
  .strict();

const searchOptionsSchema = z.preprocess(
  (value) => value ?? {},
  searchOptionsBodySchema,
);
```

---

# なぜこの修正がよいか

## `search` 省略時

入力YAMLに `search` がない場合。

```yaml
topic: 家庭内ルールを書き出したら、仕様書になっていた話
```

処理はこうなります。

```text
search: undefined
↓
z.preprocess で {}
↓
countPerQuery default 10
country default JP
searchLang default ja
uiLang default ja-JP
extraSnippets default true
```

結果として内部値はこうなります。

```ts
search: {
  countPerQuery: 10,
  country: "JP",
  searchLang: "ja",
  uiLang: "ja-JP",
  extraSnippets: true,
}
```

## `search` 一部指定時

```yaml
search:
  countPerQuery: 5
```

結果はこうなります。

```ts
search: {
  countPerQuery: 5,
  country: "JP",
  searchLang: "ja",
  uiLang: "ja-JP",
  extraSnippets: true,
}
```

つまり、P0要件の「`search` 配下は任意＋デフォルト補完」に合います。

---

# 修正後に実行するコマンド

```bash
npm run format
npm run typecheck
npm run check
```

その後、dry-run確認です。

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml --dry-run
```

---

# 期待結果

型チェックは通るはずです。

```text
> tsc --noEmit
```

エラーなし。

dry-runでは、以下が出ればOKです。

```text
Research Memo Builder dry-run completed.

Planned requests
  15

Generated queries
  1. [note] site:note.com ...
```

---

# 追加で確認したいポイント

型チェックが通ったあと、次の3つを確認するとM2-Aとして強いです。

## 1. `--input` なし

```bash
npm run research -- --dry-run
```

期待：

```text
Input error
--input is required
```

## 2. `search` を丸ごと消す

`research/inputs/ats-rule-spec.yaml` から `search:` を一時的に削除します。

期待：

```text
countPerQuery: 10
country: JP
searchLang: ja
uiLang: ja-JP
extraSnippets: true
```

## 3. `output.json: true`

期待：

```text
Input error
- output.json: output.json must be false in P0
```

---

# 次のアクション

まずは上記2箇所を修正して、以下を実行してください。

```bash
npm run format
npm run typecheck
npm run research -- --input research/inputs/ats-rule-spec.yaml --dry-run
```

型チェックが通ったら、次は **dry-run出力内容のレビュー**に進めます。

---

# まとめ / Summary

## 日本語

* 今回のエラーは実質2種類です。
* `src/cli/research.ts` は、TypeScriptが `undefined` の可能性を消せていないことが原因です。
* `current === undefined` と `!inputPath` の明示チェックを追加すれば解消できます。
* `src/input/researchInputSchema.ts` は、Zodの `.default({})` が最終出力型と合っていないことが原因です。
* `z.preprocess((value) => value ?? {}, schema)` に変えるのが安全です。

## English

* There are two main causes.
* In `src/cli/research.ts`, TypeScript still sees some values as possibly `undefined`.
* Add explicit checks for `current` and `inputPath`.
* In `researchInputSchema.ts`, `.default({})` does not match the final Zod output type.
* Use `z.preprocess((value) => value ?? {}, schema)` to fix it.
