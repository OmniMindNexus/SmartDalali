import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Heart, MessageSquare, User, Settings, Eye, Search, MapPin, Home as HomeIcon, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyCard } from "@/components/PropertyCard";
import { mockProperties } from "@/data/properties";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function UserOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - would come from backend
  const favoriteProperties = mockProperties.slice(0, 3);
  const recentlyViewed = mockProperties.slice(3, 6);
  const savedSearches = [
    { id: 1, query: "3 bedroom house in Dar es Salaam", results: 12 },
    { id: 2, query: "Commercial property in Arusha", results: 5 },
  ];
  const messages = [
    { id: 1, agent: "John Agent", property: "Luxury Villa in Masaki", unread: true, time: "2h ago" },
    { id: 2, agent: "Sarah Wilson", property: "Modern Apartment", unread: false, time: "1d ago" },
  ];

  const stats = [
    {
      title: "Saved Properties",
      value: favoriteProperties.length.toString(),
      icon: Heart,
      color: "bg-gradient-to-br from-pink-500/10 to-pink-500/5 border-pink-500/20",
      iconColor: "text-pink-500",
    },
    {
      title: "Recently Viewed",
      value: recentlyViewed.length.toString(),
      icon: Eye,
      color: "bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20",
      iconColor: "text-blue-500",
    },
    {
      title: "Messages",
      value: messages.length.toString(),
      icon: MessageSquare,
      color: "bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20",
      iconColor: "text-green-500",
    },
    {
      title: "Saved Searches",
      value: savedSearches.length.toString(),
      icon: Search,
      color: "bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20",
      iconColor: "text-purple-500",
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-effect rounded-2xl p-6 border">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
        <p className="text-muted-foreground">Find your dream property today</p>
      </div>

      {/* Quick Search */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Quick Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search properties by location, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => navigate(`/properties?q=${searchQuery}`)}>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className={`${stat.color} hover-lift cursor-pointer`}>
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

      {/* Main Content Tabs */}
      <Tabs defaultValue="favorites" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 browser-tab">
          <TabsTrigger value="favorites" className="browser-tab">
            <Heart className="w-4 h-4 mr-2" />
            Favorites
          </TabsTrigger>
          <TabsTrigger value="recent" className="browser-tab">
            <Eye className="w-4 h-4 mr-2" />
            Recent
          </TabsTrigger>
          <TabsTrigger value="searches" className="browser-tab">
            <Search className="w-4 h-4 mr-2" />
            Searches
          </TabsTrigger>
          <TabsTrigger value="messages" className="browser-tab">
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages
            {messages.some(m => m.unread) && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                {messages.filter(m => m.unread).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="favorites" className="space-y-4">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Saved Properties</CardTitle>
              <CardDescription>Properties you've added to your favorites</CardDescription>
            </CardHeader>
            <CardContent>
              {favoriteProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start exploring properties and save your favorites
                  </p>
                  <Button onClick={() => navigate("/properties")}>Browse Properties</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Recently Viewed</CardTitle>
              <CardDescription>Properties you've viewed recently</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentlyViewed.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="searches" className="space-y-4">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Saved Searches</CardTitle>
              <CardDescription>Get notified when new properties match your criteria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {savedSearches.map((search) => (
                  <div
                    key={search.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Search className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{search.query}</p>
                        <p className="text-sm text-muted-foreground">
                          {search.results} properties available
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Results
                      </Button>
                      <Button variant="ghost" size="sm">
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Your conversations with property agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{message.agent}</p>
                          {message.unread && (
                            <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{message.property}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">{message.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function UserDashboard() {
  return (
    <Routes>
      <Route index element={<UserOverview />} />
      <Route path="profile" element={<div className="p-8"><h2 className="text-2xl font-bold">Profile Settings (Coming Soon)</h2></div>} />
    </Routes>
  );
}
