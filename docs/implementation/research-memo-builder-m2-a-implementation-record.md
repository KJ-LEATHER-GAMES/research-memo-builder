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

| 確認 | コマンド | 結果 |
|---|---|---|
| format/check | npm run check | OK |
| inputなし | npm run research -- --dry-run | Exit Code 2 |
| 正常dry-run | npm run research -- --input research/inputs/ats-rule-spec.yaml --dry-run | Exit Code 0 |
| --out上書き | npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/tmp-check --dry-run | OK |
| --out不正 | npm run research -- --input research/inputs/ats-rule-spec.yaml --out ../tmp --dry-run | Input error |

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