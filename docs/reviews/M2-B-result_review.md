# レビュー結果

結論：**M2-B実装レポートの内容は概ねOK。ただし、ファイル名・frontmatter・`searchLang: jp` の設計/要件反映に修正必須があります。**

## 1. M2-B実装レポート確認

### 判定

| 観点                                      |   判定 | コメント                                                                                              |
| ----------------------------------------- | -----: | ----------------------------------------------------------------------------------------------------- |
| M2-B実装内容が正しく記録されているか      |     OK | `.env` 読み込み、`EnvConfigError`、Brave Search API単一検索、CLI接続、dry-run維持が記録されています。 |
| `searchLang: jp` の知見が記録されているか |     OK | HTTP 422の原因として `search_lang` は `ja` ではなく `jp` が必要、と明記されています。                 |
| M2-B完了判定が明記されているか            |     OK | 8章で完了条件が明記されています。                                                                     |
| M3以降の未対応項目が整理されているか      |     OK | 9章でM3/M4/M5以降に分類されています。                                                                 |
| ファイル実体と指定パスが一致しているか    | **NG** | 指定は `...implementation-report.md` ですが、添付ZIP内の実体は `...implementation-record.md` でした。 |
| frontmatterが妥当か                       | **NG** | `source_documents:` 配下が `*` 箇条書きになっており、YAML frontmatterとしては不正です。               |

## 2. M2-Bレポートの修正必須点

### 修正必須1：ファイル名不一致

ユーザー指定：

```text
docs/implementation/research-memo-builder-m2-b-implementation-report.md
```

添付ZIP内の実体：

```text
docs/implementation/research-memo-builder-m2-b-implementation-record.md
```

ただし、frontmatter内では以下になっていました。

```yaml
file_path: docs/implementation/research-memo-builder-m2-b-implementation-report.md
```

つまり、**中身はreport扱い、実ファイル名はrecord** です。

推奨は、実ファイルを以下へリネームすることです。

```text
docs/implementation/research-memo-builder-m2-b-implementation-record.md
↓
docs/implementation/research-memo-builder-m2-b-implementation-report.md
```

M2-Aが `implementation-record`、M2-Bが `implementation-report` でも運用上は可能ですが、今回はfrontmatterとユーザー指定に合わせて **reportへ統一** がよいです。

### 修正必須2：frontmatterのYAML不正

現在のfrontmatterは概ね以下の形です。

```yaml
source_documents:

* docs/implementation/research-memo-builder-m2-a-implementation-record.md
* docs/requirements/research-memo-builder-p0-requirements.md
* docs/design/research-memo-builder-p0-design.md
```

YAMLでは `*` は箇条書きではなくエイリアス記法として解釈されるため、不正です。

修正案：

```yaml
source_documents:
  - docs/implementation/research-memo-builder-m2-a-implementation-record.md
  - docs/requirements/research-memo-builder-p0-requirements.md
  - docs/design/research-memo-builder-p0-design.md
```

さらに、frontmatter開始直後の空行も不要なので、以下の形が安全です。

```yaml
---
title: Research Memo Builder M2-B 実装レポート
document_id: research-memo-builder-m2-b-implementation-report
status: active
version: 1.0.0
updated: 2026-06-21
project: Research Memo Builder
milestone: M2-B
file_path: docs/implementation/research-memo-builder-m2-b-implementation-report.md
source_documents:
  - docs/implementation/research-memo-builder-m2-a-implementation-record.md
  - docs/requirements/research-memo-builder-p0-requirements.md
  - docs/design/research-memo-builder-p0-design.md
---
```

## 3. `searchLang: jp` 反映確認

### 判定一覧

| ファイル                                                     |         判定 | 確認結果                                                                                                        |
| ------------------------------------------------------------ | -----------: | --------------------------------------------------------------------------------------------------------------- |
| `research/inputs/ats-rule-spec.yaml`                         | **確認不可** | 添付ZIP内に `research/inputs/` がありませんでした。代替として添付ルートの `ats-rule-spec.yaml` は確認済みです。 |
| `/mnt/data/ats-rule-spec.yaml`                               |           OK | `searchLang: jp` になっています。                                                                               |
| `src/input/researchInputSchema.ts`                           |           OK | デフォルトが `jp` になっています。                                                                              |
| `docs/requirements/research-memo-builder-p0-requirements.md` |       **NG** | 入力例、デフォルト表、Brave Search APIパラメータ対応表に `ja` が残っています。                                  |
| `docs/design/research-memo-builder-p0-design.md`             |       **NG** | 入力例、SearchOptions既定値に `ja` が残っています。                                                             |

