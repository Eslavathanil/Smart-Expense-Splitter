const express = require('express');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');
const { validate, groupSchema, memberSchema } = require('../middleware/validate');

const router = express.Router();

// Helper to log activity
const logActivity = async (groupId, type, description, userId, userName, amount = null, metadata = null) => {
  try {
    await Activity.create({
      groupId,
      type,
      description,
      userId,
      userName,
      amount,
      metadata,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// GET /api/groups - Get all groups for user
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [
        { createdBy: req.userId },
        { 'members.userId': req.userId },
      ],
    }).sort({ updatedAt: -1 });

    // Add total expenses for each group
    const groupsWithTotals = await Promise.all(
      groups.map(async (group) => {
        const expenses = await Expense.aggregate([
          { $match: { groupId: group._id } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        return {
          ...group.toJSON(),
          totalExpenses: expenses[0]?.total || 0,
        };
      })
    );

    res.json(groupsWithTotals);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ message: 'Failed to fetch groups' });
  }
});

// GET /api/groups/:id - Get single group
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Add total expenses
    const expenses = await Expense.aggregate([
      { $match: { groupId: group._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    
    res.json({
      ...group.toJSON(),
      totalExpenses: expenses[0]?.total || 0,
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ message: 'Failed to fetch group' });
  }
});

// POST /api/groups - Create new group
router.post('/', auth, validate(groupSchema), async (req, res) => {
  try {
    const { name, description, currency } = req.body;

    const group = new Group({
      name,
      description,
      currency: currency || 'USD',
      createdBy: req.userId,
      members: [{ name: req.user.name, email: req.user.email, userId: req.userId }],
    });

    await group.save();
    res.status(201).json({ ...group.toJSON(), totalExpenses: 0 });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Failed to create group' });
  }
});

// PUT /api/groups/:id - Update group
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, currency } = req.body;
    
    const group = await Group.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.userId },
        { 'members.userId': req.userId },
      ],
    });
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found or not authorized' });
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (currency) group.currency = currency;

    await group.save();
    
    await logActivity(group._id, 'group_updated', `${req.user.name} updated group settings`, req.userId, req.user.name);
    
    res.json(group);
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ message: 'Failed to update group' });
  }
});

// POST /api/groups/:id/members - Add member to group
router.post('/:id/members', auth, validate(memberSchema), async (req, res) => {
  try {
    const { name, email } = req.body;

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if member already exists
    const existingMember = group.members.find(
      (m) => m.name.toLowerCase() === name.toLowerCase() ||
             (email && m.email?.toLowerCase() === email.toLowerCase())
    );
    if (existingMember) {
      return res.status(400).json({ message: 'Member already exists in group' });
    }

    group.members.push({ name, email });
    await group.save();
    
    await logActivity(group._id, 'member_added', `${req.user.name} added ${name} to the group`, req.userId, req.user.name);

    res.json(group);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Failed to add member' });
  }
});

// DELETE /api/groups/:id/members/:memberName - Remove member from group
router.delete('/:id/members/:memberName', auth, async (req, res) => {
  try {
    const memberName = decodeURIComponent(req.params.memberName);
    
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const memberIndex = group.members.findIndex(
      (m) => m.name.toLowerCase() === memberName.toLowerCase()
    );
    
    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Check if member has expenses
    const hasExpenses = await Expense.findOne({
      groupId: group._id,
      $or: [
        { paidBy: memberName },
        { splitWith: memberName },
      ],
    });

    if (hasExpenses) {
      return res.status(400).json({ message: 'Cannot remove member with existing expenses' });
    }

    group.members.splice(memberIndex, 1);
    await group.save();
    
    await logActivity(group._id, 'member_removed', `${req.user.name} removed ${memberName} from the group`, req.userId, req.user.name);

    res.json(group);
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Failed to remove member' });
  }
});

// DELETE /api/groups/:id - Delete group
router.delete('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.userId,
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found or not authorized' });
    }

    // Delete all associated data
    await Promise.all([
      Expense.deleteMany({ groupId: req.params.id }),
      Activity.deleteMany({ groupId: req.params.id }),
    ]);

    res.json({ message: 'Group deleted' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ message: 'Failed to delete group' });
  }
});

// GET /api/groups/:id/expenses - Get expenses for a group
router.get('/:id/expenses', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ groupId: req.params.id })
      .sort({ date: -1, createdAt: -1 });
    
    const expensesWithGroup = expenses.map(e => ({
      ...e.toJSON(),
      group: e.groupId.toString(),
    }));
    
    res.json(expensesWithGroup);
  } catch (error) {
    console.error('Get group expenses error:', error);
    res.status(500).json({ message: 'Failed to fetch expenses' });
  }
});

// POST /api/groups/:id/expenses - Create expense in group
router.post('/:id/expenses', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const { title, amount, paidBy, category, splitWith, splitType, splitAmounts, date } = req.body;

    // Default split with all members if not specified
    const memberNames = group.members.map(m => m.name);
    const finalSplitWith = splitWith && splitWith.length > 0 ? splitWith : memberNames;

    const expense = new Expense({
      groupId: req.params.id,
      title,
      amount,
      paidBy,
      category,
      splitWith: finalSplitWith,
      splitType: splitType || 'equal',
      splitAmounts,
      createdBy: req.userId,
      date: date || new Date().toISOString(),
    });

    await expense.save();
    
    const currencySymbol = group.currency === 'INR' ? '₹' : '$';
    await logActivity(
      group._id, 
      'expense_added', 
      `${req.user.name} added "${title}" for ${currencySymbol}${amount.toFixed(2)}`,
      req.userId,
      req.user.name,
      amount
    );
    
    res.status(201).json({
      ...expense.toJSON(),
      group: expense.groupId.toString(),
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Failed to create expense' });
  }
});

// PUT /api/groups/:groupId/expenses/:expenseId - Update expense
router.put('/:groupId/expenses/:expenseId', auth, async (req, res) => {
  try {
    const { title, amount, paidBy, category, splitWith, splitType, splitAmounts } = req.body;
    
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.expenseId, groupId: req.params.groupId },
      { title, amount, paidBy, category, splitWith, splitType, splitAmounts },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({
      ...expense.toJSON(),
      group: expense.groupId.toString(),
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Failed to update expense' });
  }
});

// DELETE /api/groups/:groupId/expenses/:expenseId - Delete expense from group
router.delete('/:groupId/expenses/:expenseId', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.expenseId,
      groupId: req.params.groupId,
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const group = await Group.findById(req.params.groupId);
    const currencySymbol = group?.currency === 'INR' ? '₹' : '$';
    
    await logActivity(
      req.params.groupId,
      'expense_deleted',
      `${req.user.name} deleted "${expense.title}" (${currencySymbol}${expense.amount.toFixed(2)})`,
      req.userId,
      req.user.name,
      expense.amount
    );

    res.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Failed to delete expense' });
  }
});

// GET /api/groups/:id/activity - Get activity timeline for group
router.get('/:id/activity', auth, async (req, res) => {
  try {
    const activities = await Activity.find({ groupId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(activities);
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ message: 'Failed to fetch activity' });
  }
});

module.exports = router;
