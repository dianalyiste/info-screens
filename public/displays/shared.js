// Helper function to split total milliseconds into minutes and seconds components
function splitTime(ms) {
    const totalMs = Math.round(ms);
    return {
        mins: Math.floor(totalMs / 60000),
        secs: (totalMs % 60000) / 1000,
    };
}

// Format remaining milliseconds into a standard MM:SS countdown string
function formatCountdown(ms) {
    if (ms <= 0) return '00:00';
    const { mins, secs } = splitTime(ms);
    return String(mins).padStart(2, '0') + ':' + String(Math.floor(secs)).padStart(2, '0');
}

// Format a lap time in milliseconds into a readable string with precise decimal seconds
function formatLapTime(ms) {
    if (ms === null || ms === undefined || ms === Infinity) return '--.--';
    const { mins, secs } = splitTime(ms);
    const secsText = secs.toFixed(3);
    return mins > 0 ? `${mins}:${secsText.padStart(6, '0')}` : secsText;
}

// Dynamically create and inject a fullscreen toggle button into the page
function addFullscreenButton() {
    const btn = document.createElement('button');
    btn.textContent = 'Fullscreen';
    btn.className = 'btn-fullscreen';
    btn.onclick = () => document.documentElement.requestFullscreen();
    document.body.appendChild(btn);

    // Hide the button when fullscreen mode is active, show it otherwise
    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            btn.style.display = 'none';
        } else {
            btn.style.display = 'block';
        }
    });
}

// Render the current race flag status (or idle flag mode) by updating the element's CSS class
function renderFlag(state) {
    const el = document.getElementById('flag-display');
    if (!el) return;
    const m = state.current?.mode || state.idleFlagMode || 'danger';
    el.className = 'flag-' + m;
}