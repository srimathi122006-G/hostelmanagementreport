const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// POST /api/admin/login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) return res.status(400).json({ error: 'Provide username and password' });

    db.query('SELECT * FROM admins WHERE username = ?', [username], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const admin = results[0];
        bcrypt.compare(password, admin.password, (err, isMatch) => {
            if (err) return res.status(500).json({ error: 'Error verifying password' });
            if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

            const token = jwt.sign({ id: admin.id, type: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.json({
                message: 'Admin login successful',
                token,
                user: { id: admin.id, name: 'Admin Portal', type: 'admin' }
            });
        });
    });
});

// GET /api/admin/complaints
router.get('/complaints', verifyToken, requireAdmin, (req, res) => {
    db.query('SELECT * FROM complaints ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: 'Error fetching complaints' });
        res.json({ complaints: results });
    });
});

// PUT /api/admin/complaints/:id/status
router.put('/complaints/:id/status', verifyToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    db.query('UPDATE complaints SET status = ? WHERE id = ?', [status, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error updating complaint' });
        res.json({ message: 'Complaint status updated' });
    });
});

// DELETE /api/admin/complaints/:id
router.delete('/complaints/:id', verifyToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM complaints WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error deleting complaint' });
        res.json({ message: 'Complaint deleted' });
    });
});

module.exports = router;
