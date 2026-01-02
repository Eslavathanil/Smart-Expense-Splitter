// API Configuration - Update this URL to your Express backend
//const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_BASE_URL = "https://smart-expense-splitter-tjwu.onrender.com/api";

// Helper to get auth token
const getToken = (): string | null => {
  return localStorage.getItem("token");
};

// Generic fetch wrapper with auth
const fetchWithAuth = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getToken();
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
};

// Currency types
export type Currency = "USD" | "INR";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  INR: "₹",
};

export const formatAmount = (amount: number, currency: Currency = "USD"): string => {
  const symbol = CURRENCY_SYMBOLS[currency];
  return `${symbol}${amount.toFixed(2)}`;
};

// Types
export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Group {
  _id: string;
  name: string;
  description: string;
  currency: Currency;
  members: Member[];
  totalExpenses: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Member {
  _id: string;
  user: User | string;
  name: string;
  email?: string;
}

export interface Expense {
  _id: string;
  title: string;
  amount: number;
  paidBy: string;
  category: string;
  date: string;
  splitWith: string[];
  splitType: "equal" | "percentage" | "custom";
  splitAmounts?: Record<string, number>;
  group: string;
  createdAt: string;
}

export interface Settlement {
  _id?: string;
  from: string;
  to: string;
  amount: number;
  settled?: boolean;
  settledAt?: string;
}

export interface Activity {
  _id: string;
  type: "expense_added" | "expense_deleted" | "member_added" | "settlement_recorded";
  description: string;
  amount?: number;
  userName?: string;
  createdAt: string;
}

// Auth API
export const authAPI = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetchWithAuth("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Login failed");
    }
    return res.json();
  },

  async signup(name: string, email: string, password: string): Promise<AuthResponse> {
    const res = await fetchWithAuth("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Signup failed");
    }
    return res.json();
  },

  async getProfile(): Promise<User> {
    const res = await fetchWithAuth("/auth/me");
    if (!res.ok) {
      throw new Error("Failed to get profile");
    }
    return res.json();
  },

  async updateProfile(data: { name?: string; email?: string }): Promise<User> {
    const res = await fetchWithAuth("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to update profile");
    }
    return res.json();
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const res = await fetchWithAuth("/auth/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to change password");
    }
  },
};

// Groups API
export const groupsAPI = {
  async getAll(): Promise<Group[]> {
    const res = await fetchWithAuth("/groups");
    if (!res.ok) {
      throw new Error("Failed to fetch groups");
    }
    return res.json();
  },

  async getById(id: string): Promise<Group> {
    const res = await fetchWithAuth(`/groups/${id}`);
    if (!res.ok) {
      throw new Error("Failed to fetch group");
    }
    return res.json();
  },

  async create(data: { name: string; description?: string; currency?: Currency }): Promise<Group> {
    const res = await fetchWithAuth("/groups", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to create group");
    }
    return res.json();
  },

  async update(id: string, data: { name?: string; description?: string; currency?: Currency }): Promise<Group> {
    const res = await fetchWithAuth(`/groups/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to update group");
    }
    return res.json();
  },

  async addMember(groupId: string, data: { name: string; email?: string }): Promise<Group> {
    const res = await fetchWithAuth(`/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to add member");
    }
    return res.json();
  },

  async removeMember(groupId: string, memberName: string): Promise<Group> {
    const res = await fetchWithAuth(`/groups/${groupId}/members/${encodeURIComponent(memberName)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to remove member");
    }
    return res.json();
  },

  async delete(id: string): Promise<void> {
    const res = await fetchWithAuth(`/groups/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error("Failed to delete group");
    }
  },
};

// Expenses API
export const expensesAPI = {
  async getByGroup(groupId: string): Promise<Expense[]> {
    const res = await fetchWithAuth(`/groups/${groupId}/expenses`);
    if (!res.ok) {
      throw new Error("Failed to fetch expenses");
    }
    return res.json();
  },

  async getAll(): Promise<Expense[]> {
    const res = await fetchWithAuth("/expenses");
    if (!res.ok) {
      throw new Error("Failed to fetch expenses");
    }
    return res.json();
  },

  async create(groupId: string, data: {
    title: string;
    amount: number;
    paidBy: string;
    category: string;
    splitWith: string[];
    splitType?: "equal" | "percentage" | "custom";
    splitAmounts?: Record<string, number>;
    date?: string;
  }): Promise<Expense> {
    const res = await fetchWithAuth(`/groups/${groupId}/expenses`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to create expense");
    }
    return res.json();
  },

  async update(groupId: string, expenseId: string, data: {
    title?: string;
    amount?: number;
    paidBy?: string;
    category?: string;
    splitWith?: string[];
    splitType?: "equal" | "percentage" | "custom";
    splitAmounts?: Record<string, number>;
  }): Promise<Expense> {
    const res = await fetchWithAuth(`/groups/${groupId}/expenses/${expenseId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to update expense");
    }
    return res.json();
  },

  async delete(groupId: string, expenseId: string): Promise<void> {
    const res = await fetchWithAuth(`/groups/${groupId}/expenses/${expenseId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error("Failed to delete expense");
    }
  },
};

// Settlements API
export const settlementsAPI = {
  async getByGroup(groupId: string): Promise<Settlement[]> {
    const res = await fetchWithAuth(`/settlements/group/${groupId}`);
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Settlement API error:', res.status, errorText);
      throw new Error("Failed to fetch settlements");
    }
    const data = await res.json();
    console.log('Settlements API response:', data);
    return Array.isArray(data) ? data : [];
  },

  async markSettled(groupId: string, data: { from: string; to: string; amount: number }): Promise<Settlement> {
    const res = await fetchWithAuth(`/settlements/group/${groupId}/settle`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to mark as settled' }));
      throw new Error(error.message || "Failed to mark as settled");
    }
    return res.json();
  },

  async undoSettlement(settlementId: string): Promise<void> {
    const res = await fetchWithAuth(`/settlements/${settlementId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to undo settlement' }));
      throw new Error(error.message || "Failed to undo settlement");
    }
  },

  async getHistory(groupId: string): Promise<Settlement[]> {
    const res = await fetchWithAuth(`/settlements/group/${groupId}/history`);
    if (!res.ok) {
      throw new Error("Failed to fetch settlement history");
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async getBalances(groupId: string): Promise<{ name: string; balance: number }[]> {
    const res = await fetchWithAuth(`/settlements/group/${groupId}/balances`);
    if (!res.ok) {
      throw new Error("Failed to fetch balances");
    }
    return res.json();
  },
};

// Activity API
export const activityAPI = {
  async getByGroup(groupId: string): Promise<Activity[]> {
    const res = await fetchWithAuth(`/groups/${groupId}/activity`);
    if (!res.ok) {
      throw new Error("Failed to fetch activity");
    }
    return res.json();
  },
};

// Reports API
export const reportsAPI = {
  async getSummary(groupId?: string): Promise<{
    totalSpending: number;
    transactionCount: number;
    categoryBreakdown: { name: string; value: number }[];
    monthlyData: { month: string; amount: number }[];
  }> {
    const url = groupId ? `/reports?groupId=${groupId}` : "/reports";
    const res = await fetchWithAuth(url);
    if (!res.ok) {
      throw new Error("Failed to fetch reports");
    }
    return res.json();
  },
};
