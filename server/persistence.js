const fs = require('fs');
const path = require('path');

// Where the saved state lives on disk. Kept in its own "data" folder so it's
// easy to .gitignore (this file is generated at runtime, not source code).
const STATE_FILE = path.join(__dirname, 'data', 'state.json');

// Writes the current state (and the session ID counter) to disk, so it can
// be restored the next time the server starts.
// Takes nextSessionId as a separate argument because it lives in state.js
// as its own variable, not as a field on the state object itself.
function saveState(state, nextSessionId) {
    try {
        // Create the "data" folder if it doesn't exist yet (e.g. first run)
        fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });

        const toSave = { state, nextSessionId };
        fs.writeFileSync(STATE_FILE, JSON.stringify(toSave, null, 2));
    } catch (err) {
        console.error('Failed to save state:', err);
    }
}

// Reads the previously saved state from disk.
// Returns null if there's nothing saved yet (e.g. first ever run) or if the
// file can't be read/parsed for some reason - callers should fall back to
// a default empty state in that case.
function loadState() {
    try {
        const raw = fs.readFileSync(STATE_FILE, 'utf-8');
        return JSON.parse(raw); // { state, nextSessionId }
    } catch (err) {
        return null;
    }
}

module.exports = { saveState, loadState };