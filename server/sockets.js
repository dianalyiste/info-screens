const { access_keys } = require('./auth');
const { saveState } = require('./persistence');
const { state, available_car_numbers, createSession, freeCarsForSession, getNextSessionId } = require('./state');

// Timer length depends on which npm script started the server (start = 10 min, dev = 1 min)
const isDevMode = process.env.npm_lifecycle_event === 'dev';
const race_duration_ms = isDevMode ? 1 * 60 * 1000 : 10 * 60 * 1000;

// Holds the current race's auto-finish timer, so it can be cancelled if needed
let raceTimer = null;

function registerSocketHandlers(io) {
    // Sends the current state to every connected client, AND saves it to disk
    // so that it can be restored if the server restarts.
    // Defined here (once per server start) instead of once per connection,
    // since it only needs "io" - not anything specific to a single socket.
    function broadcastState() {
        saveState(state, getNextSessionId());
        io.emit('state', state);
    }

    // If a race was still running when the server was last stopped, its
    // auto-finish timer was lost (setTimeout does not survive a restart).
    // This re-creates that timer using the saved timerEndsAt, so the race
    // still finishes at the correct time instead of running forever.
    function resumeRaceTimerIfNeeded() {
        if (!state.current) return;                  // no race was running
        if (state.current.mode === 'finish') return;  // already finished, nothing to resume

        const remaining = state.current.timerEndsAt - Date.now();

        if (remaining <= 0) {
            // The server was down for longer than the race would have lasted -
            // the race is already over, so just mark it as finished.
            state.current.mode = 'finish';
            broadcastState();
            return;
        }

        raceTimer = setTimeout(() => {
            if (state.current && state.current.mode !== 'finish') {
                state.current.mode = 'finish';
                broadcastState();
            }
        }, remaining);
    }

    // Run this once, right when the server starts (not per connection).
    resumeRaceTimerIfNeeded();

    io.on('connection', (socket) => {
        console.log('New connection:', socket.id);

        // Immediately send the current state, so the client has data right away
        socket.emit('state', state);

        // Each connected socket tracks its OWN authenticated role separately
        let authenticatedRole = null;

        socket.on('authenticate', ({ role, key }) => {
            const isCorrect = access_keys[role] && access_keys[role] === key;

            // If an incorrect access key is entered, the server must wait 500ms before responding.
            setTimeout(() => {
                if (isCorrect) {
                    authenticatedRole = role;
                    socket.emit('authenticated', { ok: true });
                } else {
                    socket.emit('authenticated', { ok: false, message: 'Incorrect access key. Please try again.' });
                }
            }, 500);
        });

        function requireRole(role) {
            return authenticatedRole === role;
        }

        // Add race sessions.
        socket.on('add-session', () => {
            if (!requireRole('receptionist')) return;
            state.queue.push(createSession());
            broadcastState();
        });

        // Remove race sessions.
        socket.on('remove-session', (sessionId) => {
            if (!requireRole('receptionist')) return;
            state.queue = state.queue.filter((s) => s.id !== sessionId);
            broadcastState();
        });

        // Add race drivers.
        socket.on('add-driver', ({ sessionId, name }) => {
            if (!requireRole('receptionist')) return;
            const session = state.queue.find((s) => s.id === sessionId);
            if (!session) return;

            const cleanName = (name || '').trim();
            if (!cleanName) return;

            // Name must be unique within this session (case-insensitive check)
            const alreadyExists = session.drivers.some(
                (d) => d.name.toLowerCase() === cleanName.toLowerCase()
            );
            if (alreadyExists) {
                socket.emit('action-error', {
                    context: 'add',
                    sessionId: sessionId,
                    message: 'That driver name is already used in this session.' 
                });
                return;
            }

            const free = freeCarsForSession(session);
            if (free.length === 0) {
                socket.emit('action-error', { 
                    context: 'add',
                    sessionId: sessionId,
                    message: 'This session is full (8 drivers max).' });
                return;
            }

            session.drivers.push({ name: cleanName, car: free[0] });
            broadcastState();
        });

        // Remove race drivers.
        socket.on('remove-driver', ({ sessionId, name }) => {
            if (!requireRole('receptionist')) return;
            const session = state.queue.find((s) => s.id === sessionId);
            if (!session) return;
            session.drivers = session.drivers.filter((d) => d.name !== name);
            broadcastState();
        });

        // Edit race drivers.
        socket.on('edit-driver', ({ sessionId, oldName, newName, car }, callback) => {
            if (!requireRole('receptionist')) {
                if (typeof callback === 'function') callback({ ok: false, message: 'Unauthorized action.' });
                return;
            }

            const session = state.queue.find((s) => s.id === sessionId);
            if (!session) {
                if (typeof callback === 'function') callback({ ok: false, message: 'Session not found.' });
                return;
            }

            const driver = session.drivers.find((d) => d.name === oldName);
            if (!driver) {
                if (typeof callback === 'function') callback({ ok: false, message: 'Driver not found.' });
                return;
            }
            
            // Rename, if a new name was given and it's not already taken
            const cleanName = (newName || '').trim();
            if (cleanName) {
                const clash = session.drivers.some((d) => d !== driver && d.name.toLowerCase() === cleanName.toLowerCase());
                if (clash) {
                    if (typeof callback === 'function') callback({ ok: false, message: 'That driver name is already used in this session.' });
                    return;
                }
                driver.name = cleanName;
            }

            // Reassign car, if a valid and free car number was given
            if (car !== undefined && car !== null) {
                const carNum = Number(car);
                const takenBySomeoneElse = session.drivers.some((d) => d !== driver && d.car === carNum);

                if (!available_car_numbers.includes(carNum)) {
                    if (typeof callback === 'function') callback({ ok: false, message: 'Invalid car number.' });
                    return;
                } 
                if (takenBySomeoneElse) {
                    if (typeof callback === 'function') callback({ ok: false, message: 'That car number is already taken in this session.' });
                    return;
                } 

                driver.car = carNum;
                
            }

            broadcastState();
            if (typeof callback === 'function') callback({ ok: true });
        });

        // Start race.
        socket.on('start-race', () => {
            if (!requireRole('safety')) return;
            if (state.current) return;              // race already running
            if (state.queue.length === 0) return;   // nothing to start

            const session = state.queue.shift();    // takes the next session from the queue
            session.mode = 'safe';
            session.timerEndsAt = Date.now() + race_duration_ms;

            // Set up empty lap tracking for every car
            available_car_numbers.forEach((n) => {
                session.laps[n] = { count: 0, fastestMs: null };
            });

            state.current = session;
            broadcastState();

            // Automatically switch to "finish" mode when the timer runs out
            raceTimer = setTimeout(() => {
                if (state.current && state.current.id === session.id && state.current.mode !== 'finish') {
                    state.current.mode = 'finish';
                    broadcastState();
                }
            }, race_duration_ms);
        });

        // Set race mode.
        socket.on('set-mode', ({ mode }) => {
            if (!requireRole('safety')) return;
            if (!state.current) return;
            if (state.current.mode === 'finish') return;    // finish is permanent
            if (!['safe', 'hazard', 'danger', 'finish'].includes(mode)) return;

            state.current.mode = mode;
            if (mode === 'finish' && raceTimer) clearTimeout(raceTimer);
            broadcastState();
        });

        // End session.
        socket.on('end-session', () => {
            if (!requireRole('safety')) return;
            if (!state.current || state.current.mode !== 'finish') return;

            state.lastFinished = state.current; // keep results visible for displays
            state.current = null;
            state.idleFlagMode = 'danger';
            broadcastState();
        });

        // Record lap.
        socket.on('record-lap', (carNumber) => {
            if (!requireRole('observer')) return;
            if (!state.current) return;

            const carNum = Number(carNumber);
            const lap = state.current.laps[carNum];
            if (!lap) return;

            // First crossing: this just starts lap 1's timer, no lap time to record yet
            const now = Date.now();
            if (!lap._lastCrossingAt) {
                lap._lastCrossingAt = now;
                lap.count += 1;
                broadcastState();
                return;
            }

            // Every crossing after the first: calculate how long that lap took
            const lapTimeMs = now - lap._lastCrossingAt;
            lap._lastCrossingAt = now;
            lap.count += 1;

            if (lap.fastestMs === null || lapTimeMs < lap.fastestMs) {
                lap.fastestMs = lapTimeMs;
            }

            broadcastState();
        });

        socket.on('disconnect', () => {
            console.log('Connection lost:', socket.id);
        });
    });
}

module.exports = { registerSocketHandlers };