import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface WebSocketMessage {
  type: string;
  data: any;
}

export const useWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/v1/ws?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'trip.status_changed':
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            toast.success(`Trip #${message.data.id} is now ${message.data.status}`);
            break;
          case 'vehicle.status_changed':
            queryClient.invalidateQueries({ queryKey: ['fleet'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            toast.success(`Vehicle #${message.data.id} is now ${message.data.status}`);
            break;
          default:
            console.log('Unknown websocket message type:', message.type);
        }
      } catch (error) {
        console.error('Error parsing websocket message', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    return () => {
      ws.close();
    };
  }, [queryClient]);

  return wsRef.current;
};
