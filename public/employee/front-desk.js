// Connect to the server via Socket.IO
const socket = io();

let editingSessionId = null; 
let editingOriginalName = null;

// Set up login form handling for this interface (receptionist role)
setupAuth(socket, 'receptionist');

// Show a popup whenever the server rejects an action (e.g. duplicate name, session full)
socket.on('action-error', (error) => {
    if (error.context === 'add') {
        document.getElementById('error-text-' + error.sessionId).textContent = error.message;
    }
    else if (error.context === 'edit') {
        document.getElementById('edit-error').textContent = error.message;
    }
});

// Redraw the whole session list every time the server sends an updated state
socket.on('state', (state) => {
    let html = "";

    // Go through each session
    state.queue.forEach(function(session) {
        html += '<div class="session">';

        html += '<div class="session-header">';
        html += '<h3>Session #' + session.id + '</h3>';     // Display race session id
        html += '<button class="btn-danger" onclick="removeSession(' + session.id + ')">Remove Session</button>';      // Button for removing each session
        html += '</div>';

        // List of drivers already added to this session
        html += '<ul class="driver-list">';

        //Go through each driver for the session
        session.drivers.forEach(function(driver) {
            html += '<li>';
            html += '<span>' + driver.name + ' - Car #' + driver.car + '</span>';
            html += '<span class="driver-actions">';
            html += '<button class="btn-secondary" onclick="editDriver(' + session.id + ', \'' + driver.name + '\', ' + driver.car + ')">Edit</button>';
            html += '<button class="btn-danger" onclick="removeDriver(' + session.id + ', \'' + driver.name + '\')">Remove</button>';
            html += '</span>';
            html += '</li>';
        });

        html += '</ul>';

        // Form for adding a new driver to this specific session
        if (session.drivers.length < 8) {
            html += '<div class="add-driver-form">';
            html += '<input type="text" id="driver-name-' + session.id + '" placeholder="Driver name">';
            html += '<button class="btn-primary" onclick="addDriver(' + session.id + ')">Add driver</button>';
            html += '</div>';
            html += '<p id="error-text-' + session.id + '" class="error-text"></p>';
        } else {
            html += '<p>Session full (8/8 drivers)</p>';
        }

        html += '</div>';
    })

    // Display session information
    document.getElementById('sessions-list').innerHTML = html;

    // Functionality to use enter instead of button when adding drivers
    state.queue.forEach(function(session) {
        const input = document.getElementById('driver-name-' + session.id);
        if (input) { 
            input.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    addDriver(session.id);
                }
            });
        }
    });
});

// Create a new empty session when the "add session" button is pressed
document.getElementById('add-session-btn').addEventListener('click', function(event) {
    socket.emit('add-session')
})

document.getElementById('edit-save-btn').addEventListener('click', saveEditedDriver);
document.getElementById('edit-cancel-btn').addEventListener('click', cancelEdit);

// Remove a session by its id
function removeSession(sessionId) {
    socket.emit('remove-session', sessionId);
}

// Add a new driver to a specific session, then clear the input field
function addDriver(sessionId) {
    const input = document.getElementById('driver-name-' + sessionId);
    const name = input.value.trim();

    if (!name) return;

    const errorEl = document.getElementById('error-text-' + sessionId);
    if (errorEl) errorEl.textContent = '';

    socket.emit('add-driver', { sessionId: sessionId, name: name });

    input.value = '';
}

// Remove a driver from a specific session by name
function removeDriver(sessionId, name) {
    socket.emit('remove-driver', { sessionId: sessionId, name: name });
}

// Edit drives name and car nr
function editDriver(sessionId, name, car) {
    editingSessionId = sessionId;
    editingOriginalName = name;

    document.getElementById('edit-name').value = name;
    document.getElementById('edit-car').value = car;
    document.getElementById('edit-error').textContent = '';

    document.getElementById('edit-overlay').style.display = 'flex';
    document.getElementById('app-content').classList.add('locked');
}

function saveEditedDriver() {
    const newName = document.getElementById('edit-name').value.trim();
    const newCar = document.getElementById('edit-car').value;

    socket.emit('edit-driver', {
        sessionId: editingSessionId,
        oldName: editingOriginalName,
        newName: newName,
        car: newCar
    }, function(response) {
        if (response && response.ok) {
            document.getElementById('edit-overlay').style.display = 'none';
            document.getElementById('app-content').classList.remove('locked');
        } else if (response && response.message) {
            document.getElementById('edit-error').textContent = response.message;
        }
    });
}

function cancelEdit() {
    document.getElementById('edit-overlay').style.display = 'none';
    document.getElementById('app-content').classList.remove('locked');
}