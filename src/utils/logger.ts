export class Logger {
  private static format(level: "INFO" | "WARN" | "ERROR", message: string, meta?: any) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta && { meta })
    });
  }

  static info(message: string, meta?: any) {
    console.log(this.format("INFO", message, meta));
  }

  static warn(message: string, meta?: any) {
    console.warn(this.format("WARN", message, meta));
  }

  static error(message: string, error?: any, meta?: any) {
    console.error(
      this.format("ERROR", message, {
        ...(error instanceof Error && {
          name: error.name,
          message: error.message,
          stack: error.stack
        }),
        ...meta
      })
    );
  }
}
