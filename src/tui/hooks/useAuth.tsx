import React, { createContext, useContext, useState, useCallback } from "react";
import { readConfig, writeConfig, deleteConfig } from "../../services/config.js";
import { validateApiKey } from "../../services/auth.js";

interface AuthState {
  isLoggedIn: boolean;
  apiKey: string | undefined;
  user: { name?: string; slug?: string } | undefined;
}

interface AuthContextValue extends AuthState {
  login: (token: string) => Promise<{ name?: string; slug?: string }>;
  logout: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue>(null!);

function loadAuth(): AuthState {
  const apiKey =
    process.env.PARAGRAPH_API_KEY || readConfig().apiKey || undefined;
  return {
    isLoggedIn: !!apiKey,
    apiKey,
    user: undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(loadAuth);

  const login = useCallback(async (token: string) => {
    const me = await validateApiKey(token);
    writeConfig({ apiKey: token });
    setState({ isLoggedIn: true, apiKey: token, user: me });
    return me;
  }, []);

  const logout = useCallback(() => {
    deleteConfig();
    setState({ isLoggedIn: false, apiKey: undefined, user: undefined });
  }, []);

  const refresh = useCallback(() => {
    setState(loadAuth());
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
