// Initialize the fullscreen button utility
addFullscreenButton();

// Establish Socket.IO connection with the server
const socket = io();

// Listen for real-time state updates from the server and render the current flag status
socket.on('state', (state) => {
    renderFlag(state);
});