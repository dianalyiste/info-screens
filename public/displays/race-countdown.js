// Initialize the fullscreen button utility
addFullscreenButton();
let timerInterval = null;

// Establish Socket.IO connection with the server
const socket = io();

// Listen for state updates from the server, update countdown immediately, and set an interval to tick every second
socket.on('state', (state) => {
    renderCountdown(state);

    if (timerInterval) {
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => renderCountdown(state), 1000);
});

// Listen for fullscreen state changes to toggle a body class for styling adjustments
document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement) {
        document.body.classList.add("is-fullscreen");
    } else {
        document.body.classList.remove("is-fullscreen");
    }
});

// Function to calculate and render the remaining time for the current race session
function renderCountdown(state) {
    const timerEl = document.getElementById('timer');
    const labelEl = document.getElementById('countdown-label');
    if (!timerEl) return;

    const session = state.current;

    // Handle case where no active race is currently running
    if (!session) {
        timerEl.textContent = '--:--';
        labelEl.textContent = 'No race in progress';
        return;
    }

    // Update label and calculate remaining time based on the target end timestamp
    if (labelEl) labelEl.textContent = 'Time remaining:';
    timerEl.textContent = formatCountdown(session.timerEndsAt - Date.now());
}