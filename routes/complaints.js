const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

// POST /api/complaints/add
router.post('/add', verifyToken, (req, res) => {
    const { student_id, student_name, room_number, category, description } = req.body;

    if (!student_id || !student_name || !room_number || !category || !description) {
        return res.status(400).json({ error: 'Provide all the required fields' });
    }

    const sql = 'INSERT INTO complaints (student_id, student_name, room_number, category, description, status) VALUES (?, ?, ?, ?, ?, ?)';

    db.query(sql, [student_id, student_name, room_number, category, description, 'Pending'], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error filing complaint' });

        const complaintId = result.insertId;
        const msg = `New complaint from Room ${room_number}`;

        // Automatically create a notification for the admin
        db.query('INSERT INTO notifications (complaint_id, message) VALUES (?, ?)', [complaintId, msg], (notifErr) => {
            if (notifErr) console.error('Failed to create notification', notifErr);

            res.status(201).json({ message: 'Complaint raised successfully', id: complaintId });
        });
    });
});

// GET /api/complaints/student/:id
router.get('/student/:id', verifyToken, (req, res) => {
    const studentId = req.params.id;

    db.query('SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC', [studentId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error fetching student complaints' });
        res.json({ complaints: results });
    });
});

module.exports = router;
