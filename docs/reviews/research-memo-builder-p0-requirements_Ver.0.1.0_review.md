# 最終チェック結果

## 判定

**判定：Active化未完了。M1着手前に修正が必要です。**

確認した `docs/research/research-memo-builder-p0-requirements.md` は、内容上まだドラフト版です。
Active版企画書では、P0要件定義書は `docs/research/research-memo-builder-p0-requirements.md` として切り出し、入力・検索・正規化・出力・エラー処理・APIキー管理・受け入れ条件を扱う位置づけになっています。

ただし、今回確認したファイルでは、前回レビューで指摘したP0/P1修正が一部反映されていません。

---

# 1. ブロッカー

## 1.1 frontmatterがActive化されていない

現在の確認対象ファイルは、frontmatterが以下のままです。

```yaml
status: draft
version: 0.1.0-draft.1
```

指定されたActive化状態は以下です。

```yaml
status: active
version: 1.0.0
```

これは最優先で修正が必要です。

---

## 1.2 入力項目の必須/任意/デフォルト値の矛盾が残っている

`search.countPerQuery` などが **必須 Yes** のままですが、同時に「未指定時は10」「P0初期値はJP/ja/ja-JP/true」といった記述が残っています。

修正方針は、前回レビューどおり以下がよいです。

| 項目                     | 必須 | デフォルト   |
| ---------------------- | -: | ------- |
| `search.countPerQuery` | No | `10`    |
| `search.country`       | No | `JP`    |
| `search.searchLang`    | No | `ja`    |
| `search.uiLang`        | No | `ja-JP` |
| `search.extraSnippets` | No | `true`  |

この修正がないと、M1以降で入力バリデーション実装がぶれます。

---

## 1.3 P0対象外出力フラグが「省略可」になっていない

現在は以下が **false固定** になっています。

* `output.json`
* `output.runReport`
* `output.chatgptPrompt`

前回レビューでは、P0対象外出力フラグは **省略可** とし、`true` の場合だけ入力不正とする方針でした。

修正後は以下がよいです。

| 項目                     | P0での扱い              |
| ---------------------- | ------------------- |
| `output.json`          | 省略可。`true` の場合は入力不正 |
| `output.runReport`     | 省略可。`true` の場合は入力不正 |
| `output.chatgptPrompt` | 省略可。`true` の場合は入力不正 |

---

## 1.4 Brave Search APIパラメータ対応表が未反映

Active化版には、入力YAMLの項目とBrave Search APIパラメータの対応を明記する必要があります。

現状は、`country`、`searchLang`、`uiLang`、`extraSnippets` を使うとは書かれていますが、API側のパラメータ名への変換が固定されていません。

追加すべき対応表は以下です。

| 入力YAML                 | Brave Search API |
| ---------------------- | ---------------- |
| `search.countPerQuery` | `count`          |
| `search.country`       | `country`        |
| `search.searchLang`    | `search_lang`    |
| `search.uiLang`        | `ui_lang`        |
| `search.extraSnippets` | `extra_snippets` |

---

## 1.5 全クエリ失敗時・0件時・部分失敗時の終了判定が不足

現在は「一部クエリ失敗時は継続」「すべてのクエリが失敗した場合でも原因が分かるエラーメッセージを表示」まではあります。

ただし、以下が未定義です。

| ケース            | 必要な定義                               |
| -------------- | ----------------------------------- |
| 一部クエリ失敗        | CSV/Markdownを出すか、exit codeをどうするか    |
| 全クエリAPI失敗      | 正常終了扱いにしないこと、exit code `1`          |
| 全クエリ成功だが検索結果0件 | 空CSVヘッダー＋Markdownを出力し、exit code `0` |
| API失敗と0件       | 明確に区別すること                           |

ここはM2/M3の実装で必ず効いてくるので、Active化前に固定した方がよいです。

---

## 1.6 検索結果URLへ直接HTTPアクセスしない要件が不足

P0対象外として、note非公式API・本文スクレイピング・有料部分取得は書かれています。

ただし、より重要な禁止ラインである以下が明文化されていません。

```text
P0ではBrave Search APIレスポンスのみを利用する。
検索結果URLに対してHTTP GET等の追加アクセスは行わない。
記事本文、HTML、OGP、価格表示、本文中の無料/有料境界を取得しない。
```

これはSafety要件として必須です。

---

## 1.7 Markdownの「似たタイトル」欄にスニペットが含まれていない

現状の `P0-MD-004` は、タイトル、URL、媒体、キーワードの一覧化までです。

P0のリサーチメモは、15分で人間レビューできる下準備が目的なので、Markdownにもスニペットを入れた方がよいです。

修正案：

```text
P0-MD-004:
検索結果のタイトル、URL、媒体、キーワード、スニペットを一覧化する。
```

---

## 1.8 P0実装受け入れ条件が未分離

現在の `P0-AC` は、要件定義書としての受け入れ条件が中心です。

