class AppError {
  public readonly message: string;

  public readonly statusCode: number;

  public readonly level: string;

  constructor(message: string, statusCode = 400, level = "warn") {
    this.message = message;
    this.statusCode = statusCode;
    this.level = level;
  }
}

export default AppError;
