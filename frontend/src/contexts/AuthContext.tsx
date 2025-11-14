import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/lib/api";

export type UserRole = "superuser" | "agent" | "user";

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  is_superuser: boolean;
  groups: string[];
  profile: {
    name: string;
    phone_number: string | null;
    address: string | null;
    image: string | null;
  };
  agent_profile?: { // Optional, only if user is an agent
    agency_name: string | null;
    phone: string | null;
    verified: boolean;
    subscription_active: boolean;
    subscription_expires: string | null;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const accessToken = localStorage.getItem("access_token");
      if (accessToken) {
        try {
          const { data } = await api.get("/accounts/me/");
          setUser(normalizeUser(data));
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // Token might be expired, so we log out
          await logout();
        }
      }
      setIsLoading(false);
    };
    checkUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const { data: tokens } = await api.post("/accounts/token/", {
      email,
      password,
    });
    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);

    const { data: user } = await api.get("/accounts/me/");
    const normalized = normalizeUser(user);
    setUser(normalized);
    return normalized;
  };

  // Normalize backend user payload into the frontend User shape used across the app
  function normalizeUser(data: any): User {
    console.log("Raw backend user data:", data); // Add this line
    const isAgent = Array.isArray(data.groups) && data.groups.includes("agent");
    const assignedRole = data.is_superuser
        ? "superuser"
        : isAgent
        ? "agent"
        : "user";
    console.log("Assigned role:", assignedRole); // Add this line
    return {
      id: data.id,
      username: data.username || data.email?.split("@")[0] || "",
      email: data.email || "",
      role: assignedRole, // Use the logged assignedRole
      is_superuser: !!data.is_superuser,
      groups: data.groups || [],
      profile: {
        name: data.profile?.name || data.name || data.username || "",
        phone_number: data.profile?.phone_number || null,
        address: data.profile?.address || null,
        image: data.profile?.image || null,
      },
      ...(isAgent && data.agent_profile ? { // Use agent_profile from backend response
        agent_profile: {
          agency_name: data.agent_profile.agency_name || null,
          phone: data.agent_profile.phone || null,
          verified: data.agent_profile.verified || false,
          subscription_active: data.agent_profile.subscription_active || false,
          subscription_expires: data.agent_profile.subscription_expires || null,
        }
      } : {})
    } as User;
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      try {
        await api.post("/accounts/logout/", { refresh: refreshToken });
      } catch (error) {
        console.error("Error logging out:", error);
      }
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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