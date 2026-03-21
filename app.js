const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let users = [];   // store registered users
let events = [];  // store created events


// Example route (we’ll add proper ones later)
app.get('/', (req, res) => {
    res.send('Event Management Backend is running...');
});


// Middleware to verify JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    jwt.verify(token, process.env.JWT_SECRET || "secretKey", (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid token" });
        }
        req.user = user; // attach user info to request
        next();
    });
}

// Simulated async email sender
async function sendEmail(to, subject, message) {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`📧 Email sent to ${to}: ${subject} - ${message}`);
            resolve();
        }, 1000); // simulate 1 second delay
    });
}

// Register a new user
app.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
        id: users.length + 1,
        username,
        email,
        password: hashedPassword,
        role // "organizer" or "attendee"
    };

    users.push(newUser);

    res.status(201).json({ message: "User registered successfully", userId: newUser.id });
});


// Login user
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || "secretKey",
        { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token });
});



// Create a new event (only organizers)
app.post('/events', authenticateToken, (req, res) => {
    if (req.user.role !== 'organizer') {
        return res.status(403).json({ error: "Only organizers can create events" });
    }

    const { title, date, time, description } = req.body;
    if (!title || !date || !time || !description) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const newEvent = {
        id: events.length + 1,
        title,
        date,
        time,
        description,
        participants: []
    };

    events.push(newEvent);
    res.status(201).json({ message: "Event created successfully", event: newEvent });
});

// Get all events (any authenticated user)
app.get('/events', authenticateToken, (req, res) => {
    res.json(events);
});


// Register for an event
app.post('/events/:id/register', authenticateToken, async (req, res) => {
    const eventId = parseInt(req.params.id);
    const event = events.find(e => e.id === eventId);

    if (!event) {
        return res.status(404).json({ error: "Event not found" });
    }

    if (event.participants.includes(req.user.id)) {
        return res.status(400).json({ error: "Already registered for this event" });
    }

    event.participants.push(req.user.id);

    // Find user details
    const user = users.find(u => u.id === req.user.id);

    // Send async email notification
    await sendEmail(
        user.email,
        "Event Registration Confirmation",
        `You have successfully registered for "${event.title}"`
    );

    res.json({ message: "Registered successfully", event });
});


// Update an event (organizers only)
app.put('/events/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'organizer') {
        return res.status(403).json({ error: "Only organizers can update events" });
    }

    const eventId = parseInt(req.params.id);
    const event = events.find(e => e.id === eventId);

    if (!event) {
        return res.status(404).json({ error: "Event not found" });
    }

    const { title, date, time, description } = req.body;
    if (title) event.title = title;
    if (date) event.date = date;
    if (time) event.time = time;
    if (description) event.description = description;

    res.json({ message: "Event updated successfully", event });
});

// Delete an event (organizers only)
app.delete('/events/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'organizer') {
        return res.status(403).json({ error: "Only organizers can delete events" });
    }

    const eventId = parseInt(req.params.id);
    const index = events.findIndex(e => e.id === eventId);

    if (index === -1) {
        return res.status(404).json({ error: "Event not found" });
    }

    const deletedEvent = events.splice(index, 1);
    res.json({ message: "Event deleted successfully", event: deletedEvent[0] });
});


app.listen(port, (err) => {
    if (err) {
        return console.log('Something bad happened', err);
    }
    console.log(`Server is listening on ${port}`);
});



module.exports = app;