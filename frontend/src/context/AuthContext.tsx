import React, { createContext, useContext, useState, useEffect } from "react";
import api, { getBackendUrl, setBackendUrl } from "../services/api";
import socketService from "../services/socket";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuth: boolean;
  login: (token: string, user: User, companyId: string) => void;
  logout: () => void;
  backendUrl: string;
  updateBackendUrl: (url: string) => void;
  privateLinesHidden: boolean;
  setPrivateLinesHidden: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendUrlState, setBackendUrlState] = useState<string>(getBackendUrl());
  const [privateLinesHidden, setPrivateLinesHiddenState] = useState<boolean>(() => {
    const saved = localStorage.getItem("privateLinesHidden");
    return saved !== null ? saved === "true" : true;
  });

  const setPrivateLinesHidden = (val: boolean) => {
    localStorage.setItem("privateLinesHidden", String(val));
    setPrivateLinesHiddenState(val);
  };

  const updateBackendUrl = (url: string) => {
    setBackendUrl(url);
    setBackendUrlState(url);
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      const companyId = localStorage.getItem("companyId");

      if (token && companyId) {
        let parsedToken = "";
        try {
          parsedToken = JSON.parse(token);
        } catch {
          parsedToken = token;
        }

        // 1. Try refreshing session to ensure token is valid
        try {
          const { data } = await api.post("/auth/refresh_token");
          if (data?.token) {
            localStorage.setItem("token", JSON.stringify(data.token));
            if (data.user) {
              localStorage.setItem("user", JSON.stringify(data.user));
              setUser(data.user);
            }
            socketService.connect(companyId, data.token);
            setLoading(false);
            return;
          }
        } catch (refreshErr) {
          console.warn("Session refresh on mount:", refreshErr);
        }

        // 2. If refresh not available or server offline, fall back to stored user
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            socketService.connect(companyId, parsedToken);
          } catch (err) {
            console.error("Error parsing stored user:", err);
            localStorage.clear();
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string, loggedUser: User, companyId: string) => {
    localStorage.setItem("token", JSON.stringify(token));
    localStorage.setItem("user", JSON.stringify(loggedUser));
    localStorage.setItem("companyId", companyId);
    setUser(loggedUser);
    socketService.connect(companyId, token);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("companyId");
    setUser(null);
    socketService.disconnect();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuth: !!user,
        login,
        logout,
        backendUrl: backendUrlState,
        updateBackendUrl,
        privateLinesHidden,
        setPrivateLinesHidden,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
