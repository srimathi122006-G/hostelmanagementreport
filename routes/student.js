const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// POST /api/student/register
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Please provide all fields' });
    }

    try {
        db.query('SELECT email FROM students WHERE email = ?', [email], (err, results) => {
            if (err) {
                console.error("DB SELECT ERROR:", err);
                return res.status(500).json({ error: 'Database error' });
            }
            if (results.length > 0) return res.status(400).json({ error: 'Email already registered' });

            bcrypt.hash(password, 10, (err, hash) => {
                if (err) return res.status(500).json({ error: 'Error hashing password' });

                db.query('INSERT INTO students (name, email, password) VALUES (?, ?, ?)', [name, email, hash], (err, result) => {
                    if (err) return res.status(500).json({ error: 'Error registering student' });
                    res.status(201).json({ message: 'Registration successful', studentId: result.insertId });
                });
            });
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/student/login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ error: 'Please provide email and password' });

    db.query('SELECT * FROM students WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const student = results[0];
        bcrypt.compare(password, student.password, (err, isMatch) => {
            if (err) return res.status(500).json({ error: 'Error verifying password' });
            if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

            const token = jwt.sign({ id: student.id, type: 'student' }, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.json({
                message: 'Login successful',
                token,
                user: { id: student.id, name: student.name, email: student.email, type: 'student' }
            });
        });
    });
});

module.exports = router;
