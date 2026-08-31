import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const useEmailSocket = (userId: string | undefined, onNewEmails: (emails: any[]) => void) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Create socket connection if it doesn't exist
    if (!socket) {
      socket = io('http://localhost:5000', {
        withCredentials: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socket.on('connect', () => {
        console.log('🔗 [SOCKET] Connected to server');
        // Authenticate with server
        socket?.emit('auth', userId);
      });

      socket.on('new-emails', (data: any) => {
        console.log('📧 [SOCKET] Received new emails:', data);
        onNewEmails(data.emails);

        // Show browser notification if available
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Emails', {
            body: `You have ${data.count} new email${data.count !== 1 ? 's' : ''}`,
            tag: 'new-emails',
            icon: '📧',
          });
        }
      });

      socket.on('disconnect', () => {
        console.log('🔌 [SOCKET] Disconnected from server');
      });

      socket.on('error', (error) => {
        console.error('❌ [SOCKET] Error:', error);
      });

      socketRef.current = socket;
    } else if (socket.disconnected) {
      // Reconnect if connection was lost
      socket.connect();
      socket.emit('auth', userId);
    } else {
      // Update auth with new userId
      socket.emit('auth', userId);
    }

    return () => {
      // Don't disconnect on unmount, just keep connection alive
      // This allows real-time updates even when component unmounts
    };
  }, [userId, onNewEmails]);

  return socketRef.current;
};
