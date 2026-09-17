const express = require('express');
const path = require('path');

// Group related routes in their own file,
const router = express.Router();

// Homepage: shows links to every interface.
router.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Beachside Racetrack</title>
            <link rel="stylesheet" href="/displays/shared.css">
            <link rel="stylesheet" href="/shared/buttons.css">
            <style>
                body { max-width: 500px; }
                ul { list-style: none; padding: 0; }
                li { margin: 10px 0; }
                a {
                    display: block;
                    padding: 12px 16px;
                    background: #2c3e50;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                }
                a:hover { background: #34495e; }
                h2 { margin-top: 30px; }
            </style>
        </head>
        <body>
            <h1>Beachside Racetrack</h1>
            <h2>Employee interfaces (need an access key)</h2>
            <ul>
                <li><a href="/front-desk">Front Desk (Receptionist)</a></li>
                <li><a href="/race-control">Race Control (Safety Official)</a></li>
                <li><a href="/lap-line-tracker">Lap-line Tracker (Lap-line Observer)</a></li>
            </ul>
            <h2>Public displays</h2>
            <ul>
                <li><a href="/leader-board">Leader Board</a></li>
                <li><a href="/next-race">Next Race</a></li>
                <li><a href="/race-countdown">Race Countdown</a></li>
                <li><a href="/race-flags">Race Flags</a></li>
            </ul>
        </body>
        </html>
    `);
});

// --- Employee interfaces (require an access key) ---

router.get('/front-desk', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'employee', 'front-desk.html'));
});

router.get('/race-control', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'employee', 'race-control.html'));
});

router.get('/lap-line-tracker', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'employee', 'lap-line-tracker.html'));
});

// --- Public displays ---

router.get('/leader-board', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'displays', 'leader-board.html'));
});

router.get('/next-race', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'displays', 'next-race.html'));
});

router.get('/race-countdown', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'displays', 'race-countdown.html'));
});

router.get('/race-flags', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'displays', 'race-flags.html'));
});

module.exports = router;