import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Terminal } from 'lucide-react';

interface LogEntry {
  type: string;
  level?: 'info' | 'error' | 'warn';
  message: string;
  timestamp: string;
}

export default function ConsoleOutput() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/logs`;

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[ConsoleOutput] WebSocket connected');
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLogs(prev => {
              const newLogs = [...prev, data];
              if (newLogs.length > 200) {
                return newLogs.slice(-200);
              }
              return newLogs;
            });
          } catch (err) {
            console.error('[ConsoleOutput] Failed to parse message:', err);
          }
        };

        ws.onerror = (error) => {
          console.error('[ConsoleOutput] WebSocket error:', error);
          setIsConnected(false);
        };

        ws.onclose = () => {
          console.log('[ConsoleOutput] WebSocket closed, reconnecting...');
          setIsConnected(false);
          setTimeout(connectWebSocket, 2000);
        };
      } catch (err) {
        console.error('[ConsoleOutput] Failed to connect WebSocket:', err);
        setTimeout(connectWebSocket, 2000);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (autoScrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    autoScrollRef.current = isAtBottom;
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogColor = (level?: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'warn':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base font-medium">Backend Console</CardTitle>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearLogs}
          className="h-8"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="p-4 font-mono text-xs space-y-1 h-[300px] overflow-y-auto"
          >
            {logs.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">
                Waiting for console output...
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex gap-2">
                  <span className="text-muted-foreground flex-shrink-0">
                    {formatTime(log.timestamp)}
                  </span>
                  {log.level && (
                    <span className={`flex-shrink-0 w-12 ${getLogColor(log.level)}`}>
                      [{log.level.toUpperCase()}]
                    </span>
                  )}
                  <span className={getLogColor(log.level)}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
