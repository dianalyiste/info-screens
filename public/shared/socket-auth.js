// Sets up the login form and listens for the server's authentication response.

function setupAuth(socket, role) {
    document.querySelector('form').addEventListener('submit', function(event) {
        event.preventDefault(); // stop the page from reloading
        
        const accessKey = document.getElementById('access-key').value;
        socket.emit('authenticate', { role: role, key: accessKey });
    });

    socket.on('authenticated', (response) => {
        if (response.ok) {
            document.getElementById('auth-overlay').style.display = 'none';
            document.getElementById('app-content').classList.remove('locked');
            document.getElementById('auth-error').textContent = '';
        } else {
            document.getElementById('auth-error').textContent = response.message;
        }
    });
}