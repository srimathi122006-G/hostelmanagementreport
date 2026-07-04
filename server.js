require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');
const complaintsRoutes = require('./routes/complaints');
const notificationsRoutes = require('./routes/notifications');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Allow JSON body parsing
app.use(express.static(__dirname)); // Serve frontend files

// API Routing
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Base route for frontend application
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
