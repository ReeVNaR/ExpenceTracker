import express from 'express';
import Transaction from '../models/Transaction.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all transactions for user
router.get('/', auth, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.id }).sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add transaction
router.post('/', auth, async (req, res) => {
    try {
        const { type, title, amount, category, note, date } = req.body;
        const newTransaction = new Transaction({
            userId: req.user.id,
            type,
            title,
            amount,
            category,
            note,
            date
        });
        const savedTransaction = await newTransaction.save();
        res.json(savedTransaction);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete transaction
router.delete('/:id', auth, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ msg: 'Transaction not found' });
        if (transaction.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        await transaction.deleteOne();
        res.json({ msg: 'Transaction removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
