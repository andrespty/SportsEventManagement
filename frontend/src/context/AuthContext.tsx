import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User } from "../types/models";
import { apiFetch } from "../lib/api";
import { ApiResponse } from "../types/common";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}
interface RefreshRequest {
  token: string
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token") ? localStorage.getItem("token") : null);
  // const [loading, setLoading] = useState<boolean>(false)

  
  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    console.log("Logged In")
    setToken(newToken);
    setUser(newUser);
  };
  
  const logout = async () => {
    const res = await apiFetch<ApiResponse<{}>>("/api/auth/logout", {
      method:"POST",
      credentials: 'include'
    })
    if (res.success){
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // fetch("/api/auth/logout", { method: "POST", credentials: "include" }); // clear refresh token cookie
      setToken(null);
      setUser(null);
    }
  };
  
  const refreshToken = useCallback(async () => {
    try {
      const res = await apiFetch<ApiResponse<RefreshRequest>>("/api/auth/refresh", {
        method: "POST",
        credentials: "include", // send refresh cookie
      });
      if (res.success){
        setToken(res.data.token);
        const storedUser = localStorage.getItem('user')
        if (!storedUser){
          const meRes = await apiFetch<ApiResponse<User>>("/api/auth/me",{
            headers: {
              "Authorization": `Bearer ${res.data.token}`
            }
          })
          if (meRes.success){
            setUser(meRes.data);
            localStorage.setItem("user", JSON.stringify(meRes.data));
          }
          else{
            console.log('Error fetching user')
          }
        }
        else{
          setUser(JSON.parse(storedUser))
        }
      }
      else{
        console.log(res)
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      }
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
    }
  }, []);
  
  useEffect(() => {
    if (localStorage.getItem("token")){
      console.log("Refreshing")
      let isMounted = true
      refreshToken().then(() => { if (!isMounted) return});
      return () => { 
        isMounted = false 
      }
    }
  }, [refreshToken]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};