// Base URL for backend
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Helper to get auth token
const getToken = (): string | null => localStorage.getItem("token");

// Generic fetch wrapper
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  return res;
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) =>
    fetchWithAuth("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }).then(async (res) => {
      if (!res.ok) throw await res.json();
      return res.json();
    }),

  signup: async (name: string, email: string, password: string) =>
    fetchWithAuth("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }).then(async (res) => {
      if (!res.ok) throw await res.json();
      return res.json();
    }),

  getProfile: async () => {
    const res = await fetchWithAuth("/api/auth/me");
    if (!res.ok) throw new Error("Failed to get profile");
    return res.json();
  },
};

// Groups API
export const groupsAPI = {
  getAll: async () => {
    const res = await fetchWithAuth("/api/groups");
    if (!res.ok) throw new Error("Failed to fetch groups");
    return res.json();
  },
  getById: async (id: string) => {
    const res = await fetchWithAuth(`/api/groups/${id}`);
    if (!res.ok) throw new Error("Failed to fetch group");
    return res.json();
  },
  create: async (data: { name: string; description?: string }) => {
    const res = await fetchWithAuth("/api/groups", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create group");
    return res.json();
  },
  // Add more routes like update, addMember, delete...
};

// Expenses API
export const expensesAPI = {
  getByGroup: async (groupId: string) => {
    const res = await fetchWithAuth(`/api/groups/${groupId}/expenses`);
    if (!res.ok) throw new Error("Failed to fetch expenses");
    return res.json();
  },
  create: async (groupId: string, data: any) => {
    const res = await fetchWithAuth(`/api/groups/${groupId}/expenses`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create expense");
    return res.json();
  },
  // Add update, delete...
};

// Settlements API
export const settlementsAPI = {
  getByGroup: async (groupId: string) => {
    const res = await fetchWithAuth(`/api/settlements/group/${groupId}`);
    if (!res.ok) throw new Error("Failed to fetch settlements");
    return res.json();
  },
  markSettled: async (groupId: string, data: { from: string; to: string; amount: number }) => {
    const res = await fetchWithAuth(`/api/settlements/group/${groupId}/settle`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to mark settled");
    return res.json();
  },
};

// Activity API
export const activityAPI = {
  getByGroup: async (groupId: string) => {
    const res = await fetchWithAuth(`/api/groups/${groupId}/activity`);
    if (!res.ok) throw new Error("Failed to fetch activity");
    return res.json();
  },
};

// Reports API
export const reportsAPI = {
  getSummary: async (groupId?: string) => {
    const url = groupId ? `/api/reports?groupId=${groupId}` : "/api/reports";
    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error("Failed to fetch reports");
    return res.json();
  },
};
