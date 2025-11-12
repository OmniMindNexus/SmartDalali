import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export type UserRole = "superuser" | "agent" | "user";

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser: SupabaseUser) => {
    try {
      // Get profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      // Get roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authUser.id);

      const userRole: UserRole = 
        roles?.some(r => r.role === "superuser") ? "superuser" :
        roles?.some(r => r.role === "agent") ? "agent" : "user";

      setUser({
        id: authUser.id,
        email: authUser.email!,
        username: profile?.username || authUser.email?.split("@")[0] || "",
        name: profile?.name || authUser.email?.split("@")[0] || "",
        role: userRole,
        avatarUrl: profile?.avatar_url,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error("No user returned from login");

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();

    // Get roles
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);

    const userRole: UserRole = 
      roles?.some(r => r.role === "superuser") ? "superuser" :
      roles?.some(r => r.role === "agent") ? "agent" : "user";

    const userObj: User = {
      id: data.user.id,
      email: data.user.email!,
      username: profile?.username || data.user.email?.split("@")[0] || "",
      name: profile?.name || data.user.email?.split("@")[0] || "",
      role: userRole,
      avatarUrl: profile?.avatar_url,
    };

    setUser(userObj);
    return userObj;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const register = async (username: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          name: username,
        },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error("No user returned from registration");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
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