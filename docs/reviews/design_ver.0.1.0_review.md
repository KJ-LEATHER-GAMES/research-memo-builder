## おすすめ結論

| 論点                               | おすすめ                    | 判定 |
| ---------------------------------- | --------------------------- | ---- |
| CSVを UTF-8 with BOM で確定するか  | **確定する**                | 採用 |
| `--out` を正式P0仕様に含めるか     | **含める。ただし任意引数**  | 採用 |
| `--dry-run` をP0必須に格上げするか | **格上げする**              | 採用 |
| 入力バリデーション                 | **Zodを使う**               | 採用 |
| HTTPクライアント                   | **Node標準 `fetch` を使う** | 採用 |

P0は、YAML入力、Brave Search API接続、正規化、URL重複排除、CSV/Markdown出力に絞る設計です。企画書上も、P0ではCSVとMarkdownを出し、JSON、run-report、ChatGPT分析プロンプトはP1以降に送る整理になっています。
この前提なら、**依存は最小にしつつ、入力検証だけは強くする**のが最適です。

---

# 1. CSVを UTF-8 with BOM で確定するか

## おすすめ

**UTF-8 with BOM で確定**がよいです。

## 理由

このツールのP0出力である `search-results.csv` は、プログラム連携用というより、まずは人間が開いて確認するための一覧です。しかも検索対象は日本語記事が中心になります。

そのため、P0では以下を優先すべきです。

- Windows / Excelで開いたときに文字化けしにくい
- 日本語タイトル・スニペットをすぐ確認できる
- リサーチ作業で毎回ストレスが少ない

BOMなしUTF-8の方が技術的には素直ですが、CSVをExcelで直接開く運用を考えると、P0ではBOM付きが実用的です。

## デメリット

一部のプログラム処理では、先頭カラム名にBOMが混ざることがあります。

ただし、P0のCSVは人間レビュー用途が主です。将来プログラム処理用には、P1以降の `normalized-results.json` を使えばよいです。企画書でもJSON出力はP1以降に分離されています。

## 決定案

```text
search-results.csv は UTF-8 with BOM で出力する。
```

---

# 2. `--out` を正式P0仕様に含めるか

## おすすめ

**正式P0仕様に含める**のがよいです。

ただし、必須ではなく **任意引数** にします。

## 理由

入力YAMLには `output.dir` がありますが、CLI実行時に出力先だけ変えたいケースは必ず出ます。

例えば、同じ入力ファイルを使って以下を分けたい場合です。

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/test-run
```

`--out` がないと、検証のたびにYAMLを書き換える必要があります。これは地味に面倒です。

Active版企画書でも、CLI仕様案として出力先指定が整理されています。

## 仕様として決めるべきこと

優先順位はこれでよいです。

```text
--out がある場合:
  --out を出力先として使う

--out がない場合:
  YAML の output.dir を使う
```

つまり、CLI引数がYAML設定を一時上書きします。

## 決定案

```text
--out はP0正式仕様に含める。
--out は任意。
指定された場合は YAML の output.dir より優先する。
```

---

# 3. `--dry-run` をP0必須に格上げするか

## おすすめ

**P0必須に格上げ**がよいです。

## 理由

`--dry-run` は実装コストが低い一方で、効果が大きいです。

特にこのツールでは、1キーワード×1媒体＝1リクエストという考え方でAPI使用量を見積もります。企画書でも、5キーワード×3媒体＝15リクエストのようにコスト管理する方針が示されています。

`--dry-run` があると、APIを呼ばずに以下を確認できます。

- 入力YAMLが読めるか
- デフォルト補完が正しいか
- 生成される検索クエリが正しいか
- リクエスト数が何件になるか
- 出力先がどこになるか
- P0対象外フラグが誤って `true` になっていないか

これはBrave APIのコスト抑制だけでなく、誤実行防止にも効きます。

## P0での動作案

```text
--dry-run 指定時:
  - YAMLを読み込む
  - 入力バリデーションを行う
  - デフォルト値を補完する
  - 検索クエリを生成する
  - リクエスト予定数を表示する
  - Brave Search APIは呼ばない
  - CSV/Markdownは出力しない
```

## 決定案

```text
--dry-run はP0必須機能に格上げする。
```

---

# 4. 入力バリデーションを手書きにするか、Zodにするか

## おすすめ

**Zodを使う**のがよいです。

## 理由

P0の入力YAMLは、単純に見えて実はルールが多いです。

例えば、以下があります。

- `topic` は必須
- `keywords` は1件以上
- `platforms` は1件以上
- `search` 配下は省略可
- `search.countPerQuery` は範囲制限が必要
- `output.csv` と `output.markdownMemo` はP0で必要
- `output.json` / `output.runReport` / `output.chatgptPrompt` は `true` なら入力不正
- `platforms[].site` の重複チェックが必要
- デフォルト値補完が必要

これを手書きにすると、バリデーションロジック、型定義、デフォルト補完が分散しやすいです。

ZodはTypeScript-firstのスキーマバリデーションライブラリで、スキーマ定義から型安全なデータを扱えることが公式ドキュメントでも説明されています。([Zod][1]) また、Zodではスキーマを定義し、入力データを検証するという使い方が基本になっています。([Zod][2])

## 使い方の方針

おすすめは、Zodを **入力境界だけ** に使うことです。

```text
YAML
  ↓
