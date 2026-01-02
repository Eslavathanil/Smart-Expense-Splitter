// Base URL for backend
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Helper to get auth token
const getToken = (): string | null => localStorage.getItem("token");

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
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
};

// ------------------ Types ------------------
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
  members: User[];
  totalExpenses: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
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

// ------------------ Auth API ------------------
export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await fetchWithAuth("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Login failed" }));
      throw new Error(error.message);
    }
    return res.json();
  },

  signup: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const res = await fetchWithAuth("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Signup failed" }));
      throw new Error(error.message);
    }
    return res.json();
  },

  getProfile: async (): Promise<User> => {
    const res = await fetchWithAuth("/api/auth/me");
    if (!res.ok) throw new Error("Failed to get profile");
    return res.json();
  },
};

// ------------------ Groups API ------------------
export const groupsAPI = {
  getAll: async (): Promise<Group[]> => {
    const res = await fetchWithAuth("/api/groups");
    if (!res.ok) throw new Error("Failed to fetch groups");
    return res.json();
  },

  getById: async (id: string): Promise<Group> => {
    const res = await fetchWithAuth(`/api/groups/${id}`);
    if (!res.ok) throw new Error("Failed to fetch group");
    return res.json();
  },

  create: async (data: { name: string; description?: string }): Promise<Group> => {
    const res = await fetchWithAuth("/api/groups", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create group");
    return res.json();
  },
};

// ------------------ Expenses API ------------------
export const expensesAPI = {
  getByGroup: async (groupId: string): Promise<Expense[]> => {
    const res = await fetchWithAuth(`/api/groups/${groupId}/expenses`);
    if (!res.ok) throw new Error("Failed to fetch expenses");
    return res.json();
  },

  create: async (groupId: string, data: Partial<Expense>): Promise<Expense> => {
    const res = await fetchWithAuth(`/api/groups/${groupId}/expenses`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create expense");
    return res.json();
  },
};

// ------------------ Settlements API ------------------
export const settlementsAPI = {
  getByGroup: async (groupId: string) => {
    const res = await fetchWithAuth(`/api/settlements/group/${groupId}`);
    if (!res.ok) throw new Error("Failed to fetch settlements");
    return res.json();
  },

  markSettled: async (
    groupId: string,
    data: { from: string; to: string; amount: number }
  ) => {
    const res = await fetchWithAuth(`/api/settlements/group/${groupId}/settle`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to mark as settled");
    return res.json();
  },
};

// ------------------ Activity API ------------------
export const activityAPI = {
  getByGroup: async (groupId: string) => {
    const res = await fetchWithAuth(`/api/groups/${groupId}/activity`);
    if (!res.ok) throw new Error("Failed to fetch activity");
    return res.json();
  },
};

// ------------------ Reports API ------------------
export const reportsAPI = {
  getSummary: async (groupId?: string) => {
    const url = groupId ? `/api/reports?groupId=${groupId}` : "/api/reports";
    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error("Failed to fetch reports");
    return res.json();
  },
};