ただし、後続のM1〜M5で使うには、**P0実装受け入れ条件** が別章で必要です。

追加すべき観点は以下です。

* 有効な入力YAMLでBrave Search API検索が実行される
* 5キーワード×3媒体から15クエリが生成される
* 検索結果が `NormalizedSearchResult` に変換される
* URL完全一致の重複が1件に統合される
* `search-results.csv` が出力される
* `research-memo.md` が出力される
* APIキー未設定時はAPI呼び出し前に停止する
* 入力不正時はAPI呼び出し前に停止する
* 一部API失敗時は成功分からCSV/Markdownを生成する
* 全クエリAPI失敗時は正常完了扱いにしない
* 検索結果0件時もCSVヘッダーとMarkdownを生成する
* APIキーが標準出力、標準エラー、CSV、Markdownに出ない
* 検索結果URLへ直接HTTPアクセスしない

---

# 2. P1修正の未反映

以下も未反映です。

| ID                       | 状態  | コメント                                                              |
| ------------------------ | --- | ----------------------------------------------------------------- |
| CSVのBOM有無                | 未反映 | 現在は「UTF-8」のみ。Excel利用を考えるなら `UTF-8 with BOM` か `without BOM` か固定する |
| 既存出力ファイルの上書き方針           | 未反映 | 同名ファイルがある場合の扱いが未定義                                                |
| `platforms[].site` の重複扱い | 未反映 | 同じsiteが複数指定された場合の扱いが未定義                                           |
| `.env` の読み込み位置           | 未反映 | プロジェクトルートから読む、と明記した方がよい                                           |

---

# 3. 良い点

一方で、土台はかなり良いです。

* P0対象範囲と対象外は大枠として整理されている
* `1キーワード × 1媒体 = 1リクエスト` の考え方が入っている
* 5キーワード×3媒体＝15クエリのコスト感と整合している
* CSVとMarkdownに絞る方針は企画書と整合している
* `NormalizedSearchResult` のDTO定義がある
* URL完全一致のみ重複排除する方針はP0として妥当
* note非公式API、本文スクレイピング、有料部分取得を対象外にしている
* APIキーを `.env` で扱い、出力しない方針がある

Active版企画書でも、P0ではCSVとMarkdownリサーチメモを出力し、JSON・実行レポート・ChatGPT分析プロンプトはP1追加と整理されています。

---

# 4. 最終判定

## 現時点

**Active化NG。M1着手不可。**

理由は、frontmatterがドラフトのままで、前回レビューのP0/P1修正が完全に反映されていないためです。

## 修正後

以下を反映すれば、**Active化OK / M1着手可** です。

| 優先度 | 修正                                                   |
| --- | ---------------------------------------------------- |
| P0  | frontmatterを `status: active` / `version: 1.0.0` に更新 |
| P0  | `search` 配下を任意＋デフォルト補完に修正                            |
| P0  | P0対象外出力フラグを省略可＋true時エラーに修正                           |
| P0  | Brave Search APIパラメータ対応表を追加                          |
| P0  | 全失敗・部分失敗・0件時のexit codeと出力方針を追加                       |
| P0  | 検索結果URLへHTTPアクセスしないSafety要件を追加                       |
| P0  | Markdownの似たタイトル一覧にスニペットを追加                           |
| P0  | P0実装受け入れ条件を別章で追加                                     |
| P1  | CSV BOM、上書き方針、site重複、`.env` 読み込み位置を追加                |
| P1  | Draft版レビュー観点を削除、またはAppendixへ移動                       |

---

# 5. 次アクション

次は **Active化版の再生成** が必要です。

対象ファイル：

```text
docs/research/research-memo-builder-p0-requirements.md
```

再生成後に確認すべき最小チェックは以下です。

```yaml
status: active
version: 1.0.0
```

さらに、文書内に以下の要件があることを確認してください。

* `P0-SEA-023`：Brave Search APIパラメータ対応表
* `P0-SAFE-001` / `P0-SAFE-002`：検索結果URLへ直接アクセスしない
* `P0-ERR-020` / `P0-ERR-021`：全クエリ失敗・0件の区別
* `P0-IAC-*`：P0実装受け入れ条件
* `P0-OUT-007`：既存ファイル上書き方針
* `P0-IN-032`：`platforms[].site` 重複扱い
* `P0-KEY-012`：`.env` 読み込み位置

## まとめ / Summary

### 日本語

* 最終チェックの結果、現在のP0要件定義書はまだActive化未完了です。
* `status: draft`、`version: 0.1.0-draft.1` のままでした。
* 前回レビューのP0/P1修正も一部未反映です。
* M1に進む前に、Active化版の再生成が必要です。

### English

* The final check shows that the P0 requirements document is not active yet.
* It still has `status: draft` and `version: 0.1.0-draft.1`.
* Some P0 and P1 review fixes are still missing.
* Before starting M1, the Active version should be regenerated.
