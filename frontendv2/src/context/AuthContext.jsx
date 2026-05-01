// src/context/AuthContext.jsx
import { createContext, useEffect, useState } from "react";
import { getMe } from "../services/auth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingo, setLoading] = useState(true);
  const fetchUser = async () => {
    try {
      const res = await getMe();
      setUser(res.data);
    } catch {
      setUser(null);
    }
  };
  useEffect(() => {
    const init = async () => {
      if (localStorage.getItem("token")) {
        await fetchUser();
      }
      setLoading(false);
    };
    init();
  }, []);
  return (
    <AuthContext.Provider value={{ user, setUser, fetchUser, loadingo }}>
      {children}
    </AuthContext.Provider>
  );
};