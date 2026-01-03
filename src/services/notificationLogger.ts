/**
 * Notification Logger Service
 * Logs notification operations to both console and file for debugging
 */

interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  data?: any;
}

class NotificationLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 log entries in memory
  private logToFile = true;

  /**
   * Log a debug message
   */
  public debug(message: string, data?: any): void {
    this.addLog('DEBUG', message, data);
    console.log(`🔍 [DEBUG] ${message}`, data || '');
  }

  /**
   * Log an info message
   */
  public info(message: string, data?: any): void {
    this.addLog('INFO', message, data);
    console.log(`ℹ️ [INFO] ${message}`, data || '');
  }

  /**
   * Log a warning
   */
  public warn(message: string, data?: any): void {
    this.addLog('WARN', message, data);
    console.warn(`⚠️ [WARN] ${message}`, data || '');
  }

  /**
   * Log an error
   */
  public error(message: string, error?: any): void {
    this.addLog('ERROR', message, error);
    console.error(`❌ [ERROR] ${message}`, error || '');
  }

  /**
   * Add a log entry
   */
  private addLog(level: LogEntry['level'], message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : undefined // Deep clone to avoid reference issues
    };

    this.logs.push(entry);

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Write to file if enabled (async, don't wait)
    if (this.logToFile) {
      this.writeToFile(entry).catch(err => {
        console.error('Failed to write log to file:', err);
      });
    }
  }

  /**
   * Write log entry to file
   */
  private async writeToFile(entry: LogEntry): Promise<void> {
    try {
      // Try to use Capacitor Filesystem if available (optional dependency)
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      
      const logLine = `${entry.timestamp} [${entry.level}] ${entry.message}${entry.data ? ' ' + JSON.stringify(entry.data) : ''}\n`;
      const logFile = 'notification-debug.log';

      // Append to log file in Documents directory (user-accessible)
      await Filesystem.appendFile({
        path: logFile,
        data: logLine,
        directory: Directory.Documents // User-accessible documents directory
      });
    } catch (error) {
      // Filesystem not available or error - that's okay, we still have console logs and in-memory logs
      // Silently fail - console logging and in-memory storage still work
    }
  }

  /**
   * Get all logs as formatted text
   */
  public getLogsAsText(): string {
    return this.logs.map(entry => {
      const dataStr = entry.data ? ' ' + JSON.stringify(entry.data, null, 2) : '';
      return `${entry.timestamp} [${entry.level}] ${entry.message}${dataStr}`;
    }).join('\n');
  }

  /**
   * Get all logs as JSON
   */
  public getLogsAsJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Clear all logs
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs to a downloadable format
   */
  public async exportLogs(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logText = this.getLogsAsText();

    // Try to save to file if Filesystem is available
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const filename = `notification-logs-${timestamp}.txt`;
      
      await Filesystem.writeFile({
        path: filename,
        data: logText,
        directory: Directory.Documents // User-accessible documents directory
      });

      this.info(`Logs exported to: ${filename} (in Documents directory)`);
      return filename;
    } catch (error) {
      // Fallback: log to console and return text
      console.log('=== NOTIFICATION LOGS (copy this) ===');
      console.log(logText);
      console.log('=== END LOGS ===');
      return logText;
    }
  }

  /**
   * Get log count
   */
  public getLogCount(): number {
    return this.logs.length;
  }

  /**
   * Get recent logs (last N entries)
   */
  public getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }
}

export const notificationLogger = new NotificationLogger();

