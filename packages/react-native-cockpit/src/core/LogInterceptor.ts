import { cockpitStore } from './CockpitStore';
import { ConsoleLog, LogLevel } from '../types';

let isLogInterceptorEnabled = false;

const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export class LogInterceptor {
  public static enable() {
    if (isLogInterceptorEnabled) return;
    isLogInterceptorEnabled = true;

    const levels: LogLevel[] = ['log', 'info', 'warn', 'error', 'debug'];

    levels.forEach((level) => {
      const orig = originalConsole[level];

      console[level] = (...args: any[]) => {
        // Call original so developers still see logs in terminal/debugger
        try {
          orig.apply(console, args);
        } catch {
          // ignore
        }

        try {
          let stack: string | undefined;
          if (level === 'error' || level === 'warn') {
            // Check if one of the args is an Error object
            const errorArg = args.find((a) => a instanceof Error);
            if (errorArg && errorArg.stack) {
              stack = errorArg.stack;
            } else {
              const err = new Error();
              if (err.stack) {
                // Remove first 2 lines relating to interceptor
                const lines = err.stack.split('\n');
                stack = lines.slice(2).join('\n');
              }
            }
          }

          const logEntry: ConsoleLog = {
            id: generateId(),
            level,
            timestamp: Date.now(),
            messages: args,
            stack,
          };

          cockpitStore.addLog(logEntry);
        } catch {
          // ensure interceptor never crashes app
        }
      };
    });
  }

  public static disable() {
    if (!isLogInterceptorEnabled) return;
    isLogInterceptorEnabled = false;

    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
  }
}
