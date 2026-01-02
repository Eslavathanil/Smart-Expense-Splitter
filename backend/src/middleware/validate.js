const { z } = require('zod');

// Validation schemas
const loginSchema = z.object({
  email: z.string().trim().min(1).email().max(255),
  password: z.string().min(6).max(128),
});

const signupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().min(1).email().max(255),
  password: z.string().min(6).max(128),
});

const expenseSchema = z.object({
  title: z.string().trim().min(2).max(100),
  amount: z.number().positive().max(1000000),
  paidBy: z.string().min(1),
  category: z.enum(['Food', 'Transport', 'Accommodation', 'Entertainment', 'Shopping', 'Other']),
  splitWith: z.array(z.string()).optional(),
  splitType: z.enum(['equal', 'percentage', 'custom']).optional(),
  splitAmounts: z.record(z.number()).optional(),
});

const groupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
});

const memberSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255).optional().or(z.literal('')),
});

// Validation middleware factory
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    next(error);
  }
};

module.exports = {
  validate,
  loginSchema,
  signupSchema,
  expenseSchema,
  groupSchema,
  memberSchema,
};
