export class Logger {
  private static _enabled = true;

  static setEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  static log(...args: any[]): void {
    if (this._enabled) {
      console.log(...args);
    }
  }

  static warn(...args: any[]): void {
    if (this._enabled) {
      console.warn(...args);
    }
  }

  static error(...args: any[]): void {
    if (this._enabled) {
      console.error(...args);
    }
  }
}
