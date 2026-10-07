const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`🚀 RestaurantOS API Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = server;
