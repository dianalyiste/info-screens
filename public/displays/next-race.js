// Initialize the fullscreen button utility
addFullscreenButton();

// Establish Socket.IO connection with the server
const socket = io();

// Listen for real-time state updates from the server and trigger rendering
socket.on('state', (state) => {
    render(state);
});

// Main render function to update the view based on the current race state and queue
function render(state) {
    const messageEl = document.getElementById('message');
    const rowsEl = document.getElementById('rows');
    const tableEl = document.getElementById('drivers-table');

    // Ensure the drivers table is visible by default
    tableEl.style.display = '';

    // Check if the current race is finishing and adjust messaging accordingly
    if (state.current && state.current.mode === 'finish') {
        if (state.next || (state.queue && state.queue.length > 0)) {
            messageEl.textContent = "Current race is finishing — you're up next shortly.";
        } else {
            messageEl.textContent = "Current race is finishing. No further races scheduled.";
            tableEl.style.display = 'none';
        }
        return;
    }

    // Get the next upcoming session from the queue (if any)
    const session = state.queue && state.queue.length > 0 ? state.queue[0] : null;

    // Handle case where neither an active race nor any upcoming sessions exist
     if (!session && !state.current) {
         messageEl.textContent = 'No upcoming race session has been configured yet.';
         rowsEl.innerHTML = '';
         tableEl.style.display = 'none';
         return;
     }

    // Handle case where there are no more scheduled sessions after the current one
     if (!session) {
         messageEl.textContent = 'No further race sessions scheduled after this race.';
         tableEl.style.display = 'none';
         return;
     }

    // Check if the upcoming session has registered drivers
     const hasDrivers = session.drivers && session.drivers.length > 0;

     if (!hasDrivers) {
         messageEl.textContent = 'New session created — awaiting driver registrations.';
         rowsEl.innerHTML = '';
         tableEl.style.display = 'none';
         return;
     }

    // Set appropriate instructions based on whether a race is currently running
     if (!state.current) {
         messageEl.textContent = 'Drivers: please proceed to the paddock.';
     } else {
         messageEl.textContent = 'This session is up after the current race.';
     }

    // Render the list of drivers for the upcoming session into the table
    rowsEl.innerHTML = session.drivers
    .map((d) => `<tr><td>${d.name}</td><td>${d.car}</td></tr>`)
    .join('');
}
