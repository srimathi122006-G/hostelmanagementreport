const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// GET /api/admin/notifications
router.get('/', verifyToken, requireAdmin, (req, res) => {
    db.query('SELECT * FROM notifications ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: 'Error fetching notifications' });
        res.json({ notifications: results });
    });
});

// PUT /api/admin/notifications/:id/read
router.put('/:id/read', verifyToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    db.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error updating notification status' });
        res.json({ message: 'Notification marked as read' });
    });
});

module.exports = router;
