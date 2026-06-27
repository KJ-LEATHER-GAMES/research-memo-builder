import type { NormalizedSearchResult } from "../domain/normalizedSearchResult.js";
import type { ResolvedResearchInput } from "../domain/researchInput.js";
import type { ResearchExitCode } from "../domain/researchExitCode.js";
import {
  escapeMarkdownInline,
  formatMarkdownInline,
  formatMarkdownInlineList,
} from "../utils/markdownEscape.js";

export type ResearchMemoRenderInput = {
  input: ResolvedResearchInput;
  results: readonly NormalizedSearchResult[];
  generatedAt: string;
  outputDir: string;
  queryCount: number;
  succeededQueryCount: number;
  failedQueryCount: number;
  totalResultCountBeforeDeduplication: number;
  totalResultCountAfterDeduplication: number;
  removedDuplicateCount: number;
  warnings: readonly string[];
  exitCode: ResearchExitCode;
};

type ResultGroup = {
  platform: string;
  keyword: string;
  results: NormalizedSearchResult[];
};

export function renderMarkdownResearchMemo(
  renderInput: ResearchMemoRenderInput,
): string {
  const sections = [
    "# 既存記事リサーチメモ",
    renderTargetArticleSection(renderInput),
    renderSearchConditionsSection(renderInput),
    renderKeywordSection(renderInput.input),
    renderSimilarTitlesSection(renderInput),
    renderCutSection(),
    renderFreePromiseSection(),
    renderPriceSection(),
    renderDifferentiationSection(),
    renderArticleDecisionSection(),
    renderNextArticleSection(),
    renderP0GenerationMemoSection(renderInput),
  ];

  return `${sections.join("\n\n")}\n`;
}

function renderTargetArticleSection(
  renderInput: ResearchMemoRenderInput,
): string {
  return [
    "## 対象記事候補",
    "",
    `- Topic: ${formatMarkdownInline(renderInput.input.topic)}`,
    `- Article Type: ${renderArticleTypes(renderInput.input.articleType)}`,
  ].join("\n");
}

function renderSearchConditionsSection(
  renderInput: ResearchMemoRenderInput,
): string {
  const { input } = renderInput;

  return [
    "## 検索条件",
    "",
    `- Output Dir: ${formatMarkdownInline(renderInput.outputDir)}`,
    `- Platforms: ${renderPlatforms(input)}`,
    `- Keyword Count: ${input.keywords.length}`,
    `- Count Per Query: ${input.search.countPerQuery}`,
    `- Country: ${formatMarkdownInline(input.search.country)}`,
    `- Search Lang: ${formatMarkdownInline(input.search.searchLang)}`,
    `- UI Lang: ${formatMarkdownInline(input.search.uiLang)}`,
    `- Extra Snippets: ${formatBoolean(input.search.extraSnippets)}`,
    `- Generated At: ${formatMarkdownInline(renderInput.generatedAt)}`,
  ].join("\n");
}

function renderKeywordSection(input: ResolvedResearchInput): string {
  const keywordLines = input.keywords.map(
    (keyword) => `- ${formatMarkdownInline(keyword)}`,
  );

  return ["## 1. 検索したキーワード", "", ...keywordLines].join("\n");
}

function renderSimilarTitlesSection(
  renderInput: ResearchMemoRenderInput,
): string {
  if (renderInput.results.length === 0) {
    return [
      "## 2. 似たタイトルがあるか",
      "",
      renderNoResultsMessage(renderInput),
    ].join("\n");
  }

  const groups = groupResults(renderInput);

  return [
    "## 2. 似たタイトルがあるか",
    "",
    ...groups.map((group) => renderResultGroup(group)),
  ].join("\n\n");
}

function renderCutSection(): string {
  return [
    "## 3. どんな切り口が多いか",
    "",
    "P0では自動分析しないため、人間レビューで確認する。",
    "",
    "- [ ] タイトルとスニペットから多い切り口を確認する",
    "- [ ] 似たテーマの記事が多い媒体を確認する",
    "- [ ] 自分の記事で避けたい切り口を確認する",
  ].join("\n");
}

function renderFreePromiseSection(): string {
  return [
    "## 4. 無料部分で何を約束しているか",
    "",
    "P0では記事本文を取得しないため、人間レビューで確認する。",
    "",
    "- [ ] 無料部分で読者に約束している内容を確認する",
    "- [ ] タイトルとスニペットから読者メリットを推定する",
    "- [ ] 有料部分へ誘導している場合は、その導線を確認する",
  ].join("\n");
}

function renderPriceSection(): string {
  return [
    "## 5. 価格帯はいくらか",
    "",
    "P0では価格情報を確定取得しないため、人間レビューで確認する。",
    "",
    "- [ ] note記事ページを手動で確認する",
    "- [ ] 有料記事の場合は価格を記録する",
    "- [ ] 無料記事の場合は無料記事として記録する",
  ].join("\n");
}

function renderDifferentiationSection(): string {
  return [
    "## 6. 自分ならどこで差別化できるか",
    "",
    "- 家庭内運用の実体験を入れられるか",
    "- 仕様書・要件定義・設計判断として整理できるか",
    "- 実装ログや失敗ログを具体的に書けるか",
    "- 読者が真似できるテンプレートや判断軸を出せるか",
  ].join("\n");
}

function renderArticleDecisionSection(): string {
  return [
    "## 7. 記事化判断",
    "",
    "- [ ] 似たタイトルが多すぎないか",
    "- [ ] 自分の体験で差別化できるか",
    "- [ ] 読者にとって再利用できる知見があるか",
    "- [ ] 無料記事にするか、有料候補にするか",
    "",
    "判断メモ:",
    "",
    "- ",
  ].join("\n");
}

