import { useState, lazy } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Plus, TrendingUp, DollarSign, Calendar, Building2, Eye, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyCard } from "@/components/PropertyCard";
import { mockProperties } from "@/data/properties";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MpesaPaymentForm } from "@/components/MpesaPaymentForm";
import { StripePaymentForm } from "@/components/StripePaymentForm";

function AgentOverview() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("monthly");
  
  const agentProperties = mockProperties.filter((p) => p.agentId === user?.id);
  
  const monthlyPrice = 50000;
  const annualPrice = 500000;
  const totalViews = 1234;
  const totalInquiries = 45;
  const earnings = 125000;

  const stats = [
    {
      title: "Total Listings",
      value: agentProperties.length.toString(),
      icon: Building2,
      color: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20",
      iconColor: "text-primary",
    },
    {
      title: "Total Views",
      value: totalViews.toLocaleString(),
      icon: Eye,
      color: "bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20",
      iconColor: "text-blue-500",
    },
    {
      title: "Inquiries",
      value: totalInquiries.toString(),
      icon: TrendingUp,
      color: "bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20",
      iconColor: "text-green-500",
    },
    {
      title: "Earnings",
      value: `TSh ${earnings.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20",
      iconColor: "text-orange-500",
    },
  ];

  const handleUpgrade = (plan: "monthly" | "annual") => {
    setSelectedPlan(plan);
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Agent Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/agent/listings")}>
          <Plus className="w-4 h-4" />
          Add Property
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className={stat.color}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-primary shadow-lg shadow-primary/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Monthly Plan</CardTitle>
              <Badge>Popular</Badge>
            </div>
            <CardDescription>Perfect for getting started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-3xl font-bold">TSh {monthlyPrice.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">per month</div>
            </div>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Unlimited property listings
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Priority customer support
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Advanced analytics
              </li>
            </ul>
            <Button 
              className="w-full" 
              onClick={() => handleUpgrade("monthly")}
            >
              Subscribe Monthly
            </Button>
          </CardContent>
        </Card>

        <Card className="border-orange-500 shadow-lg shadow-orange-500/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Annual Plan</CardTitle>
              <Badge variant="secondary">Save 17%</Badge>
            </div>
            <CardDescription>Best value for serious agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-3xl font-bold">TSh {annualPrice.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">
                per year (TSh {Math.round(annualPrice / 12).toLocaleString()}/month)
              </div>
            </div>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                Everything in Monthly plan
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                2 months free
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                Featured listings priority
              </li>
            </ul>
            <Button 
              className="w-full bg-orange-600 hover:bg-orange-700" 
              onClick={() => handleUpgrade("annual")}
            >
              Subscribe Annually
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* My Listings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Listings</CardTitle>
              <CardDescription>Manage your property listings</CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate("/agent/listings")}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {agentProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agentProperties.slice(0, 3).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2">No listings yet</h3>
              <p className="text-muted-foreground mb-4">
                Start adding properties to reach potential buyers
              </p>
              <Button>Add Your First Property</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Subscribe to {selectedPlan === "monthly" ? "Monthly" : "Annual"} Plan
            </DialogTitle>
            <DialogDescription>
              Choose your payment method to complete subscription
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="mpesa" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="mpesa">M-Pesa</TabsTrigger>
              <TabsTrigger value="stripe">Card</TabsTrigger>
            </TabsList>
            <TabsContent value="mpesa" className="mt-4">
              <MpesaPaymentForm
                amount={selectedPlan === "monthly" ? monthlyPrice : annualPrice}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setShowPaymentDialog(false)}
              />
            </TabsContent>
            <TabsContent value="stripe" className="mt-4">
              <StripePaymentForm
                amount={selectedPlan === "monthly" ? monthlyPrice : annualPrice}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setShowPaymentDialog(false)}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AgentDashboard() {
  const AgentListings = lazy(() => import("@/pages/AgentListings"));
  
  return (
    <Routes>
      <Route index element={<AgentOverview />} />
      <Route path="listings" element={<AgentListings />} />
    </Routes>
  );
}
