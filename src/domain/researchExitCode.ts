export const ResearchExitCode = {
  SUCCESS: 0,
  PARTIAL_API_FAILURE: 1,
  INPUT_ERROR: 2,
  CONFIG_ERROR: 3,
  ALL_API_FAILURE: 4,
  OUTPUT_ERROR: 5,
  UNEXPECTED_ERROR: 9,
} as const;

export type ResearchExitCode =
  (typeof ResearchExitCode)[keyof typeof ResearchExitCode];
