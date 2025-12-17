/**
 * Centralized error handling and user-friendly error messages
 */

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  details?: any;
}

export function parseError(error: any): AppError {
  // Handle tRPC errors
  if (error?.data?.code) {
    return {
      code: error.data.code,
      message: error.message || "Unknown error",
      userMessage: getTRPCErrorMessage(error.data.code, error.message),
      details: error.data,
    };
  }

  // Handle network errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      code: "NETWORK_ERROR",
      message: error.message,
      userMessage: "Network error. Please check your connection and try again.",
      details: error,
    };
  }

  // Handle timeout errors
  if (error?.name === "TimeoutError") {
    return {
      code: "TIMEOUT",
      message: "Request timeout",
      userMessage: "Request took too long. Please try again.",
      details: error,
    };
  }

  // Handle generic errors
  return {
    code: "UNKNOWN_ERROR",
    message: error?.message || "Unknown error occurred",
    userMessage: error?.message || "Something went wrong. Please try again.",
    details: error,
  };
}

function getTRPCErrorMessage(code: string, defaultMessage: string): string {
  const messages: Record<string, string> = {
    PARSE_ERROR: "Server returned invalid data. Please try again.",
    BAD_REQUEST: "Invalid request. Please check your inputs.",
    UNAUTHORIZED: "You need to sign in to perform this action.",
    FORBIDDEN: "You don't have permission to perform this action.",
    NOT_FOUND: "The requested resource was not found.",
    CONFLICT: "This action conflicts with existing data.",
    PAYLOAD_TOO_LARGE: "File or data is too large. Please try with a smaller file.",
    UNPROCESSABLE_CONTENT: "The data you provided is invalid.",
    TOO_MANY_REQUESTS: "Too many requests. Please wait a moment and try again.",
    CLIENT_CLOSED_REQUEST: "Request was cancelled.",
    INTERNAL_SERVER_ERROR: "Server error. Please try again later.",
    NOT_IMPLEMENTED: "This feature is not yet available.",
    BAD_GATEWAY: "Service temporarily unavailable. Please try again.",
    SERVICE_UNAVAILABLE: "Service is currently down. Please try again later.",
    GATEWAY_TIMEOUT: "Service is not responding. Please try again later.",
  };

  return messages[code] || defaultMessage || "An error occurred. Please try again.";
}

export class PlanLimitError extends Error {
  constructor(
    public limitType: "analyses" | "aiGenerations" | "savedJds",
    public remaining: number,
    public limit: number
  ) {
    const messages: Record<string, string> = {
      analyses: `You've reached your monthly analysis limit. You have ${remaining} analyses remaining.`,
      aiGenerations: `You've reached your monthly AI generation limit. You have ${remaining} generations remaining.`,
      savedJds: `You've reached your saved job description limit. You have ${remaining} slots remaining.`,
    };
    super(messages[limitType]);
    this.name = "PlanLimitError";
  }

  getUserMessage(): string {
    return this.message;
  }

  getUpgradeMessage(): string {
    return "Upgrade to Pro or Enterprise for higher limits.";
  }
}

export function handleAnalysisError(error: any): { message: string; action?: string } {
  const parsed = parseError(error);

  if (parsed.code === "FORBIDDEN" && parsed.message.includes("Analysis limit")) {
    return {
      message: "You've reached your monthly analysis limit.",
      action: "upgrade",
    };
  }

  if (parsed.code === "NOT_FOUND") {
    return {
      message: "Resume or job description not found. It may have been deleted.",
      action: "reload",
    };
  }

  if (parsed.code === "INTERNAL_SERVER_ERROR") {
    return {
      message: "Failed to analyze. Please try again.",
      action: "retry",
    };
  }

  return {
    message: parsed.userMessage,
  };
}

export function shouldRetryError(error: any): boolean {
  const parsed = parseError(error);
  const retryableCodes = [
    "TIMEOUT",
    "BAD_GATEWAY",
    "SERVICE_UNAVAILABLE",
    "GATEWAY_TIMEOUT",
    "TOO_MANY_REQUESTS",
  ];
  return retryableCodes.includes(parsed.code);
}
