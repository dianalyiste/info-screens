// Read the three access keys from environment variables (set via .env file)
const receptionist_key = process.env.receptionist_key;
const observer_key = process.env.observer_key;
const safety_key = process.env.safety_key;

// Check that all three access keys exist before the server is allowed to start
function checkKeysOrExit() {
    // If ANY of the three keys is missing, stop the server completely
    if (!receptionist_key || !observer_key || !safety_key) {
        console.error('\nERROR: Missing access key environment variables.\n');
        console.error('Please create a .env file in the project root with:\n');
        console.error('  receptionist_key=your_key_here');
        console.error('  observer_key=your_key_here');
        console.error('  safety_key=your_key_here\n');
        console.error('See .env.example for reference, then run npm start again\n')

        // Exit code 1 means "stopped due to an error"
        process.exit(1);
    }
}

// Group the keys into one object, keyed by role name.
// This makes it easy to check "does this role's key match?" elsewhere in the code.
const access_keys = {
    receptionist: receptionist_key,
    observer: observer_key,
    safety: safety_key,
};

// Make these available to other files (server/index.js and server/sockets.js)
module.exports = {
    checkKeysOrExit,
    access_keys,
};