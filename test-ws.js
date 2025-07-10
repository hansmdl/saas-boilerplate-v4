
// Script de prueba WebSocket para scopes via Kong
// Ejecuta: node test-ws.js <USER_ID> <KONG_PORT>

const { io } = require('socket.io-client');

const userId = process.argv[2];
const port = process.argv[3] || 8000; // Cambia a tu puerto de Kong si es diferente

if (!userId) {
  console.error('Debes pasar el USER_ID como argumento. Ejemplo: node test-ws.js <USER_ID> <PORT>');
  process.exit(1);
}

const url = `ws://localhost:${port}/ws/auth?userId=${userId}`;
console.log('Conectando a:', url);

const socket = io(url, {
  transports: ['websocket'],
  reconnection: false,
});

socket.on('connect', () => {
  console.log('Conexión WebSocket exitosa');
});

socket.on('scopes', (scopes) => {
  console.log('Scopes recibidos:', scopes);
  socket.disconnect();
});

socket.on('connect_error', (err) => {
  console.error('Error de conexión:', err.message);
  process.exit(2);
});

socket.on('disconnect', () => {
  console.log('Desconectado');
  process.exit(0);
});
