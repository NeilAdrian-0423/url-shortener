const DEBUG = import.meta.env.DEV;

export const log = {
  info: (...args) => {
    if (DEBUG) {
      console.log('%c[INFO]', 'color: #3b82f6', ...args);
    }
  },

  error: (...args) => {
    if (DEBUG) {
      console.error('%c[ERROR]', 'color: #ef4444', ...args);
    }
  },

  warn: (...args) => {
    if (DEBUG) {
      console.warn('%c[WARN]', 'color: #f59e0b', ...args);
    }
  },

  debug: (...args) => {
    if (DEBUG) {
      console.log('%c[DEBUG]', 'color: #8b5cf6', ...args);
    }
  },

  api: (method, url, data, response) => {
    if (DEBUG) {
      console.group(`%c[API] ${method} ${url}`, 'color: #10b981');
      if (data) console.log('Request:', data);
      if (response) console.log('Response:', response);
      console.groupEnd();
    }
  }
};
