
import { LogEntry, Severity } from '../types';

// In-memory storage for logs (could be replaced with localStorage or API backend)
let logs: LogEntry[] = [];

// Helper to mask sensitive data
const maskData = (data: any) => {
  if (!data) return data;
  try {
    const masked = JSON.parse(JSON.stringify(data)); // Deep copy
    if (masked.password) masked.password = '********';
    if (masked.token) masked.token = '********';
    if (masked.creditCard) masked.creditCard = '****-****-****-****';
    return masked;
  } catch (e) {
    return data;
  }
};

// Helper to get device info
const getDeviceInfo = () => {
  return navigator.userAgent;
};

export const logger = {
  log: (
    severity: Severity,
    message: string,
    context: {
      errorCode?: string;
      functionName?: string;
      userId?: string;
      requestData?: any;
      error?: Error | unknown;
    } = {}
  ) => {
    const entry: LogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      severity,
      message,
      errorCode: context.errorCode || 'UNKNOWN',
      functionName: context.functionName || 'Anonymous',
      userId: context.userId || 'guest',
      deviceType: getDeviceInfo(),
      requestData: maskData(context.requestData),
      stackTrace: context.error instanceof Error ? context.error.stack : String(context.error),
    };

    // Add to beginning of array
    logs.unshift(entry);

    // Limit log size in memory to prevent overflow (e.g., last 1000 logs)
    if (logs.length > 1000) {
      logs = logs.slice(0, 1000);
    }

    // Console output for dev debugging
    const consoleStyle = {
      'INFO': 'color: #2563eb',
      'WARNING': 'color: #d97706',
      'ERROR': 'color: #dc2626',
      'CRITICAL': 'color: #dc2626; font-weight: bold; font-size: 1.2em'
    };

    console.groupCollapsed(`%c[${severity}] ${message}`, consoleStyle[severity] || '');
    console.log('Details:', entry);
    if (context.error) console.error(context.error);
    console.groupEnd();

    // Alert on Critical
    if (severity === 'CRITICAL') {
      console.error('CRITICAL ALERT TRIGGERED:', entry);
    }
  },

  getLogs: (filter?: { severity?: Severity; search?: string }) => {
    let filteredLogs = [...logs];

    if (filter?.severity) {
        // Only filter if severity is provided (and logically handled by caller if 'ALL' is passed as undefined or handled prior)
        filteredLogs = filteredLogs.filter(log => log.severity === filter.severity);
    }

    if (filter?.search) {
      const lowerSearch = filter.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(lowerSearch) ||
        (log.functionName && log.functionName.toLowerCase().includes(lowerSearch)) ||
        (log.userId && log.userId.toLowerCase().includes(lowerSearch)) ||
        (log.errorCode && log.errorCode.toLowerCase().includes(lowerSearch))
      );
    }

    return filteredLogs;
  },
  
  clearLogs: () => { 
    logs = []; 
  },

  exportLogs: () => {
    const csvHeader = ["ID,Timestamp,Severity,Message,Error Code,Function,User,Device,Request Data,Stack Trace"].join(",");
    const csvRows = logs.map(e => {
        const escape = (str: string | undefined) => `"${(str || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        return [
          e.id, 
          e.timestamp, 
          e.severity, 
          escape(e.message),
          e.errorCode,
          e.functionName,
          e.userId,
          escape(e.deviceType),
          escape(JSON.stringify(e.requestData)),
          escape(e.stackTrace)
        ].join(",");
      });
    
    const csvContent = "data:text/csv;charset=utf-8," + [csvHeader, ...csvRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `system_logs_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
