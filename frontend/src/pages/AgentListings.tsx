import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Eye, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth, User } from "@/contexts/AuthContext";
import { Property } from "@/data/properties"; // Use the updated Property interface
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function AgentListings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [agentProperties, setAgentProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAgentProperties = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/properties/?owner=${user.id}`); // Filter by owner (current user)
      setAgentProperties(response.data.results || []);
    } catch (err) {
      setError("Failed to load your property listings.");
      console.error(err);
      setAgentProperties([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAgentProperties();
  }, [fetchAgentProperties]);

  // Filter by search query on the client side after fetching
  const filteredProperties = agentProperties.filter((property) =>
    property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: number) => {
    setDeleteId(id.toString()); // Store ID as string for AlertDialog
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/properties/${deleteId}/`);
      setAgentProperties(prev => prev.filter(p => p.id.toString() !== deleteId));
      toast({ title: "Property deleted", description: "Your property has been successfully removed." });
    } catch (err) {
      toast({ title: "Deletion failed", description: "Could not delete property. Please try again.", variant: "destructive" });
      console.error("Failed to delete property:", err);
    }
    setDeleteId(null);
  };

  // Function to get appropriate badge variant based on backend status and is_published
  const getStatusBadgeVariant = (isPublished: boolean, status: string) => {
    if (!isPublished) return "secondary"; // Draft or not yet published
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "sold":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "rented":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Listings</h1>
          <p className="text-muted-foreground">Manage your property listings ({agentProperties.length} total)</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/properties/new")}>
          <Plus className="w-4 h-4" />
          Add New Property
        </Button>
      </div>

      {/* Search */}
      <Card className="glass-effect">
        <CardContent className="pt-6">
          <Input
            placeholder="Search by title or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Listings Grid */}
      {filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredProperties.map((property) => (
            <Card key={property.id} className="glass-effect hover-lift">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Image */}
                  <div className="relative w-full md:w-64 h-48 rounded-lg overflow-hidden">
                    <img
                      src={property.main_image_url || property.MediaProperty[0]?.Images || "/placeholder.svg"}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge
                      className={`absolute top-2 right-2 ${getStatusBadgeVariant(property.is_published, property.status)}`}
                    >
                      {property.is_published ? property.status : "Draft"}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{property.title}</h3>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <MapPin className="w-4 h-4" />
                        {property.address}, {property.city}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Type:</span>{" "}
                        <span className="font-medium">{property.type}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Price:</span>{" "}
                        <span className="font-medium">
                          TSh {property.price.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Views:</span>{" "}
                        <span className="font-medium">{property.view_count}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{property.bedrooms} beds</span>
                      <span>•</span>
                      <span>{property.bathrooms} baths</span>
                      <span>•</span>
                      <span>{property.area} m²</span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/properties/${property.id}`)}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/properties/${property.id}/edit`)}
                        className="gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(property.id)}
                        className="gap-2 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-effect">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? "No properties found" : "No listings yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Start adding properties to reach potential buyers"}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate("/properties/new")}>
                  Add Your First Property
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this property? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
