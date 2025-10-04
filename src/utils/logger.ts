/**
 * Système de logging centralisé pour l'application Virtus
 * 
 * Ce module fournit des fonctions de logging structuré avec différents niveaux de sévérité.
 * En production, les logs peuvent être envoyés vers un service externe (Sentry, LogRocket, etc.)
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
  userId?: string;
}

class Logger {
  private isDevelopment: boolean;
  private logs: LogEntry[] = [];
  private maxLogs: number = 100;

  constructor() {
    this.isDevelopment = typeof import.meta.env !== 'undefined' 
      ? import.meta.env.MODE === 'development'
      : process.env.NODE_ENV === 'development';
  }

  /**
   * Crée une entrée de log structurée
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
      userId: this.getCurrentUserId(),
    };
  }

  /**
   * Récupère l'ID de l'utilisateur actuel (si disponible)
   */
  private getCurrentUserId(): string | undefined {
    try {
      const authData = localStorage.getItem('auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.user?.id;
      }
    } catch {
      // Ignore les erreurs de parsing
    }
    return undefined;
  }

  /**
   * Stocke le log en mémoire (limité aux N derniers logs)
   */
  private storeLog(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Envoie le log vers la console (en développement) ou un service externe (en production)
   */
  private sendLog(entry: LogEntry): void {
    // En développement, afficher dans la console
    if (this.isDevelopment) {
      const style = this.getConsoleStyle(entry.level);
      console.log(
        `%c[${entry.level.toUpperCase()}] ${entry.timestamp}`,
        style,
        entry.message,
        entry.context || '',
        entry.error || ''
      );
    } else {
      // En production, envoyer vers un service externe (à implémenter)
      // Exemples : Sentry, LogRocket, CloudWatch, etc.
      this.sendToExternalService(entry);
    }
  }

  /**
   * Style de console selon le niveau de log
   */
  private getConsoleStyle(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: 'color: #6B7280; font-weight: normal',
      [LogLevel.INFO]: 'color: #3B82F6; font-weight: bold',
      [LogLevel.WARN]: 'color: #F59E0B; font-weight: bold',
      [LogLevel.ERROR]: 'color: #EF4444; font-weight: bold',
    };
    return styles[level];
  }

  /**
   * Envoie le log vers un service externe (à implémenter selon vos besoins)
   */
  private sendToExternalService(entry: LogEntry): void {
    // TODO: Implémenter l'envoi vers Sentry, LogRocket, etc.
    // Exemple avec Sentry:
    // if (entry.level === LogLevel.ERROR && entry.error) {
    //   Sentry.captureException(entry.error, {
    //     contexts: { custom: entry.context },
    //   });
    // }
    
    // Pour l'instant, on stocke juste en mémoire
    this.storeLog(entry);
  }

  /**
   * Log de niveau DEBUG
   */
  debug(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.storeLog(entry);
    if (this.isDevelopment) {
      this.sendLog(entry);
    }
  }

  /**
   * Log de niveau INFO
   */
  info(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.storeLog(entry);
    this.sendLog(entry);
  }

  /**
   * Log de niveau WARN
   */
  warn(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.storeLog(entry);
    this.sendLog(entry);
  }

  /**
   * Log de niveau ERROR
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.storeLog(entry);
    this.sendLog(entry);
  }

  /**
   * Récupère tous les logs stockés en mémoire
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Efface tous les logs en mémoire
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Exporte les logs au format JSON (utile pour le débogage)
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Instance singleton du logger
export const logger = new Logger();

// Fonctions utilitaires pour un usage simplifié
export const logDebug = (message: string, context?: Record<string, unknown>) => 
  logger.debug(message, context);

export const logInfo = (message: string, context?: Record<string, unknown>) => 
  logger.info(message, context);

export const logWarn = (message: string, context?: Record<string, unknown>) => 
  logger.warn(message, context);

export const logError = (message: string, error?: Error, context?: Record<string, unknown>) => 
  logger.error(message, error, context);
