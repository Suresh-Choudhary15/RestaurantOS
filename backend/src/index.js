const app = require('./app');
const { initializeSocketIO } = require('./lib/socket');
require('dotenv').config();

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`🚀 RestaurantOS API Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

// Initialize WebSocket
initializeSocketIO(server);
console.log('✓ WebSocket server initialized');

module.exports = server;
