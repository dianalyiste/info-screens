const { loadState } = require('./persistence');

// The full list of car numbers that exist at the track (up to 8 drivers per race)
const available_car_numbers = [1, 2, 3, 4, 5, 6, 7, 8];

// The state the app starts with if there is nothing saved on disk yet
// (e.g. the very first time the server is ever run).
const defaultState = {
    queue: [],                // Upcoming race sessions, waiting to start
    current: null,            // The session currently racing (null = no race happening)
    lastFinished: null,       // Results of the last finished race, kept visible until the next one starts
    idleFlagMode: 'danger',   // No race running - race mode "danger"
};

// Try to load a previously saved state from disk. If the file doesn't exist
// yet (first run) or can't be read, fall back to the default empty state.
const saved = loadState();

// One shared object that holds everything about the current race state.
// All connected clients (employees and displays) read from this same data.
const state = saved ? saved.state : defaultState;

// Counter used to give each new session a unique ID.
// This must also be restored from disk - otherwise, after a restart, new
// sessions could be created with IDs that already exist in the queue.
let nextSessionId = saved ? saved.nextSessionId : 1;

// Creates a brand new, empty race session
function createSession() {
    return {
        id: nextSessionId++,    // Unique ID, then increments the counter for next time
        drivers: [],            // [{ name, car }]
        mode: null,             // 'safe' | 'hazard' | 'danger' | 'finish'
        timerEndsAt: null,      // timestamp (ms) for when the race timer reaches 0
        laps: {},               // { [carNumber]: { count: number, fastestMs: number|null } }
    };
}

// Returns the list of car numbers not yet assigned to a driver in this session
function freeCarsForSession(session) {
    const used = session.drivers.map((d) => d.car);                 // cars already taken
    return available_car_numbers.filter((n) => !used.includes(n));  // cars still free
}

// Returns the current value of the session ID counter, so it can be saved
// to disk alongside the state (see server/persistence.js).
function getNextSessionId() {
    return nextSessionId;
}

// Make these available to other files (server/index.js and server/sockets.js)
module.exports = {
    state,
    available_car_numbers,
    createSession,
    freeCarsForSession,
    getNextSessionId,
};