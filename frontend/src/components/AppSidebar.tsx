import { Home, Building2, LayoutDashboard, Users, Settings, Map, Plus, Shield, MessageSquare } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
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
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

export function AppSidebar() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  const getNavItems = () => {
    const publicItems = [
      { title: "Home", url: "/", icon: Home },
      { title: "Properties", url: "/properties", icon: Building2 },
      { title: "Map View", url: "/map", icon: Map },
    ];

    if (user) {
      publicItems.push({ title: "Messages", url: "/messages", icon: MessageSquare });
    }

    const userItems = [];
    const managementItems = [];

    if (user?.role === "superuser") {
      userItems.push({ title: "Admin Dashboard", url: "/admin", icon: Shield });
      managementItems.push(
        { title: "Users Management", url: "/admin/users", icon: Users },
        { title: "All Properties", url: "/properties", icon: Building2 },
        { title: "Settings", url: "/admin/settings", icon: Settings }
      );
    } else if (user?.role === "agent") {
      userItems.push({ title: "My Dashboard", url: "/agent", icon: LayoutDashboard });
      managementItems.push(
        { title: "My Listings", url: "/agent/listings", icon: Building2 },
        { title: "Add Property", url: "/properties/new", icon: Plus }
      );
    } else if (user?.role === "user") {
      userItems.push({ title: "My Dashboard", url: "/dashboard", icon: LayoutDashboard });
    }

    return { publicItems, userItems, managementItems };
  };

  const { publicItems, userItems, managementItems } = getNavItems();

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4 border-b">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-lg">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">SmartDalali</h2>
            <p className="text-xs text-muted-foreground">Real Estate Platform</p>
          </div>
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        {/* Public Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {publicItems.map((item) => (
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

        {/* User-specific items */}
        {user && userItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <div className="flex items-center justify-between w-full">
                <span>Dashboard</span>
                <Badge variant="secondary" className="text-xs capitalize">
                  {user.role}
                </Badge>
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {userItems.map((item) => (
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
        )}

        {/* Management items */}
        {managementItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {managementItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
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
        )}
      </SidebarContent>
    </Sidebar>
  );
}
