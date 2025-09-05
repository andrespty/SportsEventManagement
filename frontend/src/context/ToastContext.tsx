import React, { createContext, useContext, ReactNode } from "react";
import { Toaster, toaster } from "../components/ui/toaster";

interface Toast {
  title: string;
  description: string;
  type?: "success" | "error" | "warning" | "info";
}

interface ToastContextType {
  createToast: (toast: Toast) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

  const createToast = ({ title, description, type }: Toast) => {
    toaster.create({ title, description, type:type || "info" });
  };

  return (
    <ToastContext.Provider value={{ createToast }}>
      <Toaster />
      {children}
    </ToastContext.Provider>
  );
};

export const useToastContext = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
};
