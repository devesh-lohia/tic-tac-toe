/**
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  Nakama Tic-Tac-Toe — Browser Console Logger  v2               │
 * │                                                                 │
 * │  All log entries are stored in memory AND printed to DevTools.  │
 * │                                                                 │
 * │  DevTools helpers (type in Console):                            │
 * │    __nakama.getLogs()          → returns full log array         │
 * │    __nakama.printLogs()        → pretty-prints stored logs      │
 * │    __nakama.downloadLogs()     → downloads nakama-logs.txt      │
 * │    __nakama.clearLogs()        → wipes the in-memory store      │
 * │    __nakama.filterLogs('AUTH') → show logs for one namespace    │
 * └─────────────────────────────────────────────────────────────────┘
 */

type Severity = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  namespace: string;
  severity: Severity;
  message: string;
  data?: unknown;
}

// ── In-memory store ───────────────────────────────────────────────────────────
const LOG_STORE: LogEntry[] = [];
const MAX_ENTRIES = 2000; // prevent unbounded growth

// ── Namespace colours ─────────────────────────────────────────────────────────
const COLORS: Record<string, string> = {
  AUTH:       '#a78bfa',
  SOCKET:     '#60a5fa',
  MATCH:      '#34d399',
  BOARD:      '#fbbf24',
  MATCHMAKER: '#f472b6',
  LIFECYCLE:  '#94a3b8',
  NETWORK:    '#fb923c',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function ts(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '');
}

function serialize(data: unknown): string {
  try {
    if (data instanceof Error) {
      return JSON.stringify({ message: data.message, name: data.name, stack: data.stack }, null, 2);
    }
    // Nakama SDK errors are plain objects with non-enumerable code/message
    if (data !== null && typeof data === 'object') {
      const plain: Record<string, unknown> = {};
      for (const key of Object.getOwnPropertyNames(data)) {
        plain[key] = (data as any)[key];
      }
      return JSON.stringify(plain, null, 2);
    }
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

function store(entry: LogEntry): void {
  if (LOG_STORE.length >= MAX_ENTRIES) LOG_STORE.shift(); // rolling window
  LOG_STORE.push(entry);
}

// Check if we are in production
const IS_PROD = import.meta.env.PROD;

// ── Core emit ─────────────────────────────────────────────────────────────────
function emit(
  namespace: string,
  severity: Severity,
  message: string,
  data?: unknown
): void {
  const entry: LogEntry = {
    timestamp: ts(),
    namespace,
    severity,
    message,
    data,
  };
  store(entry);

  // In production, we only print errors and warnings to the console
  if (IS_PROD && severity !== 'error' && severity !== 'warn') {
    return;
  }

  const color  = COLORS[namespace] ?? '#e2e8f0';
  const badge  = `%c[${namespace}]%c`;
  const style1 = `color:${color};font-weight:bold;`;
  const style2 = 'color:inherit;font-weight:normal;';
  const prefix = `${entry.timestamp} ${badge} ${message}`;

  const consoleFn =
    severity === 'error' ? console.error :
    severity === 'warn'  ? console.warn  :
    severity === 'debug' ? console.debug :
    console.log;

  data !== undefined
    ? consoleFn(prefix, style1, style2, data)
    : consoleFn(prefix, style1, style2);
}

// ── Logger factory ────────────────────────────────────────────────────────────
function makeLogger(namespace: string) {
  return {
    info:  (msg: string, data?: unknown) => emit(namespace, 'info',  msg, data),
    warn:  (msg: string, data?: unknown) => emit(namespace, 'warn',  msg, data),
    error: (msg: string, data?: unknown) => emit(namespace, 'error', msg, data),
    debug: (msg: string, data?: unknown) => emit(namespace, 'debug', msg, data),
    /** Opens a collapsible DevTools group — call .end() when done */
    group: (label: string) => {
      const color = COLORS[namespace] ?? '#e2e8f0';
      console.groupCollapsed(
        `%c[${namespace}]%c ${ts()} ▶ ${label}`,
        `color:${color};font-weight:bold;`,
        'color:inherit;font-weight:normal;'
      );
      return { end: () => console.groupEnd() };
    },
  };
}

// ── Public log object ─────────────────────────────────────────────────────────
const log = {
  auth:       makeLogger('AUTH'),
  socket:     makeLogger('SOCKET'),
  match:      makeLogger('MATCH'),
  board:      makeLogger('BOARD'),
  matchmaker: makeLogger('MATCHMAKER'),
  lifecycle:  makeLogger('LIFECYCLE'),
  network:    makeLogger('NETWORK'),
};

// ── DevTools utility belt ─────────────────────────────────────────────────────
function getLogs(namespace?: string): LogEntry[] {
  return namespace
    ? LOG_STORE.filter(e => e.namespace === namespace.toUpperCase())
    : [...LOG_STORE];
}

function filterLogs(namespace: string): LogEntry[] {
  const result = getLogs(namespace);
  console.table(result.map(e => ({
    time: e.timestamp,
    ns: e.namespace,
    sev: e.severity,
    msg: e.message,
  })));
  return result;
}

function printLogs(namespace?: string): void {
  const entries = getLogs(namespace);
  if (entries.length === 0) {
    console.log('%c[Logger] No entries stored yet.', 'color:#94a3b8');
    return;
  }
  console.group(`%c[Logger] ${entries.length} stored entries`, 'color:#a78bfa;font-weight:bold;');
  entries.forEach(e => {
    const color = COLORS[e.namespace] ?? '#e2e8f0';
    const line = `${e.timestamp} [${e.namespace}] [${e.severity.toUpperCase()}] ${e.message}`;
    const consoleFn =
      e.severity === 'error' ? console.error :
      e.severity === 'warn'  ? console.warn  :
      console.log;
    e.data !== undefined
      ? consoleFn(`%c${line}`, `color:${color}`, e.data)
      : consoleFn(`%c${line}`, `color:${color}`);
  });
  console.groupEnd();
}

function downloadLogs(filename = 'nakama-logs.txt'): void {
  const lines = LOG_STORE.map(e => {
    const dataStr = e.data !== undefined ? `\n  DATA: ${serialize(e.data)}` : '';
    return `${e.timestamp} [${e.namespace}] [${e.severity.toUpperCase()}] ${e.message}${dataStr}`;
  });

  const header = [
    '═══════════════════════════════════════════════════',
    ' Nakama Tic-Tac-Toe — Console Log Export',
    ` Generated : ${new Date().toISOString()}`,
    ` Entries   : ${lines.length}`,
    '═══════════════════════════════════════════════════',
    '',
  ];

  const blob = new Blob([header.join('\n') + lines.join('\n')], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  console.log(`%c[Logger] ✅ Downloaded "${filename}" (${lines.length} entries)`, 'color:#34d399;font-weight:bold;');
}

function clearLogs(): void {
  const count = LOG_STORE.length;
  LOG_STORE.length = 0;
  console.log(`%c[Logger] 🗑 Cleared ${count} entries from memory.`, 'color:#94a3b8;');
}

// ── Expose everything on window for DevTools access ───────────────────────────
(window as any).__nakama = {
  getLogs,
  filterLogs,
  printLogs,
  downloadLogs,
  clearLogs,
  log,       // __nakama.log.auth.info('test') works from DevTools
};

// Friendly boot message (hidden in production)
if (!IS_PROD) {
  console.log(
    '%c[Logger] Nakama logger ready. Type %c__nakama.downloadLogs()%c in the Console to export logs.',
    'color:#94a3b8;',
    'color:#a78bfa;font-weight:bold;',
    'color:#94a3b8;'
  );
}

export default log;
