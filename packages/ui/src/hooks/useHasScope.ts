'use client';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * Single shared Socket.IO instance (lazy-initialised).
 * Always connects to the public API gateway (Kong) on the same origin.
 */
let socket: Socket | undefined;

function getSocket(): Socket {
  if (!socket) {
    // Obtener userId del access_token si existe
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    let userId: string | undefined;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub || payload.userId || payload.id;
      } catch {}
    }

    socket = io('/', {
      path: '/socket.io',
      transports: ['websocket'],
      autoConnect: true,
      withCredentials: true,
      query: userId ? { userId } : undefined,
    });
  }
  return socket;
}

/**
 * React hook that returns a boolean indicating if the current user owns a given scope.
 * Scopes are streamed from the AuthGateway via the `scopes` event.
 *
 * Usage: const canEdit = useHasScope('user:update');
 */
export function useHasScope(scope: string): boolean {
  const [scopes, setScopes] = useState<string[]>([]);

  useEffect(() => {
    const s = getSocket();

    const handleScopes = (incoming: string[]) => {
      setScopes(incoming);
    };

    s.on('scopes', handleScopes);

    // Request scopes proactively in case already connected
    s.emit('request_scopes');

    return () => {
      s.off('scopes', handleScopes);
    };
  }, []);

  return scopes.includes(scope);
}
