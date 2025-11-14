import { lazy, useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Users, Building2, DollarSign, TrendingUp, CheckCircle, XCircle, Clock, Settings as SettingsIcon, Home, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import { Property } from "@/data/properties"; // Import the updated Property interface
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

function AdminOverview() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [userStats, setUserStats] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]); // To get names for payments
  const [properties, setProperties] = useState<Property[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [errorStats, setErrorStats] = useState<string | null>(null);
  const [errorProperties, setErrorProperties] = useState<string | null>(null);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);
  const [errorPayments, setErrorPayments] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      // Fetch user stats
      setLoadingStats(true);
      try {
        const response = await api.get("/accounts/users/stats/");
        setUserStats(response.data);
      } catch (err) {
        setErrorStats("Failed to fetch user statistics.");
        console.error(err);
      } finally {
        setLoadingStats(false);
      }

      // Fetch all users (for recent users section and to link agent names to payments)
      setLoadingUsers(true);
      try {
        const response = await api.get("/accounts/users/");
        setAllUsers(response.data.results || []);
      } catch (err) {
        setErrorUsers("Failed to fetch user list.");
        console.error(err);
      } finally {
        setLoadingUsers(false);
      }

      // Fetch all properties
      setLoadingProperties(true);
      try {
        const response = await api.get("/properties/?is_published=true");
        setProperties(response.data.results || []);
      } catch (err) {
        setErrorProperties("Failed to fetch properties.");
        console.error(err);
      } finally {
        setLoadingProperties(false);
      }

      // Fetch all payments
      setLoadingPayments(true);
      try {
        const response = await api.get("/payments/payments/");
        setPayments(response.data.results || []);
      } catch (err) {
        setErrorPayments("Failed to fetch payments.");
        console.error(err);
      } finally {
        setLoadingPayments(false);
      }
    };

    fetchAdminData();
  }, []);

  const recentUsers = allUsers.slice(0, 3).map(user => ({
    id: user.id,
    name: user.profile?.name || user.username,
    email: user.email,
    role: user.is_superuser ? "Admin" : (user.groups.some((g: any) => g.name === 'agent') ? "Agent" : "User"),
    status: user.is_active ? "Active" : "Inactive",
  }));

  const recentPayments = payments.slice(0, 3).map(payment => ({
    id: payment.id,
    agent_id: payment.user, // The user ID of the payer
    agent_name: allUsers.find(u => u.id === payment.user)?.profile?.name || allUsers.find(u => u.id === payment.user)?.username || "N/A",
    amount: payment.amount,
    plan: "Subscription", // Assuming all payments here are for subscriptions
    status: payment.status,
    date: payment.created_at,
  }));

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      {loadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : errorStats ? (
        <p className="text-red-500">{errorStats}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("admin.users")}</CardTitle>
              <Users className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats?.total_users || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {userStats?.recent_signups > 0 ? `+${userStats.recent_signups} new last month` : "No new signups"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("admin.properties")}</CardTitle>
              <Building2 className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{properties.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {/* Add logic to show new properties last month */}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">TSh {payments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {/* Add logic for change in revenue */}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Agents</CardTitle>
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats?.agents || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {/* Add logic for change in active agents */}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Management Tabs */}
      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage all platform users</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <Skeleton className="h-48 w-full" />
              ) : errorUsers ? (
                <p className="text-red-500">{errorUsers}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === "Active" ? "default" : "secondary"}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/users?edit=${user.id}`)}>Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Management</CardTitle>
              <CardDescription>Review and manage all property listings</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProperties ? (
                <Skeleton className="h-48 w-full" />
              ) : errorProperties ? (
                <p className="text-red-500">{errorProperties}</p>
              ) : (
                <div className="space-y-4">
                  {properties.slice(0, 5).map((property) => (
                    <div
                      key={property.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <img
                        src={property.main_image_url || property.MediaProperty[0]?.Images || "/placeholder.svg"}
                        alt={property.title}
                        className="w-20 h-20 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium line-clamp-1">{property.title}</p>
                        <p className="text-sm text-muted-foreground">{property.city} • {property.type}</p>
                        <p className="text-sm font-medium mt-1">TSh {property.price.toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge variant={property.is_published ? "default" : "secondary"}>{property.is_published ? "Published" : "Draft"}</Badge>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/properties/${property.id}`)}>Review</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Track all subscription payments</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <Skeleton className="h-48 w-full" />
              ) : errorPayments ? (
                <p className="text-red-500">{errorPayments}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.agent_name}</TableCell>
                        <TableCell>{payment.plan}</TableCell>
                        <TableCell>TSh {parseFloat(payment.amount).toLocaleString()}</TableCell>
                        <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {payment.status === "completed" ? (<Badge className="gap-1"><CheckCircle className="w-3 h-3" />Success</Badge>)
                            : payment.status === "pending" ? (<Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />Pending</Badge>)
                              : (<Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Failed</Badge>)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col items-start hover:bg-primary/5"
              onClick={() => navigate("/admin/users")}
            >
              <Users className="h-6 w-6 mb-2 text-primary" />
              <h4 className="font-medium mb-1">Manage Users</h4>
              <p className="text-sm text-muted-foreground text-left">
                View and edit user accounts
              </p>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col items-start hover:bg-primary/5"
              onClick={() => navigate("/admin/settings")}
            >
              <SettingsIcon className="h-6 w-6 mb-2 text-primary" />
              <h4 className="font-medium mb-1">System Settings</h4>
              <p className="text-sm text-muted-foreground text-left">
                Configure platform settings
              </p>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col items-start hover:bg-primary/5"
            >
              <BarChart3 className="h-6 w-6 mb-2 text-primary" />
              <h4 className="font-medium mb-1">Analytics</h4>
              <p className="text-sm text-muted-foreground text-left">
                View detailed reports
              </p>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDashboard() {
  const AdminUsers = lazy(() => import("@/pages/AdminUsers"));
  const AdminSettings = lazy(() => import("@/pages/AdminSettings"));
  
  return (
    <Routes>
      <Route index element={<AdminOverview />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="settings" element={<AdminSettings />} />
    </Routes>
  );
}