## 4. 残っている `ja` の修正箇所

### `docs/requirements/research-memo-builder-p0-requirements.md`

修正対象は少なくとも以下です。

```yaml
searchLang: ja
```

を

```yaml
searchLang: jp
```

へ変更。

また、表の以下も変更が必要です。

```markdown
| P0-IN-017 | `search.searchLang` | string | No | `ja` | Brave Search API の `search_lang` に渡す |
```

を

```markdown
| P0-IN-017 | `search.searchLang` | string | No | `jp` | Brave Search API の `search_lang` に渡す |
```

さらに、Brave Search APIパラメータ対応表も変更。

```markdown
| P0-SEA-025 | `search.searchLang` | `search_lang` | 未指定時は `ja` |
```

を

```markdown
| P0-SEA-025 | `search.searchLang` | `search_lang` | 未指定時は `jp` |
```

### `docs/design/research-memo-builder-p0-design.md`

修正対象は少なくとも以下です。

```yaml
searchLang: ja
```

を

```yaml
searchLang: jp
```

へ変更。

SearchOptions既定値表も変更。

```markdown
| `searchLang` | `ja` | P0では文字列として扱う |
```

を

```markdown
| `searchLang` | `jp` | P0では文字列として扱う |
```

## 5. 実装レポート側の扱い

M2-B実装レポート内にある以下の記述は、**修正前/修正後の履歴として書かれているため残してOK** です。

```yaml
searchLang: ja
```

```yaml
searchLang: jp
```

ただし、9.4の「設計・要件への反映確認が必要なもの」は、要件定義書・設計書を修正した後に以下へ更新するとよいです。

```markdown
### 9.4 設計・要件への反映確認

以下の反映を完了した。

- Brave Search APIの `search_lang` では `jp` を使うこと
- `search.searchLang` のデフォルト値を `ja` ではなく `jp` にすること
- `research/inputs/ats-rule-spec.yaml`
- `src/input/researchInputSchema.ts`
- `docs/requirements/research-memo-builder-p0-requirements.md`
- `docs/design/research-memo-builder-p0-design.md`
```

もしくは、修正前の記録として残すなら、以下のように状態を明記した方がよいです。

```markdown
### 9.4 設計・要件への反映確認が必要なもの

本レポート作成時点では、以下の反映確認が未完了である。

- `docs/requirements/research-memo-builder-p0-requirements.md`
- `docs/design/research-memo-builder-p0-design.md`
```

## 6. 総合判定

現時点の判定は以下です。

```text
M2-B実装そのもの：完了扱いでOK
M2-B実装レポート内容：概ねOK
M2-B実装レポート形式：修正必要
searchLang: jp 実装反映：OK
searchLang: jp Activeドキュメント反映：未完了
```

特に重要なのはこの2点です。

1. **要件定義書・設計書の `ja` を `jp` へ修正する**
2. **M2-B実装レポートのファイル名とfrontmatterを整える**

## 次のアクション

1. `docs/requirements/research-memo-builder-p0-requirements.md` の `searchLang: ja` / `` `ja` `` / `未指定時は ja` を `jp` に修正する。
2. `docs/design/research-memo-builder-p0-design.md` も同様に `jp` へ修正する。
3. `docs/implementation/research-memo-builder-m2-b-implementation-record.md` を `...implementation-report.md` にリネームするか、frontmatterをrecordに合わせる。
4. M2-Bレポートfrontmatterの `source_documents` を YAMLとして正しい `-` 箇条書きへ修正する。
5. 修正後に `npm run format:check` または `npm run check` を実行する。

# まとめ / Summary

## 日本語

- M2-B実装レポートの中身は、実装内容・`searchLang: jp` の知見・完了判定・未対応整理ともに概ねOKです。
- ただし、添付ZIPでは指定ファイル名 `implementation-report.md` が存在せず、実体は `implementation-record.md` でした。
- frontmatterの `source_documents` がYAMLとして不正なので修正が必要です。
- `src/input/researchInputSchema.ts` と添付YAMLは `jp` 反映済みです。
- 要件定義書と設計書にはまだ `searchLang: ja` が残っているため、M3へ進む前に修正した方がよいです。

## English

- The M2-B report content is mostly OK.
- It records the implementation, the `searchLang: jp` finding, the completion decision, and the remaining M3+ items.
- But the file name does not match: the ZIP has `implementation-record.md`, not `implementation-report.md`.
- The frontmatter has invalid YAML, so it should be fixed.
- The schema and YAML are updated to `jp`, but the requirements and design docs still contain `ja`.
