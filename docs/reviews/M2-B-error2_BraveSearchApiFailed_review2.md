はい。**原因は `search_lang` に渡している値が `ja` になっていること**です。

ただし、整理するとこうです。

```text
YAML上の項目名: searchLang
Brave APIに送るパラメータ名: search_lang
Brave APIに送る値: jp
```

つまり、**`searchLang` というYAML項目名を `search_lang` に変える必要はありません。**
修正すべきなのは、まず **値** です。

---

# 今回のエラー原因

Brave APIのレスポンスに答えが出ています。

```json
"loc":["query","search_lang"]
"msg":"Input should be ... 'jp' ..."
```

これは、Brave APIが

```text
search_lang=ja
```

を受け付けず、

```text
search_lang=jp
```

を期待している、という意味です。

Brave Search APIの `search_lang` は enum パラメータで、検索言語コードの許可値リストから選ぶ必要があります。APIリファレンス上も `search_lang` は検索結果の言語指定パラメータとして定義されています。([Brave][1])

---

# 修正対象

## 1. `research/inputs/ats-rule-spec.yaml`

修正前：

```yaml
search:
  countPerQuery: 10
  country: JP
  searchLang: ja
  uiLang: ja-JP
  extraSnippets: true
```

修正後：

```yaml
search:
  countPerQuery: 10
  country: JP
  searchLang: jp
  uiLang: ja-JP
  extraSnippets: true
```

---

# 追加で確認した方がよい点

次に `searchLang: jp` に直すと、次は `ui_lang` で422が出る可能性があります。

理由は、`ui_lang` も enum だからです。Brave APIの `ui_lang` もクエリパラメータとして定義されています。([Brave][1])

もし次にこう出たら、

```json
"loc":["query","ui_lang"]
```

その場合は `uiLang` の値もBrave APIの許可値に合わせます。

候補としては、まず以下を試すのがよいです。

```yaml
uiLang: jp
```

または、`ui_lang` を一時的に送らない設計にして、APIデフォルトに任せるのも手です。

---

# 設計上の判断

## YAML項目名は `searchLang` のままでOK

理由は、内部DTOではTypeScriptらしく camelCase にして、API送信時だけ snake_case に変換する設計が自然だからです。

```ts
resolvedInput.search.searchLang;
```

↓

```ts
url.searchParams.set("search_lang", query.searchLang);
```

これは今の実装方針で正しいです。

## 修正すべきはデフォルト値

要件定義・設計・Zodデフォルト補完で、`searchLang` の既定値を `ja` としている場合は、Brave API仕様に合わせて `jp` に修正する必要があります。

修正対象候補：

```text
research/inputs/ats-rule-spec.yaml
src/input/researchInputSchema.ts
docs/requirements/research-memo-builder-p0-requirements.md
docs/design/research-memo-builder-p0-design.md
docs/implementation/research-memo-builder-m2-a-implementation-record.md
```

---

# 最小修正案

まず動作確認だけなら、`research/inputs/ats-rule-spec.yaml` だけを直します。

```yaml
search:
  countPerQuery: 10
  country: JP
  searchLang: jp
  uiLang: ja-JP
  extraSnippets: true
```

その後、実行します。

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml
```

---

# 恒久修正案

`src/input/researchInputSchema.ts` のデフォルトも修正します。

修正前の想定：

```ts
searchLang: z.string().default("jp"),
```

修正後：

```ts
searchLang: z.string().default("jp"),
```

さらに、可能なら `searchLang` の許可値をP0では最低限以下に制限してもよいです。

```ts
searchLang: z.enum(["jp", "en"]).default("jp"),
```

ただし、P0では多言語対応を広げないなら、まずは `z.string().default("jp")` で十分です。

---

# 検証手順

## 1. YAMLを修正

```yaml
search:
  countPerQuery: 10
  country: JP
  searchLang: jp
  uiLang: ja-JP
  extraSnippets: true
```

## 2. typecheck / format / check

```bash
npm run typecheck
npm run format
npm run check
```

## 3. dry-run確認

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml --dry-run
```

期待：

```text
searchLang: jp
```

## 4. 通常実行

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml
```

成功すれば：

```text
M2-B single search completed.

Search execution
  Generated query count: 15
  Executed query count: 1
  First query: site:note.com 家庭内ルール 仕様書
  Retrieved item count: 0〜10

CSV/Markdown output is skipped in M2-B.
```

もし次に `ui_lang` で422が出たら、`uiLang` の値も修正対象です。

---

# 次のアクション

まず `searchLang: ja` を `searchLang: jp` に変更して再実行してください。次のエラーが `ui_lang` なら、`uiLang` もBrave APIの許可値に合わせて修正します。

# まとめ / Summary

## 日本語

- YAML項目名は `searchLang` のままでOKです。
- Brave APIに送るパラメータ名は `search_lang` でOKです。
- 問題は値が `ja` になっていることです。
- Brave APIは `search_lang=jp` を期待しています。
- まず `searchLang: ja` を `searchLang: jp` に直してください。

## English

- The YAML key can stay as `searchLang`.
- The API parameter name should be `search_lang`.
- The problem is the value `ja`.
- Brave API expects `search_lang=jp`.
- First, change `searchLang: ja` to `searchLang: jp`.

[1]: https://api-dashboard.search.brave.com/api-reference/news/news_search/get?utm_source=chatgpt.com "News search - API Reference"
