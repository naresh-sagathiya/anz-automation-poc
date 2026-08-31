export class APILogger {
  private static redact(message: string) {
    return message.replace(/(password|accessToken|refreshToken|cardNumber|accountNumber)(["']?\s*[:=]\s*["']?)[^,"'\s}]+/gi, "$1$2[REDACTED]");
  }
  static info(message: string) {
    console.log(this.redact(`[INFO] ${message}`));
    console.log(this.redact(`[INFO] ${new Date().toISOString()} ${message}`));
  }

  static error(message: string) {
    console.error(this.redact(`[ERROR] ${message}`));
  }

  static request(method: string, url: string) {
    console.log(this.redact(`[REQUEST] ${method} ${url}`));
  }

  static response(status: number, url: string) {
    console.log(`[RESPONSE] ${status} ${url}`);
  }
}

export class UILogger {

  // put your method here
}


export class MobileLogger {

  // put your method here
}
