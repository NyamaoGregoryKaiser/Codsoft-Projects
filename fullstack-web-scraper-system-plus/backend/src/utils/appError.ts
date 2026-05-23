export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Mark as operational errors (expected errors)

    Object.setPrototypeOf(this, AppError.prototype); // Maintain proper prototype chain
  }
}