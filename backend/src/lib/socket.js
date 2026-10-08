const http = require('http');
const socketIO = require('socket.io');

let io;

/**
 * Initialize Socket.IO with the HTTP server
 */
function initializeSocketIO(server) {
  io = socketIO(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`✓ WebSocket client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`✗ WebSocket client disconnected: ${socket.id}`);
    });

    // Join a room for specific updates
    socket.on('join-room', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('leave-room', (room) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room: ${room}`);
    });
  });

  return io;
}

/**
 * Get the Socket.IO instance
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocketIO first.');
  }
  return io;
}

/**
 * Emit order status update to all connected clients
 */
function emitOrderStatusUpdate(order) {
  if (io) {
    io.emit('order:status-update', {
      orderId: order.id,
      status: order.status,
      tableId: order.tableId,
      timestamp: new Date().toISOString(),
    });
    console.log(`📡 Emitted order status update: ${order.id} -> ${order.status}`);
  }
}

/**
 * Emit order item status update
 */
function emitOrderItemStatusUpdate(orderItem) {
  if (io) {
    io.emit('order-item:status-update', {
      orderItemId: orderItem.id,
      orderId: orderItem.orderId,
      status: orderItem.status,
      timestamp: new Date().toISOString(),
    });
    console.log(`📡 Emitted order item status update: ${orderItem.id} -> ${orderItem.status}`);
  }
}

/**
 * Emit low stock alert to all connected clients
 */
function emitLowStockAlert(ingredient) {
  if (io) {
    io.emit('inventory:low-stock-alert', {
      ingredientId: ingredient.id,
      name: ingredient.name,
      currentStock: ingredient.currentStock,
      reorderLevel: ingredient.reorderLevel,
      unit: ingredient.unit,
      severity: Number(ingredient.currentStock) === 0 ? 'CRITICAL' : 'WARNING',
      timestamp: new Date().toISOString(),
    });
    console.log(`⚠️  Emitted low stock alert: ${ingredient.name}`);
  }
}

/**
 * Emit new order notification
 */
function emitNewOrder(order) {
  if (io) {
    io.emit('order:new', {
      orderId: order.id,
      tableId: order.tableId,
      status: order.status,
      itemCount: order.items?.length || 0,
      timestamp: new Date().toISOString(),
    });
    console.log(`📡 Emitted new order: ${order.id}`);
  }
}

module.exports = {
  initializeSocketIO,
  getIO,
  emitOrderStatusUpdate,
  emitOrderItemStatusUpdate,
  emitLowStockAlert,
  emitNewOrder,
};
