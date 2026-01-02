const express = require('express');
const Settlement = require('../models/Settlement');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper: Calculate who owes whom
const calculateBalances = (expenses, members, pastSettlements = []) => {
  // Handle members being either strings or objects with name property
  const memberNames = members.map(m => typeof m === 'string' ? m : (m.name || m));
  const balances = {};
  
  memberNames.forEach(name => {
    balances[name] = 0;
  });

  // Calculate balances from expenses
  expenses.forEach(expense => {
    const { paidBy, amount, splitWith, splitType, splitAmounts } = expense;
    
    // Add full amount to payer's credit
    if (paidBy) {
      balances[paidBy] = (balances[paidBy] || 0) + amount;
    }
    
    // Calculate splits based on split type
    if (splitType === 'custom' && splitAmounts) {
      // Custom split amounts - handle both Map and Object
      const splitEntries = splitAmounts instanceof Map 
        ? Array.from(splitAmounts.entries())
        : Object.entries(splitAmounts);
      
      splitEntries.forEach(([member, splitAmount]) => {
        balances[member] = (balances[member] || 0) - Number(splitAmount);
      });
    } else if (splitType === 'percentage' && splitAmounts) {
      // Percentage-based split - handle both Map and Object
      const splitEntries = splitAmounts instanceof Map 
        ? Array.from(splitAmounts.entries())
        : Object.entries(splitAmounts);
      
      splitEntries.forEach(([member, percentage]) => {
        const splitAmount = (amount * Number(percentage)) / 100;
        balances[member] = (balances[member] || 0) - splitAmount;
      });
    } else if (splitWith && splitWith.length > 0) {
      // Equal split (default)
      const splitAmount = amount / splitWith.length;
      splitWith.forEach(member => {
        balances[member] = (balances[member] || 0) - splitAmount;
      });
    }
  });

  // Adjust for past settlements
  pastSettlements.forEach(settlement => {
    if (settlement.from && settlement.to && settlement.amount) {
      balances[settlement.from] = (balances[settlement.from] || 0) + settlement.amount;
      balances[settlement.to] = (balances[settlement.to] || 0) - settlement.amount;
    }
  });

  return balances;
};

// Helper: Optimize settlements (minimize transactions)
const optimizeSettlements = (balances) => {
  const settlements = [];
  
  // Create mutable copies
  const debtors = Object.entries(balances)
    .filter(([_, balance]) => balance < -0.01)
    .map(([name, balance]) => ({ name, balance }))
    .sort((a, b) => a.balance - b.balance);
    
  const creditors = Object.entries(balances)
    .filter(([_, balance]) => balance > 0.01)
    .map(([name, balance]) => ({ name, balance }))
    .sort((a, b) => b.balance - a.balance);

  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    
    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
    if (amount > 0.01) {
      settlements.push({ 
        from: debtor.name, 
        to: creditor.name, 
        amount: Math.round(amount * 100) / 100 
      });
    }
    
    debtor.balance += amount;
    creditor.balance -= amount;
    
    if (Math.abs(debtor.balance) < 0.01) i++;
    if (creditor.balance < 0.01) j++;
  }

  return settlements;
};

// GET /api/settlements/group/:groupId - Get pending settlements for a group
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Get all expenses and past settlements
    const [expenses, pastSettlements] = await Promise.all([
      Expense.find({ groupId: req.params.groupId }),
      Settlement.find({ groupId: req.params.groupId }),
    ]);

    console.log(`Calculating settlements for group ${req.params.groupId}:`);
    console.log(`  - ${expenses.length} expenses`);
    console.log(`  - ${pastSettlements.length} past settlements`);

    // Calculate current balances (accounting for past settlements)
    const balances = calculateBalances(expenses, group.members, pastSettlements);
    console.log('  - Balances:', balances);

    // Get optimized settlements
    const settlements = optimizeSettlements(balances);
    console.log('  - Pending settlements:', settlements);

    res.json(settlements);
  } catch (error) {
    console.error('Get settlements error:', error);
    res.status(500).json({ message: 'Failed to calculate settlements', error: error.message });
  }
});

// POST /api/settlements/group/:groupId/settle - Mark a settlement as paid
router.post('/group/:groupId/settle', auth, async (req, res) => {
  try {
    const { from, to, amount } = req.body;

    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const settlement = new Settlement({
      groupId: req.params.groupId,
      from,
      to,
      amount,
      settledBy: req.userId,
    });

    await settlement.save();
    
    const currencySymbol = group.currency === 'INR' ? '₹' : '$';
    await Activity.create({
      groupId: req.params.groupId,
      type: 'settlement_recorded',
      description: `${from} paid ${to} ${currencySymbol}${amount.toFixed(2)}`,
      userId: req.userId,
      userName: req.user.name,
      amount,
    });
    
    res.status(201).json(settlement);
  } catch (error) {
    console.error('Create settlement error:', error);
    res.status(500).json({ message: 'Failed to record settlement' });
  }
});

// DELETE /api/settlements/:settlementId - Undo/delete a settlement (within time window)
router.delete('/:settlementId', auth, async (req, res) => {
  try {
    const settlement = await Settlement.findById(req.params.settlementId);
    if (!settlement) {
      return res.status(404).json({ message: 'Settlement not found' });
    }

    // Check if within undo window (15 minutes)
    const UNDO_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    const settlementTime = new Date(settlement.settledAt || settlement.createdAt).getTime();
    const now = Date.now();
    
    if (now - settlementTime > UNDO_WINDOW_MS) {
      return res.status(400).json({ 
        message: 'Cannot undo settlement after 15 minutes',
        expiredAt: new Date(settlementTime + UNDO_WINDOW_MS)
      });
    }

    const group = await Group.findById(settlement.groupId);
    const currencySymbol = group?.currency === 'INR' ? '₹' : '$';

    await Settlement.findByIdAndDelete(req.params.settlementId);
    
    // Log the undo activity
    await Activity.create({
      groupId: settlement.groupId,
      type: 'settlement_undone',
      description: `Settlement undone: ${settlement.from} → ${settlement.to} ${currencySymbol}${settlement.amount.toFixed(2)}`,
      userId: req.userId,
      userName: req.user.name,
      amount: settlement.amount,
    });

    res.json({ message: 'Settlement undone successfully' });
  } catch (error) {
    console.error('Undo settlement error:', error);
    res.status(500).json({ message: 'Failed to undo settlement' });
  }
});

// GET /api/settlements/group/:groupId/history - Get settlement history
router.get('/group/:groupId/history', auth, async (req, res) => {
  try {
    const settlements = await Settlement.find({ groupId: req.params.groupId })
      .sort({ settledAt: -1 });
    res.json(settlements);
  } catch (error) {
    console.error('Get settlement history error:', error);
    res.status(500).json({ message: 'Failed to fetch settlement history' });
  }
});

// GET /api/settlements/group/:groupId/balances - Get member balances
router.get('/group/:groupId/balances', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const [expenses, pastSettlements] = await Promise.all([
      Expense.find({ groupId: req.params.groupId }),
      Settlement.find({ groupId: req.params.groupId }),
    ]);

    const balances = calculateBalances(expenses, group.members, pastSettlements);
    
    const memberBalances = group.members.map(member => {
      const balance = balances[member.name] || 0;
      return {
        name: member.name,
        balance: Math.round(balance * 100) / 100,
      };
    });

    res.json(memberBalances);
  } catch (error) {
    console.error('Get balances error:', error);
    res.status(500).json({ message: 'Failed to calculate balances' });
  }
});

module.exports = router;
