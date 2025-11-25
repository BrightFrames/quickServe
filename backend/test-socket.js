// Quick test to verify Socket.IO is working
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('✓ Socket connected:', socket.id);
});

socket.on('new-order', (order) => {
  console.log('✓ Received new-order event:', order.orderNumber);
});

socket.on('disconnect', () => {
  console.log('✗ Socket disconnected');
});

socket.on('connect_error', (error) => {
  console.error('✗ Connection error:', error.message);
});

console.log('Testing Socket.IO connection to http://localhost:3000...');
console.log('Waiting for events... (Press Ctrl+C to exit)');

// Keep process alive
setTimeout(() => {
  console.log('\nTest completed. Socket still connected:', socket.connected);
}, 10000);
