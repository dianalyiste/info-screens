// Connect to the server via Socket.IO
const socket = io();

// Set up login form handling for this interface (safety role)
setupAuth(socket, 'safety');

// Start the next session in the queue
document.getElementById('start-race-btn').addEventListener('click', function() {
    socket.emit('start-race');
})

// Race mode buttons: each just tells the server which mode to switch to
document.getElementById('mode-safe-btn').addEventListener('click', function() {
    socket.emit('set-mode', {mode: "safe"});
})

document.getElementById('mode-hazard-btn').addEventListener('click', function() {
    socket.emit('set-mode', {mode: "hazard"});
})

document.getElementById('mode-danger-btn').addEventListener('click', function() {
    socket.emit('set-mode', {mode: "danger"});
})

document.getElementById('mode-finish-btn').addEventListener('click', function() {
    socket.emit('set-mode', {mode: "finish"});
})

// End the current session (only works once mode is 'finish', enforced server-side)
document.getElementById('end-session-btn').addEventListener('click', function() {
    socket.emit('end-session');
})

// Redraw race status and driver list whenever the server sends an updated state
socket.on('state', (state) => {
    let html = '';

    const raceRunning = state.current !== null;
    const raceFinished = raceRunning && state.current.mode === 'finish';

    // Enable/disable buttons depending on the current race state
    document.getElementById('start-race-btn').disabled = raceRunning || state.queue.length === 0;
    document.getElementById('mode-safe-btn').disabled = !raceRunning || raceFinished;
    document.getElementById('mode-hazard-btn').disabled = !raceRunning || raceFinished;
    document.getElementById('mode-danger-btn').disabled = !raceRunning || raceFinished;
    document.getElementById('mode-finish-btn').disabled = !raceRunning || raceFinished;
    document.getElementById('end-session-btn').disabled = !raceFinished;

    // A race is currently running: show its status and drivers
    if (state.current) {
        html += '<p> Race in progress: Session #' + state.current.id + '</p>';
        html += '<p>Mode: ' + state.current.mode + '</p>';

        html += '<ul class="driver-list">';
            state.current.drivers.forEach(function(driver) {
                html += '<li>' + driver.name + ' - Car #' + driver.car + '</li>';
            });
        html += '</ul>';

        document.getElementById('race-status').style.setProperty('--mode-color', modeColors[state.current.mode]);
    }

    // No race running: show the next queued session, if any, so drivers can be briefed
    else {
        html += '<p>No race in progress.</p>';
        if (state.queue.length > 0) {
            html += '<p>Next race: Session #' + state.queue[0].id + '</p>';
            html += '<ul class="driver-list">';
                state.queue[0].drivers.forEach(function(driver) {
                    html += '<li>' + driver.name + ' - Car #' + driver.car + '</li>';
                });
            html += '</ul>';
        } else {
            html += '<p>No next races.</p>';
        }

        document.getElementById('race-status').style.setProperty('--mode-color', 'transparent');
    }

    // Keep the timer's target end-time in sync with the current race (or clear it, if none)
    if (state.current && state.current.mode !== 'finish') {
        currentTimerEndsAt = state.current.timerEndsAt;
    } else {
        currentTimerEndsAt = null;
    }

    document.getElementById('race-status').innerHTML = html;
});




