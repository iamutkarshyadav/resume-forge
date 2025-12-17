/**
 * Centralized frontend configuration
 * All hardcoded limits, thresholds, and constants
 */

// Text truncation limits
export const TEXT_LIMITS = {
  RESUME_SUMMARY_PREVIEW: 300,
  RESUME_SECTION_PREVIEW: 150,
  DIFF_VIEWER_PREVIEW: 500,
  JOB_DESCRIPTION_PREVIEW: 200,
  COVER_LETTER_SNIPPET: 160,
  SECTION_TITLE_PREVIEW: 100,
} as const;

// Array display limits
export const DISPLAY_LIMITS = {
  ANALYSIS_STRENGTHS: 4,
  ANALYSIS_WEAKNESSES: 3,
  ANALYSIS_MISSING_SKILLS: 4,
  ANALYSIS_RECOMMENDATIONS: 4,
  RECENT_ACTIVITY: 3,
  RECENT_RESUMES: 3,
  HISTORY_PAGE_LIMIT: 40,
  COVER_LETTER_HISTORY: 40,
} as const;

// Score calculation constants
export const SCORE_CALCULATIONS = {
  ATS_HEALTH_MULTIPLIER: 0.95,
  WEAKNESS_PENALTY: 3,
  WEAKNESS_PENALTY_CAP: 15,
  BASE_SCORE_ON_ERROR: 50,
  JD_REALISM_DEFAULT: 75,
} as const;

// Input validation thresholds
export const VALIDATION = {
  MIN_JD_LENGTH: 20,
  MIN_PASSWORD_LENGTH: 8,
  MIN_JD_TEXT_LENGTH: 1,
} as const;

// UI behavior thresholds
export const USAGE_WARNINGS = {
  WARNING_THRESHOLD: 0.8, // Warn at 80% usage
} as const;

// API configuration
export const API_CONFIG = {
  REQUEST_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Mock/placeholder configuration
export const MOCK_DATA = {
  PLACEHOLDER_COVER_LETTER_LENGTH: 10,
} as const;
