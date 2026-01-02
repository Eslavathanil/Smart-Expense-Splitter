const express = require('express');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const auth = require('../middleware/auth');
const { validate, expenseSchema } = require('../middleware/validate');

const router = express.Router();

// GET /api/expenses - Get all expenses for user (across all groups)
router.get('/', auth, async (req, res) => {
  try {
    // Get all groups user is part of
    const groups = await Group.find({
      $or: [
        { createdBy: req.userId },
        { 'members.userId': req.userId },
      ],
    }).select('_id');

    const groupIds = groups.map(g => g._id);

    const expenses = await Expense.find({ groupId: { $in: groupIds } })
      .sort({ date: -1 })
      .limit(100);

    // Add group reference to each expense
    const expensesWithGroup = expenses.map(e => ({
      ...e.toJSON(),
      group: e.groupId.toString(),
    }));

    res.json(expensesWithGroup);
  } catch (error) {
    console.error('Get all expenses error:', error);
    res.status(500).json({ message: 'Failed to fetch expenses' });
  }
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', auth, validate(expenseSchema), async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Failed to update expense' });
  }
});

// DELETE /api/expenses/:id - Delete expense (standalone)
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Failed to delete expense' });
  }
});

module.exports = router;
