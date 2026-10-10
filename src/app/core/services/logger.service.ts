import { Injectable, isDevMode } from '@angular/core';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  OFF = 4,
}

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private level: LogLevel = LogLevel.INFO;

  constructor() {
    this.initLevel();
  }

  private initLevel() {
    if (!isDevMode()) {
      this.level = LogLevel.ERROR;
    } else {
      this.level = LogLevel.DEBUG;
    }
  }

  debug(message: string, ...args: any[]) {
    this.log(LogLevel.DEBUG, message, args);
  }

  info(message: string, ...args: any[]) {
    this.log(LogLevel.INFO, message, args);
  }

  warn(message: string, ...args: any[]) {
    this.log(LogLevel.WARN, message, args);
  }

  error(message: string, ...args: any[]) {
    this.log(LogLevel.ERROR, message, args);
  }

  private log(level: LogLevel, message: string, args: any[]) {
    if (level >= this.level) {
      const timestamp = new Date().toISOString();
      const levelName = LogLevel[level].padEnd(5);
      const logMessage = `[${timestamp}] [${levelName}] ${message}`;

      switch (level) {
        case LogLevel.ERROR:
          console.error(logMessage, ...args);
          break;
        case LogLevel.WARN:
          console.warn(logMessage, ...args);
          break;
        case LogLevel.INFO:
          console.info(logMessage, ...args);
          break;
        default:
          console.log(logMessage, ...args);
      }
    }
  }
}

