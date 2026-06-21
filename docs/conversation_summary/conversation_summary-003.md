# 引き継ぎまとめ

## 実施内容

- Research Memo Builder の **M1：プロジェクト雛形作成** を実施した。
- 以下のファイル一式を作成した。

  - `package.json`
  - `tsconfig.json`
  - `.env.example`
  - `.gitignore`
  - `src/cli/research.ts`
  - `research/inputs/ats-rule-spec.yaml`
  - `docs/research/research-memo-builder-p0-requirements.md`

- `package.json` に最低限の npm scripts を定義した。

  - `research`
  - `typecheck`
  - `format`
  - `format:check`
  - `check`

- `src/cli/research.ts` はM1時点のCLI雛形として作成した。

  - `--input`
  - `--out`
  - `--dry-run`
  - `--help`
  - 入力ファイル存在チェック
  - M2以降の実装入口になるログ出力

- M1完了後、次に進む工程として **M1.5：P0実装設計** を提案した。
- `docs/research/research-memo-builder-p0-design.md` のドラフトを作成した。
- 設計ドラフトでは、以下の6項目を具体化した。

  - 入力YAML型
  - DTO
  - CLI引数
  - 出力ファイル構成
  - エラーコード
  - ディレクトリ構成

- `research-memo-builder-p0-design.md` のレビューを行い、以下5点の設計判断を検討した。

  - CSVを UTF-8 with BOM で確定するか
  - `--out` を正式P0仕様に含めるか
  - `--dry-run` をP0必須に格上げするか
  - 入力バリデーションを手書きにするか、Zodにするか
  - HTTPクライアントをNode標準 `fetch` にするか

- 上記5点について、理由付きで推奨方針を提示した。
- その後、上記5点を `research-memo-builder-p0-design.md` に **設計決定** として追記した。

  - `DD-P0-001 CSV文字コード`
  - `DD-P0-002 --out`
  - `DD-P0-003 --dry-run`
  - `DD-P0-004 入力バリデーション`
  - `DD-P0-005 HTTPクライアント`

- `research-memo-builder-p0-design.md` のActive化前レビューを実施した。
- Active化前レビューでは、設計書そのものはActive化できる水準と判断した。
- ただし、P0要件定義書側に以下の不整合があると指摘した。

  - `--out` の扱いが設計書と要件定義書で異なる
  - `--dry-run` の扱いが設計書と要件定義書で異なる
  - exit code体系が設計書と要件定義書で異なる
  - P0実装受け入れ条件に `--out` / `--dry-run` / exit codeが不足している

- 修正提案として、P0要件定義書の以下の更新案を提示した。

  - `12. CLI要件` の更新
  - `10. エラー処理要件` のexit code体系更新
  - `14. P0実装受け入れ条件` への追加

- 設計書側の修正提案として、以下を提示した。

  - frontmatterを `status: active` / `version: 1.0.0` に変更
  - 「残未決事項」を「P0実装方針」として決定済みにする

- ユーザーにより、上記修正を要件定義書と設計書に反映し、Active化したと報告された。
- Active化後の次アクションとして、**M2：入力・環境・単一検索** に進む方針を提案した。
- M2は一気に進めず、以下の2段階に分ける方針を提案した。

  - `M2-A：入力YAML読み込み + Zod検証 + dry-run`
  - `M2-B：.env読み込み + Brave Search API単一検索`

## 決定事項

- M1完了後の次工程は、いきなりAPI接続ではなく **M1.5：P0実装設計** として整理する。
- `docs/research/research-memo-builder-p0-design.md` をP0実装設計書として作成する。
- P0実装設計書では、以下6項目を具体化する。

  - 入力YAML型
  - DTO
  - CLI引数
  - 出力ファイル構成
  - エラーコード
  - ディレクトリ構成

- CSV出力は **UTF-8 with BOM** とする。

  - 理由：日本語タイトル・スニペットをWindows / Excelで確認しやすくするため。

- `--out` はP0正式仕様に含める。

  - ただしCLI引数としては任意。
  - 指定時は入力YAMLの `output.dir` より優先する。

