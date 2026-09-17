const modeColors = {
    safe: 'rgb(4, 171, 4)',
    hazard: '#f1c40f',
    danger: '#c0392b',
    finish: '#2c3e50'
};

let currentTimerEndsAt = null;

// Ticks every second to show a live countdown, independently of server state updates
setInterval(function() {
    if (currentTimerEndsAt) {
        const remainingMs = currentTimerEndsAt - Date.now();
        const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));

        const minutes = Math.floor(remainingSec / 60);
        const seconds = remainingSec % 60;

        const secondsFormatted = seconds < 10 ? '0' + seconds : seconds;

        document.getElementById('timer').textContent = 'Time remaining ' + minutes + ':' + secondsFormatted;
    } else {
        document.getElementById('timer').textContent = '';
    }
}, 1000);