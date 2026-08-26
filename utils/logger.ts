export class APILogger {
  static info(message: string) {
    console.log(`[INFO] ${message}`);
    console.log(`[INFO] ${new Date().toISOString()} ${message}`);
  }

  static error(message: string) {
    console.error(`[ERROR] ${message}`);
  }

  static request(method: string, url: string) {
    console.log(`[REQUEST] ${method} ${url}`);
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
