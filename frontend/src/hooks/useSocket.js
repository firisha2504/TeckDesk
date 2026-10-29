import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '/';

let socketInstance = null;

export function getSocket() {
  const token = localStorage.getItem('techdesk_token');
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  } else if (token && socketInstance.auth?.token !== token) {
    socketInstance.auth = { token };
    socketInstance.disconnect().connect();
  }
  return socketInstance;
}

export function useSocket(eventHandlers = {}) {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [eventHandlers]);

  const joinTicket = (ticketId) => {
    if (socketRef.current && ticketId) {
      socketRef.current.emit('ticket:join', ticketId);
    }
  };

  const leaveTicket = (ticketId) => {
    if (socketRef.current && ticketId) {
      socketRef.current.emit('ticket:leave', ticketId);
    }
  };

  return {
    socket: socketRef.current,
    joinTicket,
    leaveTicket,
  };
}