- `--dry-run` はP0必須機能に格上げする。

  - ただし毎回指定必須という意味ではなく、P0実装範囲として必ず実装するという意味。
  - `--dry-run` 指定時はBrave Search APIを呼ばない。
  - `--dry-run` 指定時はCSV/Markdownを出力しない。
  - 入力検証、デフォルト補完、検索クエリ生成、予定リクエスト数表示まで行う。

- 入力バリデーションには **Zod** を採用する。

  - YAMLパース後の `unknown` を `ResolvedResearchInput` に変換する境界で使用する。

- YAML読み込みには `yaml` パッケージを使用する方針とした。
- HTTPクライアントには **Node標準 `fetch`** を採用する。

  - `fetch` の使用箇所は `src/adapters/braveSearchClient.ts` に閉じ込める。

- P0ではJSON出力、run-report出力、ChatGPT分析プロンプト出力は行わない。

  - `output.json`
  - `output.runReport`
  - `output.chatgptPrompt`
  - これらが `true` の場合は入力不正として停止する。

- P0では検索結果URLへの追加HTTPアクセスは行わない。
- P0ではnote非公式API、note本文スクレイピング、有料部分取得は行わない。
- P0ではURL完全一致のみを重複判定対象とする。
- P0では高度なURL正規化、タイトル類似判定は行わない。
- P0の出力ファイルは以下に限定する。

  - `search-results.csv`
  - `research-memo.md`

- P0の次の実装工程は、まず **M2-A：入力YAML読み込み + Zod検証 + dry-run** から始める。
- Brave Search API接続は、その後の **M2-B：.env読み込み + Brave Search API単一検索** として分ける。

## 未解決事項

- 実ファイル上で、Active化後の `docs/research/research-memo-builder-p0-requirements.md` と `docs/research/research-memo-builder-p0-design.md` の最終内容はこのチャットでは再レビュー未実施。

  - ユーザーから反映・Active化済みと報告あり。
  - 次チャットで必要なら再確認する。

- npmプロジェクトとして実際に `npm init`、依存追加、`npm install` を行ったかは未確認。
- `package.json` が実プロジェクト上で最新方針に一致しているかは未確認。
- `yaml` / `zod` / `dotenv` がまだインストール済みかは未確認。
- TypeScript設定がM2実装に十分かは未確認。
- `src/cli/research.ts` はM1雛形段階であり、M2-A実装は未着手。
- 以下のM2-A対象ファイルは未実装、または未確認。

  - `src/domain/researchInput.ts`
  - `src/domain/searchPlatform.ts`
  - `src/domain/searchOptions.ts`
  - `src/domain/outputOptions.ts`
  - `src/domain/searchQuery.ts`
  - `src/domain/researchExitCode.ts`
  - `src/input/researchInputSchema.ts`
  - `src/input/researchInputLoader.ts`
  - `src/services/searchQueryBuilder.ts`
  - `src/utils/safePath.ts`
  - `src/cli/research.ts`

- CLI引数パーサーを自前実装する方針は提案済みだが、実装は未着手。
- CSV生成を自前実装する方針は提案済みだが、実装は未着手。
- Brave Search APIへの実接続は未実施。
- `.env` の `BRAVE_API_KEY` 読み込み実装は未実施。
- `src/config/env.ts` は未実装。
- `src/adapters/braveSearchClient.ts` は未実装。
- `src/application/runResearchUseCase.ts` は未実装。
- M3以降の複数検索、正規化、重複排除、CSV出力、Markdown出力は未着手。
- テスト方針は未整理。

  - 単体テストを導入するか
  - fixtureをどの形式で置くか
  - dry-runの確認をテスト対象にするか
  - 要確認

## 次アクション

### P0：最初にやること

- **npmプロジェクトの初期化を行う。**

  - 既に `package.json` がある場合は、内容を確認して不足分を補正する。
  - まだ未初期化なら以下を実行する。

```bash
npm init -y
```

- TypeScript / 実行環境 / フォーマット / 入力検証に必要な依存を追加する。

```bash
npm install yaml zod dotenv
npm install -D typescript tsx prettier @types/node
```

- `package.json` の scripts を確認・修正する。

```json
{
  "scripts": {
    "research": "tsx src/cli/research.ts",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.ts\" \"research/**/*.yaml\" \"docs/**/*.md\" \"*.json\"",
    "format:check": "prettier --check \"src/**/*.ts\" \"research/**/*.yaml\" \"docs/**/*.md\" \"*.json\"",
    "check": "npm run typecheck && npm run format:check"
  }
}
```

