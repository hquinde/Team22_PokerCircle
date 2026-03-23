import io from 'socket.io-client';
import { BACKEND_URL } from '../config/api';

export const socket = io(BACKEND_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
  withCredentials: true,
});

socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('disconnect', (reason: any) => {
  console.log('Socket disconnected:', reason);
});

socket.on('reconnect', (attempt: any) => {
  console.log('Socket reconnected after attempt:', attempt);
});

socket.on('connect_error', (err: any) => {
  console.log('Socket connection error:', err.message);
});
