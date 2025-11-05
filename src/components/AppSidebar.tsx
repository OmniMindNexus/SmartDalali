import { Home, Building2, LayoutDashboard, Users, Settings, Map, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getNavItems = () => {
    const baseItems = [
      { title: t("home"), url: "/", icon: Home },
      { title: t("properties"), url: "/properties", icon: Building2 },
      { title: "Map View", url: "/map", icon: Map },
    ];

    if (user?.role === "superuser") {
      baseItems.unshift({ title: "Admin Dashboard", url: "/admin", icon: LayoutDashboard });
      baseItems.push({ title: "Users", url: "/admin/users", icon: Users });
      baseItems.push({ title: "Settings", url: "/admin/settings", icon: Settings });
    } else if (user?.role === "agent") {
      baseItems.unshift({ title: "My Dashboard", url: "/agent", icon: LayoutDashboard });
      baseItems.push({ title: "My Listings", url: "/agent/listings", icon: Building2 });
    } else if (user?.role === "user") {
      baseItems.unshift({ title: "My Dashboard", url: "/dashboard", icon: LayoutDashboard });
    }

    return baseItems;
  };

  const items = getNavItems();

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h2 className="font-bold text-lg">SmartDalali</h2>
            <p className="text-xs text-muted-foreground">Real Estate Platform</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {user && (
        <SidebarFooter className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <Avatar>
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            {t("logout")}
          </Button>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