unknown
  ↓
Zod schema
  ↓
ResolvedResearchInput
  ↓
UseCase / Service
```

ドメインDTOは普通のTypeScript typeとして定義し、YAML入力の検証だけZodに寄せます。

## 決定案

```text
入力YAMLのバリデーションはZodを使う。
Zod schema で必須/任意/デフォルト値/P0対象外フラグを定義する。
```

## 追加する依存

```bash
npm install zod
```

YAML読み込みには別途これが必要です。

```bash
npm install yaml
```

`js-yaml` でもよいですが、今から作るなら `yaml` の方が型付き実装に寄せやすいです。

---

# 5. HTTPクライアントをNode標準 `fetch` にするか

## おすすめ

**Node標準 `fetch` を使う**のがよいです。

## 理由

P0で必要なのは、Brave Search APIへのシンプルなGETです。

P0では以下をやりません。

- 複雑なリトライ
- キャッシュ
- ページング
- 複数APIの高度な切り替え
- ブラウザ相当の複雑なHTTP制御

そのため、axios等を入れる必要はまだ薄いです。

Node.jsの公式ドキュメントでは、グローバルオブジェクト群はStable扱いで提供されています。([Node.js][3]) また、Node.jsのFetch APIはUndiciによって支えられていると公式Learnにも説明されています。([Node.js][4])

P0では標準 `fetch` で十分です。

## 実装方針

ただし、`fetch` を直接あちこちで呼ぶのは避けます。

`BraveSearchClient` に閉じ込めます。

```ts
src / adapters / braveSearchClient.ts;
```

こうしておけば、将来 axios、Undici直接利用、Tavily、Exaなどに差し替える場合も影響範囲を限定できます。

## 決定案

```text
HTTPクライアントはNode標準 fetch を使う。
fetch は BraveSearchClient 内に閉じ込める。
```

---

# 最終おすすめセット

## 採用案

```text
CSV:
  UTF-8 with BOM

CLI:
  --input 必須
  --out 任意、YAML output.dir より優先
  --dry-run P0必須

Validation:
  Zod採用

HTTP:
  Node標準 fetch 採用
```

## package.json への追加候補

```json
{
  "dependencies": {
    "dotenv": "^16.0.0",
    "yaml": "^2.0.0",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "prettier": "^3.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

バージョンは実装時に `npm install` で実際の最新安定版に合わせればよいです。

---

# 設計書への反映文案

`docs/research/research-memo-builder-p0-design.md` には、以下のように反映するのがよいです。

```md
## 設計決定

### DD-P0-001 CSV文字コード

`search-results.csv` は UTF-8 with BOM で出力する。

理由は、日本語タイトル・スニペットをWindows/Excelで確認する運用を優先するためである。
P0ではCSVを人間レビュー用の成果物として扱い、機械処理用のJSONはP1以降で追加する。

### DD-P0-002 --out

`--out` はP0正式仕様に含める。

`--out` が指定された場合は、入力YAMLの `output.dir` より優先する。
未指定の場合は、入力YAMLの `output.dir` を使用する。

### DD-P0-003 --dry-run

`--dry-run` はP0必須機能とする。

`--dry-run` では、YAML読み込み、入力バリデーション、デフォルト補完、検索クエリ生成、リクエスト予定数表示までを行う。
Brave Search APIは呼び出さず、CSV/Markdownも出力しない。

### DD-P0-004 入力バリデーション

入力YAMLのバリデーションには Zod を採用する。

Zod schema により、必須項目、任意項目、デフォルト値、P0対象外フラグ、配列要素数、数値範囲を定義する。

### DD-P0-005 HTTPクライアント

Brave Search API接続には Node標準 fetch を使用する。

fetch の利用は `src/adapters/braveSearchClient.ts` に閉じ込め、将来のHTTPクライアント差し替えに備える。
```

---

## 次のアクション

次は、上記5点を **設計決定として `research-memo-builder-p0-design.md` に追記**するのがよいです。
その後、M2実装に入るなら最初の実装順は **Zod schema → YAML読み込み → dry-run → env読み込み → fetch接続** が安全です。

## まとめ / Summary

### 日本語

- CSVは **UTF-8 with BOM** で確定がおすすめです。
- `--out` は **P0正式仕様に含める**のがおすすめです。
- `--dry-run` は **P0必須に格上げ**がおすすめです。
- 入力バリデーションは **Zod採用**がおすすめです。
- HTTPクライアントは **Node標準 `fetch` 採用**がおすすめです。

### English

- I recommend **UTF-8 with BOM** for CSV.
- I recommend including **`--out`** in the P0 spec.
- I recommend making **`--dry-run`** required in P0.
- I recommend using **Zod** for input validation.
- I recommend using Node's standard **`fetch`** for HTTP.

[1]: https://zod.dev/?utm_source=chatgpt.com "Zod: Intro"
[2]: https://zod.dev/api?utm_source=chatgpt.com "Defining schemas | Zod"
[3]: https://nodejs.org/api/globals.html?utm_source=chatgpt.com "Global objects | Node.js v25.9.0 Documentation"
[4]: https://nodejs.org/en/learn/getting-started/fetch?utm_source=chatgpt.com "Node.js Fetch"
