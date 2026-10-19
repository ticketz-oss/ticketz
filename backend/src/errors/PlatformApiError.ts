class PlatformApiError extends Error {
  public readonly code: string;

  public readonly statusCode: number;

  public readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export default PlatformApiError;
