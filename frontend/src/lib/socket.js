import { io } from 'socket.io-client';

let socket;
export function getSocket() {
  if (!socket) socket = io(process.env.NEXT_PUBLIC_WA_SERVER_URL || 'http://localhost:4001', { autoConnect: false });
  return socket;
}
export function waitForSocket(timeout = 10000) {
  const client = getSocket();
  if (client.connected) return Promise.resolve(client);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('WhatsApp service is not connected.')), timeout);
    client.once('connect', () => { clearTimeout(timer); resolve(client); });
    client.connect();
  });
}
export async function emitAck(event, payload, timeout = 60000) {
  const client = await waitForSocket();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('WhatsApp request timed out.')), timeout);
    client.emit(event, payload, (result) => { clearTimeout(timer); resolve(result); });
  });
}