function renderNextArticleSection(): string {
  return [
    "## 8. 次に作るなら",
    "",
    "- [ ] 追加で検索したいキーワードを洗い出す",
    "- [ ] 競合記事の本文を手動確認する",
    "- [ ] 自分の記事の仮タイトルを3案作る",
    "- [ ] 記事構成案を作る",
  ].join("\n");
}

function renderP0GenerationMemoSection(
  renderInput: ResearchMemoRenderInput,
): string {
  return [
    "## P0生成メモ",
    "",
    "### 実行結果",
    "",
    `- Exit Code: ${renderInput.exitCode}`,
    `- Generated Query Count: ${renderInput.queryCount}`,
    `- Succeeded Query Count: ${renderInput.succeededQueryCount}`,
    `- Failed Query Count: ${renderInput.failedQueryCount}`,
    `- Result Count Before Deduplication: ${renderInput.totalResultCountBeforeDeduplication}`,
    `- Result Count After Deduplication: ${renderInput.totalResultCountAfterDeduplication}`,
    `- Removed Duplicate Count: ${renderInput.removedDuplicateCount}`,
    "",
    "### Warnings",
    "",
    renderWarnings(renderInput.warnings),
    "",
    "### 注意書き",
    "",
    "> このメモは検索結果のタイトル・URL・スニペットをもとにしたP0下書きです。  ",
    "> 記事本文、有料部分、正確な価格情報は取得していません。  ",
    "> 切り口、無料部分の約束、価格帯は人間レビューで確認してください。",
  ].join("\n");
}

function renderArticleTypes(
  articleType: ResolvedResearchInput["articleType"],
): string {
  const enabledTypes = [
    articleType.devDiary ? "devDiary" : undefined,
    articleType.techArticle ? "techArticle" : undefined,
    articleType.paidNoteCandidate ? "paidNoteCandidate" : undefined,
  ].filter((value): value is string => value !== undefined);

  return enabledTypes.map((value) => formatMarkdownInline(value)).join(" / ");
}

function renderPlatforms(input: ResolvedResearchInput): string {
  return input.platforms
    .map(
      (platform) =>
        `${formatMarkdownInline(platform.name)} (${formatMarkdownInline(
          platform.site,
        )})`,
    )
    .join(" / ");
}

function renderNoResultsMessage(renderInput: ResearchMemoRenderInput): string {
  if (
    renderInput.queryCount > 0 &&
    renderInput.succeededQueryCount === 0 &&
    renderInput.failedQueryCount > 0
  ) {
    return "すべての検索クエリが失敗したため、検索結果候補は生成されませんでした。";
  }

  if (renderInput.failedQueryCount > 0) {
    return "成功した検索クエリからは検索結果候補が生成されませんでした。";
  }

  return "検索結果候補はありませんでした。";
}

function groupResults(renderInput: ResearchMemoRenderInput): ResultGroup[] {
  const sortedResults = sortResults(renderInput);
  const groups = new Map<string, ResultGroup>();

  for (const result of sortedResults) {
    const key = `${result.platform}\u0000${result.keyword}`;
    const existingGroup = groups.get(key);

    if (existingGroup) {
      existingGroup.results.push(result);
      continue;
    }

    groups.set(key, {
      platform: result.platform,
      keyword: result.keyword,
      results: [result],
    });
  }

  return [...groups.values()];
}

function sortResults(
  renderInput: ResearchMemoRenderInput,
): NormalizedSearchResult[] {
  const platformOrder = new Map(
    renderInput.input.platforms.map((platform, index) => [
      platform.name,
      index,
    ]),
  );
  const keywordOrder = new Map(
    renderInput.input.keywords.map((keyword, index) => [keyword, index]),
  );

  return [...renderInput.results].sort((a, b) => {
    const platformDiff =
      getOrder(platformOrder, a.platform) - getOrder(platformOrder, b.platform);

    if (platformDiff !== 0) {
      return platformDiff;
    }

    const keywordDiff =
      getOrder(keywordOrder, a.keyword) - getOrder(keywordOrder, b.keyword);

    if (keywordDiff !== 0) {
      return keywordDiff;
    }

    return a.rank - b.rank;
  });
}

function getOrder(
  orderMap: ReadonlyMap<string, number>,
  value: string,
): number {
  return orderMap.get(value) ?? Number.MAX_SAFE_INTEGER;
}

function renderResultGroup(group: ResultGroup): string {
  const title = `### ${formatMarkdownInline(group.platform)} / ${formatMarkdownInline(
    group.keyword,
  )}`;

  const resultLines = group.results.flatMap((result, index) =>
    renderResultItem(result, index + 1),
  );

  return [title, "", ...resultLines].join("\n");
}

function renderResultItem(
  result: NormalizedSearchResult,
  displayIndex: number,
): string[] {
  const title = escapeMarkdownInline(result.title);
  const snippet = formatMarkdownInline(result.snippet);
  const extraSnippets = formatMarkdownInlineList(result.extraSnippets);

  return [
    `${displayIndex}. [${title}](${result.url})`,
    `   - Rank: ${result.rank}`,
    `   - Snippet: ${snippet}`,
    `   - ExtraSnippets: ${extraSnippets}`,
  ];
}

function renderWarnings(warnings: readonly string[]): string {
  if (warnings.length === 0) {
    return "- なし";
  }

  return warnings
    .map((warning) => `- ${formatMarkdownInline(warning)}`)
    .join("\n");
}

function formatBoolean(value: boolean): string {
  return value ? "true" : "false";
}
