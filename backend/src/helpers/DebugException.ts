export class DebugException extends Error {
  cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "DebugException";
    if (cause) {
      this.cause = cause;
    }
  }
}
