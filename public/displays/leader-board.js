// Initialize the fullscreen button utility
addFullscreenButton();
let timerInterval = null;

// Establish Socket.IO connection with the server
const socket = io();

// Listen for real-time state updates from the server
socket.on('state', (state) => {
    console.log('Received state:', state);
    render(state);
});

// Helper function to generate the status text message based on the race state
function statusText(state) {
    if (!state.current) {
        return state.lastFinished ? 'Results from the last race session' : 'No race has run yet.';
    }
    if (state.current.mode === 'finish') {
        return 'Race finished — waiting for cars to return to pit lane.';
    }
    return 'Race in progress';
}

// Main render function to update the leaderboard DOM elements
function render(state) {
    const session = state.current || state.lastFinished;
    const statusEl = document.getElementById('status-text');
    const rowsEl = document.getElementById('rows');
    const timerEl = document.getElementById('timer');
    const raceStatusEl = document.getElementById('race-status');
    const tableEl = document.getElementById('results-table');
    const timerRowEl = document.getElementById('timer-row');

    // Clear any existing countdown timer interval to prevent overlapping timers
    clearInterval(timerInterval);

    // If no session exists at all, hide tables/timers and display status
    if (!session) {
        raceStatusEl.classList.remove('mode-finish');
        raceStatusEl.style.setProperty('--mode-color', 'transparent');
        if (statusEl) statusEl.textContent = statusText(state);
        if (rowsEl) rowsEl.innerHTML = '';
        tableEl.style.display = 'none';
        timerRowEl.style.display = 'none';
        return;
    }

    // Make sure results table is visible when a session exists
    tableEl.style.display = '';

    // Apply finish flag styling ONLY if there is a currently active race session in finish mode
    const activeRace = state.current;
    raceStatusEl.classList.toggle('mode-finish', activeRace && activeRace.mode === 'finish');
    raceStatusEl.style.setProperty('--mode-color', (activeRace && activeRace.mode) ? `var(--flag-${activeRace.mode})` : 'transparent');

    // Update status text display
    if (statusEl) statusEl.textContent = statusText(state);

    // Handle countdown timer for active races, or reset it if viewing past results
    if (state.current) {
        timerInterval = setInterval(() => {
            const remaining = session.timerEndsAt - Date.now();
            if (timerEl) timerEl.textContent = formatCountdown(remaining);
        }, 250);
    } else {
        if (timerEl) timerEl.textContent = '00:00';
    }

    // Sort drivers based on their fastest lap time (fastest first)
    const drivers = [...session.drivers].sort((a, b) => {
        const lapA = session.laps[a.car];
        const lapB = session.laps[b.car];
        const fastA = lapA && lapA.fastestMs !== null ? lapA.fastestMs : Infinity;
        const fastB = lapB && lapB.fastestMs !== null ? lapB.fastestMs : Infinity;
        return fastA - fastB;
    });

    // Render table rows for each driver
    if (rowsEl) {
        rowsEl.innerHTML = drivers
            .map((d, i) => {
                const lap = session.laps[d.car] || { count: 0, fastestMs: null };

                // Completed laps: 1st crossing starts the lap, so completed laps = count - 1 (min 0)
                const completedLaps = lap.count > 1 ? lap.count - 1 : 0;

                // Show lap time only after at least one full lap is completed (count > 1)
                const displayTime = (lap.count > 1 && lap.fastestMs !== null) ? formatLapTime(lap.fastestMs) : '-';

                return `<tr>
                    <td>${i + 1}</td>
                    <td>${d.car}</td>
                    <td>${d.name}</td>
                    <td>${displayTime}</td>
                    <td>${completedLaps}</td>
                    </tr>`;
            })
            .join('');
    }
}