### P1：M2-A実装に着手

- **M2-A：入力YAML読み込み + Zod検証 + dry-run** を実装する。
- 最初に見るべき正本ドキュメントは以下。

  - `docs/research/research-memo-builder-p0-requirements.md`
  - `docs/research/research-memo-builder-p0-design.md`
  - `research/inputs/ats-rule-spec.yaml`

- M2-Aで作成・修正するファイル候補は以下。

```text
package.json
src/domain/researchInput.ts
src/domain/searchPlatform.ts
src/domain/searchOptions.ts
src/domain/outputOptions.ts
src/domain/searchQuery.ts
src/domain/researchExitCode.ts
src/input/researchInputSchema.ts
src/input/researchInputLoader.ts
src/services/searchQueryBuilder.ts
src/utils/safePath.ts
src/cli/research.ts
```

- M2-Aの実装順は以下がよい。

  1. `src/domain/*` の型定義を作る
  2. `src/domain/researchExitCode.ts` を作る
  3. `src/input/researchInputSchema.ts` にZod schemaを作る
  4. `src/input/researchInputLoader.ts` でYAML読み込みを作る
  5. `src/services/searchQueryBuilder.ts` で検索クエリ生成を作る
  6. `src/utils/safePath.ts` で出力パス検証を作る
  7. `src/cli/research.ts` に `--dry-run` 実行フローを接続する
  8. `npm run typecheck` で型確認する
  9. `npm run research -- --input research/inputs/ats-rule-spec.yaml --dry-run` で確認する

### P2：M2-AのExit条件

- 以下のコマンドで、Brave Search APIを呼ばずにdry-runできること。

```bash
npm run research -- --input research/inputs/ats-rule-spec.yaml --dry-run
```

- 期待する確認内容は以下。

  - YAMLを読める
  - Zodで入力検証できる
  - `search` 配下のデフォルト補完ができる
  - P0対象外フラグ `true` を弾ける
  - `platforms × keywords` で検索クエリを生成できる
  - 予定リクエスト数を表示できる
  - 出力予定ディレクトリを表示できる
  - APIを呼ばない
  - CSV/Markdownを出力しない

### P3：M2-Bへ進む

- M2-Aが通ったら、**M2-B：.env読み込み + Brave Search API単一検索** に進む。
- 作成・修正候補は以下。

  - `src/config/env.ts`
  - `src/adapters/braveSearchClient.ts`
  - `src/domain/searchExecution.ts`
  - `src/application/runResearchUseCase.ts`
  - `src/cli/research.ts`

- M2-BのExit条件は以下。

  - `.env` の `BRAVE_API_KEY` を読める
  - APIキー未設定時に `CONFIG_ERROR` で停止する
  - APIキー値を標準出力・標準エラーに表示しない
  - 1キーワード×1媒体のBrave Search API検索ができる
  - 最初の1クエリの取得件数を標準出力で確認できる

## 気づき

- ドキュメントをActive化する前に、要件定義書と設計書の整合を取ることが重要だった。
- 特に `--out`、`--dry-run`、exit code のような実装に直結する仕様は、要件定義書と設計書でズレやすい。
- P0実装に入る前に、M1.5として設計書を作ったことで、M2以降の実装タスクに落とし込みやすくなった。
- `RawResearchInput` と `ResolvedResearchInput` を分ける設計は有効。

  - YAMLから読んだ値をそのまま信用しない。
  - Zodで検証・補完してから実行用DTOにする。

- `--dry-run` を先に作ることで、APIコストを発生させずに入力と検索クエリ生成を確認できる。
- API接続前に入力検証とクエリ生成を安定させると、不具合切り分けがしやすくなる。
- P0では依存を増やしすぎず、入力検証だけZodに寄せる方針が現実的。
- HTTPクライアントをNode標準 `fetch` にし、`BraveSearchClient` に閉じ込める方針は、将来差し替えに強い。
- CSVは技術的な理想より、実際に人間がExcelで見る運用を優先してBOM付きにした。
- 「P0でやらないこと」を明確にしたことで、実装範囲が広がりすぎるのを防げた。
- note非公式APIや本文スクレイピングを避け、Brave Search APIレスポンスだけ使う方針は、安全性と継続性の両面で有効。

