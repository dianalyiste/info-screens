// Connect to the server via Socket.IO
const socket = io();

// Set up login form handling for this interface (observer role)
setupAuth(socket, 'observer');

// Send a "lap crossed" event for the corresponding car when its button is pressed
for (let i = 1; i <= 8; i++) {
    document.getElementById('car-btn-' + i).addEventListener('click', function() {
        socket.emit('record-lap', i);
    });
}

// Enable only the buttons for cars actually assigned in this session; disable the rest
function updateButtonStates(assignedCars) {
    for (let i = 1; i <= 8; i++) {
        const isAssigned = assignedCars.includes(i);
        document.getElementById('car-btn-' + i).disabled = !isAssigned;
    }
}

// Update the status message and button state whenever the server sends an updated state
socket.on('state', (state) => {
    let html = '';

    // No race running: nothing to record, so disable all buttons
    if (state.current == null) {
        html += '<p>No race in progress</p>';
        updateButtonStates([]); 
        currentTimerEndsAt = null;
        document.getElementById('race-status').style.setProperty('--mode-color', 'transparent');
    }

    // Race is finished, but the session hasn't ended yet — laps can still be recorded
    else if (state.current.mode === 'finish') {
        html += '<p>Race finished: Session #' + state.current.id + '</p>';
        const assignedCars = state.current.drivers.map(d => d.car);
        updateButtonStates(assignedCars);
        currentTimerEndsAt = null;
        document.getElementById('race-status').style.setProperty('--mode-color', modeColors[state.current.mode]);
    }

    // Race is running normally (safe/hazard/danger)
    else {
        html += '<p>Race in progress: Session #' + state.current.id + '</p>';
        html += '<p>Mode: ' + state.current.mode + '</p>';
        const assignedCars = state.current.drivers.map(d => d.car);
        updateButtonStates(assignedCars);
        currentTimerEndsAt = state.current.timerEndsAt;
        document.getElementById('race-status').style.setProperty('--mode-color', modeColors[state.current.mode]);
    }

    document.getElementById('race-status').innerHTML = html;
});


