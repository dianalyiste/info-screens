// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

// Import our own modules
const { checkKeysOrExit } = require('./auth');
const routes = require('./routes');
const { registerSocketHandlers } = require('./sockets');

// Stop the server here if any access key is missing
checkKeysOrExit();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files (HTML, CSS, client-side JS) from the public folder
app.use(express.static(path.join(__dirname, '..', 'public')));

// Register the HTTP routes (e.g. the homepage with links)
app.use('/', routes);

// Set up all Socket.IO event listeners
registerSocketHandlers(io);

// Start listening for connections
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Beachside Racetrack server running on: http://localhost:${PORT}`);
});