import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

const DEMO_USER = {
    _id: "60d0fe4f5311236168a109ca",
    name: "Test User",
    email: "test@example.com",
    role: "technician",
    avatar: "https://i.pravatar.cc/150?u=fake",
    phone: "9841000000",
    address: "Kathmandu, Nepal",
    location: { type: "Point", coordinates: [85.3240, 27.7172] },
    isActive: true
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEMO_USER);
  
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const login = useCallback(async (email, password) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    setUser(DEMO_USER);
    setLoading(false);
    return DEMO_USER;
  }, []);

  const logout = useCallback(() => {
    return;
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((u) => ({ ...u, ...updates }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, setError, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
