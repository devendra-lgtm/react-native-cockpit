export function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 B';
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));

  return `${val} ${sizes[i] || 'B'}`;
}

export function formatDuration(ms?: number): string {
  if (ms === undefined || ms === null || isNaN(ms)) return '0ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number, z = 2) => ('00' + n).slice(-z);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

export function safeJsonParse(data: any): { isJson: boolean; value: any } {
  if (typeof data !== 'string') {
    return { isJson: false, value: data };
  }
  try {
    const parsed = JSON.parse(data);
    return { isJson: true, value: parsed };
  } catch {
    return { isJson: false, value: data };
  }
}

export function safeJsonStringify(data: any, space = 2): string {
  const seen = new WeakSet();
  try {
    return JSON.stringify(
      data,
      (_key: string, val: any) => {
        if (typeof val === 'object' && val !== null) {
          if (seen.has(val)) return '[Circular]';
          seen.add(val);
        }
        if (typeof val === 'function') return `[Function: ${val.name || 'anonymous'}]`;
        return val;
      },
      space
    );
  } catch (err: any) {
    return `[Failed to stringify: ${err?.message || 'Unknown'}]`;
  }
}
