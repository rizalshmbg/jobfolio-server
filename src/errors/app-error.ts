export class AppError extends Error {
  constructor(
    public status_code: number,
    message: string,
  ) {
    super(message),
    this.name = "AppError";
  }
}