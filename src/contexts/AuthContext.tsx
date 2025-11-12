import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

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
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, username: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const userRole: UserRole = roles?.find(r => r.role === "superuser")
        ? "superuser"
        : roles?.find(r => r.role === "agent")
        ? "agent"
        : "user";

      return {
        profile,
        role: userRole,
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setTimeout(() => {
          fetchUserProfile(session.user.id).then((data) => {
            if (data) {
              setUser({
                id: session.user.id,
                email: session.user.email!,
                username: data.profile?.username || session.user.email!.split("@")[0],
                name: data.profile?.name || session.user.email!.split("@")[0],
                role: data.role,
                avatarUrl: data.profile?.avatar_url,
              });
            }
            setIsLoading(false);
          });
        }, 0);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setTimeout(() => {
          fetchUserProfile(session.user.id).then((data) => {
            if (data) {
              setUser({
                id: session.user.id,
                email: session.user.email!,
                username: data.profile?.username || session.user.email!.split("@")[0],
                name: data.profile?.name || session.user.email!.split("@")[0],
                role: data.role,
                avatarUrl: data.profile?.avatar_url,
              });
            }
          });
        }, 0);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const register = async (email: string, password: string, username: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          username,
          name,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, login, logout, register }}>
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
