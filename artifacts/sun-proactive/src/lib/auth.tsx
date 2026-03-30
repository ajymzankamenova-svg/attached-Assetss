import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { UserProfile, useGetMe } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("sun_token"));
  const [user, setUser] = useState<UserProfile | null>(null);

  // Set the token getter for the API client
  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("sun_token"));
  }, []);

  const { data: me, isLoading: isLoadingMe } = useGetMe({
    query: {
      enabled: !!token,
      queryKey: ["/api/auth/me", token],
      retry: false,
    },
  });

  useEffect(() => {
    if (me) {
      setUser(me);
    }
  }, [me]);

  const login = (newToken: string, newUser: UserProfile) => {
    localStorage.setItem("sun_token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("sun_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading: !!token && isLoadingMe, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
