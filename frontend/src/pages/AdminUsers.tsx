import { useState, useEffect } from "react";
import { Users, Search, Filter, UserPlus, Edit, Trash2, Mail, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

// Define a type for the user data expected from the backend
interface UserData {
  id: number;
  username: string;
  email: string;
  is_superuser: boolean;
  is_active: boolean;
  groups: { name: string }[];
  profile?: {
    name?: string;
    image?: string;
  };
  agent_profile?: {
    subscription_active: boolean;
  };
}

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get("/accounts/users/");
        setUsers(response.data.results || []);
      } catch (err) {
        setError("Failed to fetch users.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      (user.profile?.name || user.username).toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (user: UserData) => {
    if (user.is_superuser) {
      return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Admin</Badge>;
    } else if (user.groups.some(g => g.name === "agent")) {
      return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Agent</Badge>;
    } else {
      return <Badge variant="outline">User</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
    } else {
      return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  // Functions for actions (will implement API calls later if needed, now just console.log)
  const toggleUserActiveStatus = async (userId: number, currentStatus: boolean) => {
    try {
      // Assuming a backend endpoint for toggling active status
      await api.patch(`/accounts/users/${userId}/`, { is_active: !currentStatus });
      setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
      console.log(`Toggled active status for user ${userId}`);
    } catch (err) {
      console.error("Failed to toggle active status:", err);
    }
  };

  const toggleAgentStatus = async (userId: number, isCurrentlyAgent: boolean) => {
    try {
      // Assuming a backend endpoint for toggling agent status (e.g., adding/removing from 'agent' group)
      // This might be more complex, involving group management. For now, a simplified patch.
      // A dedicated endpoint like /accounts/users/{id}/toggle_agent_role/ would be ideal.
      console.log(`Toggling agent status for user ${userId}. Current: ${isCurrentlyAgent}`);
      // For now, just update frontend state
      setUsers(prevUsers => prevUsers.map(u => {
        if (u.id === userId) {
          const newGroups = isCurrentlyAgent
            ? u.groups.filter(g => g.name !== 'agent')
            : [...u.groups, { name: 'agent' }];
          return { ...u, groups: newGroups };
        }
        return u;
      }));
    } catch (err) {
      console.error("Failed to toggle agent status:", err);
    }
  };

  const deleteUser = async (userId: number) => {
    try {
      await api.delete(`/accounts/users/${userId}/`);
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      console.log(`Deleted user ${userId}`);
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">
            Manage all platform users ({users.length} total)
          </p>
        </div>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : (
          <>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold mb-1">{users.length}</div>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold mb-1">{users.filter((u) => u.groups.some(g => g.name === "agent") && u.is_active).length}</div>
                <p className="text-sm text-muted-foreground">Active Agents</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold mb-1">{users.filter((u) => !u.is_superuser && !u.groups.some(g => g.name === "agent")).length}</div>
                <p className="text-sm text-muted-foreground">Regular Users</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold mb-1">{users.filter((u) => u.agent_profile?.subscription_active === false && u.groups.some(g => g.name === "agent")).length}</div>
                <p className="text-sm text-muted-foreground">Trial Agents</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="glass-effect">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>View and manage user accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-96 w-full" />
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Properties</TableHead>
                  <TableHead>Subscription</TableHead>
                  {/* <TableHead>Joined</TableHead> Removed as not directly available */}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const displayName = user.profile?.name || user.username;
                  const avatarUrl = user.profile?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
                  const isAgent = user.groups.some(g => g.name === 'agent');
                  const subscriptionStatus = isAgent
                    ? (user.agent_profile?.subscription_active ? "Active" : "Inactive")
                    : "-";
                  // Property count needs a separate API endpoint or be embedded in user data from backend
                  const propertyCount = 0; // Placeholder for now

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{displayName}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user)}</TableCell>
                      <TableCell>{getStatusBadge(user.is_active)}</TableCell>
                      <TableCell>
                        {propertyCount > 0 ? (
                          <span className="font-medium">{propertyCount}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{subscriptionStatus}</Badge>
                      </TableCell>
                      {/* <TableCell className="text-muted-foreground">
                        {new Date(user.joined).toLocaleDateString()}
                      </TableCell> */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onClick={() => console.log('Edit user', user.id)}>
                              <Edit className="w-4 h-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => toggleUserActiveStatus(user.id, user.is_active)}>
                              {user.is_active ? "Deactivate User" : "Activate User"}
                            </DropdownMenuItem>
                            {!user.is_superuser && ( // Prevent changing superuser role
                              <DropdownMenuItem className="gap-2" onClick={() => toggleAgentStatus(user.id, isAgent)}>
                                {isAgent ? "Remove Agent Role" : "Make Agent"}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => deleteUser(user.id)}>
                              <Trash2 className="w-4 h-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
