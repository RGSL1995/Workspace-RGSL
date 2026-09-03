import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useSocket = (userId: string | undefined) => {
  const socketRef = useRef<Socket | null>(null);
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!userId) return;

    console.log(`🔗 [SOCKET HOOK] Connecting for user: ${userId}`);

    // Connect to Socket.io server
    const socket = io(API_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`✅ [SOCKET HOOK] Connected: ${socket.id}`);
      connectedRef.current = true;

      // Authenticate with server
      socket.emit('auth', userId);
      console.log(`🔐 [SOCKET HOOK] Sent auth with userId: ${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ [SOCKET HOOK] Disconnected`);
      connectedRef.current = false;
    });

    socket.on('error', (error) => {
      console.error(`❌ [SOCKET HOOK] Error:`, error);
    });

    return () => {
      console.log(`🔌 [SOCKET HOOK] Cleaning up socket connection`);
      socket.disconnect();
    };
  }, [userId]);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current && connectedRef.current) {
      socketRef.current.emit(event, data);
    } else {
      console.warn(`⚠️ [SOCKET HOOK] Socket not connected, cannot emit ${event}`);
    }
  }, []);

  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback((event: string, callback?: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  return {
    socket: socketRef.current,
    connected: connectedRef.current,
    emit,
    on,
    off,
  };
};
