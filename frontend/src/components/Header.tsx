import { Link, useNavigate } from "react-router-dom";
import { Moon, Sun, Globe } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage, LANGUAGES, LanguageCode } from "@/contexts/LanguageContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  // Compute a safe display name and avatar source with fallbacks because the
  // backend user object can have different shapes (username, profile.name,
  // or email). Avoid calling string methods on undefined.
  const displayName =
    user?.name || user?.username || user?.profile?.name || user?.email || "";
  const avatarSrc = user?.avatarUrl || user?.profile?.image || undefined;

  return (
    <header className="sticky top-0 z-50 w-full glass-effect border-b border-border/50">
      <div className="h-14 px-4 flex items-center justify-between">
        {/* Sidebar Trigger */}
        <SidebarTrigger className="mr-2" />

        {/* Right side controls */}
        <div className="flex items-center gap-2 ml-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full hover:bg-accent/20 transition-all"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full hover:bg-accent/20 transition-all">
                <Globe className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-effect z-[100]">
              {Object.entries(LANGUAGES).map(([code, { name }]) => (
                <DropdownMenuItem
                  key={code}
                  onClick={() => setLanguage(code as LanguageCode)}
                  className={language === code ? "bg-primary/10 text-primary font-medium" : ""}
                >
                  {name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback>{displayName ? displayName.charAt(0).toUpperCase() : "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-effect z-[100] w-56">
                <div className="px-2 py-2 border-b">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-1">
                    Role: {user.role}
                  </p>
                </div>
                <DropdownMenuItem
                  onClick={async () => {
                    await logout();
                    // Ensure user is redirected to login after logout
                    navigate('/login');
                  }}
                  className="text-destructive cursor-pointer"
                >
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button 
                size="sm" 
                className="rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                {t("nav.login")}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