## 記事にできそうな切り口

### 開発日記向き

- 「いきなり実装しない」個人開発の進め方

  - M1雛形後にM1.5設計を挟んだ話

- API接続の前にdry-runを作る判断

  - コストを発生させずに安心して試す工夫

- 仕様がズレる瞬間

  - 要件定義書では任意だった `--dry-run` を、設計で必須に格上げした話

- Excelで見るCSVを前提に、UTF-8 with BOMを選んだ話

  - 技術的な理想と日常運用のバランス

- 「やらないこと」を決めると個人開発が進みやすくなる

  - JSON、run-report、ChatGPTプロンプトをP1に送った判断

- note記事リサーチを自動化したくなった背景

  - 投稿前の検索・比較・整理が地味に重いという課題

- 自分用ツールを作るときに、なぜCLIから始めるのか
- 安全寄りに設計する個人開発

  - note非公式APIやスクレイピングを避けた判断

### 技術記事向き

- TypeScript CLIのP0設計テンプレート

  - 入力YAML、DTO、CLI引数、出力、exit code、ディレクトリ構成

- `RawResearchInput` と `ResolvedResearchInput` を分ける設計
- ZodでYAML入力を検証・デフォルト補完する設計
- CLIツールにおける `--dry-run` 設計
- Node標準 `fetch` をAdapterに閉じ込める設計
- `SearchQuery` DTOの設計

  - `site:{domain} {keyword}` の生成
  - `platforms × keywords` のクエリ展開

- P0 exit code設計

  - `0/1/2/3/4/5/9` の分類

- CSV出力仕様の設計

  - BOM
  - 固定列
  - 0件時ヘッダー
  - エスケープ

- MarkdownリサーチメモRendererの設計
- CLI / UseCase / Adapter / Service / Renderer / Repository の責務分離
- P0/P1/P2で段階的に機能を分ける設計
- APIキー漏洩防止の実装設計
- 検索結果URLへHTTPアクセスしないSafety設計

### 有料note / テンプレート化候補

- TypeScript CLI要件定義テンプレート

  - Scope
  - Input
  - Search
  - Output
  - Error
  - Safety
  - Acceptance

- P0実装設計テンプレート

  - 入力YAML型
  - DTO
  - CLI引数
  - 出力ファイル構成
  - エラーコード
  - ディレクトリ構成

- CLI設計決定チェックリスト

  - `--input`
  - `--out`
  - `--dry-run`
  - `--help`
  - 対象外引数

- API連携前チェックリスト

  - `.env`
  - APIキー漏洩防止
  - dry-run
  - 予定リクエスト数表示
  - 入力検証

- Zod入力バリデーション設計テンプレート
- YAML入力設計テンプレート
- exit code設計テンプレート
- CSV出力仕様テンプレート
- Markdown出力仕様テンプレート
- P0/P1/P2スコープ分離テンプレート
- Active化前レビュー用チェックリスト

  - 要件定義書と設計書の整合
  - CLI仕様の整合
  - exit codeの整合
  - 受け入れ条件の整合

- 個人開発向け「実装前に決めること」チェックリスト
- note記事リサーチ自動化ワークフローのテンプレート

## まとめ / Summary

### 日本語

- この会話では、Research Memo Builder のM1雛形作成後、M1.5としてP0実装設計を作成・レビューしました。
- 設計書では、入力YAML型、DTO、CLI引数、出力ファイル構成、エラーコード、ディレクトリ構成を具体化しました。
- `--out`、`--dry-run`、Zod、Node標準 `fetch`、CSV BOMなどの設計判断を決定しました。
- 次のチャットでは、最初に npmプロジェクトを初期化し、その後 M2-A：入力YAML読み込み + Zod検証 + dry-run に進むのがよいです。

### English

- In this chat, we moved from the M1 scaffold to the M1.5 P0 implementation design.
- The design defined the input YAML type, DTOs, CLI options, output files, error codes, and directory structure.
- We decided on `--out`, `--dry-run`, Zod, Node standard `fetch`, and CSV with BOM.
- In the next chat, start with npm project initialization, then move to M2-A: YAML loading, Zod validation, and dry-run.
