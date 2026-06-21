# エラー解説

今回のエラーはすべて同じ原因です。

```text
TS2835: Relative import paths need explicit file extensions
```

これは、`tsconfig.json` が `moduleResolution: node16` または `nodenext` 系になっている場合に出るエラーです。

Node.js の ESM では、相対importに拡張子が必要です。
そのため、TypeScriptファイル内でも以下のように書く必要があります。

```ts
import { xxx } from "../domain/searchQuery.js";
```

重要なのは、**`.ts` ではなく `.js` を書く**ことです。

TypeScriptのソースファイルは `.ts` ですが、実行時には `.js` として解決されるため、Node ESM向けのTypeScriptでは `.js` 拡張子をimport文に書きます。

---

# 原因の特定

原因は、今回追加した3ファイルのimport文が、既存プロジェクトのimport方針と揃っていないことです。

既存の `src/cli/research.ts` は以下のように `.js` 付きです。

```ts
import { ResearchExitCode } from "../domain/researchExitCode.js";
```

一方、今回追加したファイルでは以下のように拡張子なしになっていました。

```ts
import type { SearchQuery } from "../domain/searchQuery";
```

この差分が原因です。

## エラー対象

| ファイル                                | 原因                    |
| --------------------------------------- | ----------------------- |
| `src/adapters/braveSearchClient.ts`     | import先に `.js` がない |
| `src/application/runResearchUseCase.ts` | import先に `.js` がない |
| `src/domain/searchExecution.ts`         | import先に `.js` がない |

ロジックの問題ではありません。
**importパス表記だけの問題**です。

---

# 修正案

## 方針

すべての相対importに `.js` を付けます。

---

## 1. `src/domain/searchExecution.ts`

修正前：

```ts
import type { SearchQuery } from "./searchQuery";
```

修正後：

```ts
import type { SearchQuery } from "./searchQuery.js";

export type SearchQueryFailureType =
  | "http_error"
  | "network_error"
  | "invalid_response"
  | "unknown_error";

export type SearchQueryFailure = {
  type: SearchQueryFailureType;
  httpStatus?: number;
  message: string;
};

export type SearchQueryExecutionResult<TItem> =
  | {
      status: "success";
      query: SearchQuery;
      items: TItem[];
      retrievedAt: string;
    }
  | {
      status: "failure";
      query: SearchQuery;
      failure: SearchQueryFailure;
      retrievedAt: string;
    };
```

---

## 2. `src/adapters/braveSearchClient.ts`

import部分を以下に修正してください。

```ts
import type {
  SearchQueryExecutionResult,
  SearchQueryFailure,
} from "../domain/searchExecution.js";
import type { SearchQuery } from "../domain/searchQuery.js";
```

つまり、先頭部分はこうなります。

```ts
import type {
  SearchQueryExecutionResult,
  SearchQueryFailure,
} from "../domain/searchExecution.js";
import type { SearchQuery } from "../domain/searchQuery.js";

const BRAVE_WEB_SEARCH_ENDPOINT =
  "https://api.search.brave.com/res/v1/web/search";
```

---

## 3. `src/application/runResearchUseCase.ts`

import部分を以下に修正してください。

```ts
import { BraveSearchClient } from "../adapters/braveSearchClient.js";
import type { BraveSearchResultItem } from "../adapters/braveSearchClient.js";
import { loadEnvConfig } from "../config/env.js";
import { ResearchExitCode } from "../domain/researchExitCode.js";
import type { ResolvedResearchInput } from "../domain/researchInput.js";
import type { SearchQueryExecutionResult } from "../domain/searchExecution.js";
import { buildSearchQueries } from "../services/searchQueryBuilder.js";
```

---

# 修正後の確認手順

## 1. typecheck

まずは今回のエラーが消えるか確認します。

```bash
npm run typecheck
```

期待結果：

```text
tsc --noEmit
```

エラーなし。

---

## 2. format

```bash
npm run format
```

期待結果：

```text
src/adapters/braveSearchClient.ts
src/application/runResearchUseCase.ts
src/domain/searchExecution.ts
```

が整形され、エラーなし。

---

## 3. check

```bash
npm run check
```

期待結果：

```text
All matched files use Prettier code style!
```

かつ typecheck エラーなし。

---

# 補足：やらない方がいい修正

## `tsconfig.json` を変えるのは非推奨

今回のために `moduleResolution` を変更する必要はありません。

理由は、既存コードがすでに `.js` 付きimportで統一されているためです。
プロジェクト方針に合わせて、今回追加したファイル側を直すのが最小修正です。

## `.ts` 拡張子を付けるのも非推奨

以下は避けてください。

```ts
import type { SearchQuery } from "./searchQuery.ts";
```

今回のプロジェクトでは、既存コードと同じく `.js` 付きimportに統一するのが正解です。

---

# 次のアクション

まず上記3ファイルのimport文だけ修正し、`npm run typecheck` を再実行してください。
次にエラーが残る場合は、そのエラーはimportパス以外の型不整合である可能性が高いので、次のエラー全文を見て `runResearchUseCase.ts` 周辺を調整するのがよいです。

# まとめ / Summary

## 日本語

- 今回のエラー原因は、相対importに `.js` 拡張子がないことです。
- `node16` / `nodenext` のESM設定では、相対importに拡張子が必要です。
- 修正対象は3ファイルです。
- `.ts` ではなく `.js` を付けます。
- `tsconfig.json` は変更しない方がよいです。

## English

- The error is caused by missing `.js` extensions in relative imports.
- With `node16` / `nodenext` ESM settings, relative imports need file extensions.
- Three files need changes.
- Use `.js`, not `.ts`.
- Do not change `tsconfig.json` for this issue.
