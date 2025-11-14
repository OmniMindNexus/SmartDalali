import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, X, Plus, MapPin, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Property, MediaProperty } from "@/data/properties";
import { useAuth } from "@/contexts/AuthContext";

export default function PropertyForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: 0,
    type: "", // House, Apartment, Land etc.
    area: 0,
    rooms: 0,
    bedrooms: 0,
    bathrooms: 0,
    status: "active", // active, inactive, sold, rented
    parking: false,
    year_built: "", // Year built is a DateTimeField in backend
    city: "",
    address: "", // Maps to `adress` in backend
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const [currentImages, setCurrentImages] = useState<MediaProperty[]>([]); // Existing images from backend
  const [newImages, setNewImages] = useState<File[]>([]); // New image files to upload
  const [currentFeatures, setCurrentFeatures] = useState<string[]>([]); // Existing features
  const [newFeatureInput, setNewFeatureInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const propertyTypes = ["House", "Apartment", "Office", "Land", "Villa", "Shop", "Warehouse"];
  const propertyStatuses = ["active", "inactive", "sold", "rented"];

  // Fetch property data for editing
  useEffect(() => {
    const fetchPropertyForEdit = async () => {
      if (!isEdit || !id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setFetchError(null);
      try {
        const response = await api.get<Property>(`/properties/${id}/`);
        const propertyData = response.data;

        setFormData({
          title: propertyData.title,
          description: propertyData.description,
          price: propertyData.price,
          type: propertyData.type,
          area: propertyData.area,
          rooms: propertyData.rooms,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          status: propertyData.status,
          parking: propertyData.parking,
          year_built: propertyData.year_built ? new Date(propertyData.year_built).toISOString().split('T')[0] : "",
          city: propertyData.city,
          address: propertyData.address,
          latitude: propertyData.latitude,
          longitude: propertyData.longitude,
        });
        setCurrentImages(propertyData.MediaProperty || []);
        setCurrentFeatures(propertyData.Features_Property?.map(f => f.features) || []);
        // Note: Video URL is not explicitly in current backend MediaProperty model, assumed to be part of MediaProperty[].
        // The backend serializer handles `videos` field, but frontend doesn't have a separate input for it.
      } catch (err) {
        setFetchError("Failed to load property for editing.");
        console.error(err);
        toast.error("Failed to load property data.");
      } finally {
        setLoading(false);
      }
    };
    fetchPropertyForEdit();
  }, [isEdit, id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setNewImages(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeCurrentImage = async (mediaId: number) => {
    // If deleting an existing image, needs a DELETE API call if the backend supports it.
    // For now, just remove from local state.
    setCurrentImages(prev => prev.filter(media => media.id !== mediaId));
    toast.info("Existing image removal is not yet implemented on backend. Removed from local view.");
  };

  const addFeature = () => {
    if (newFeatureInput.trim() && !currentFeatures.includes(newFeatureInput.trim())) {
      setCurrentFeatures(prev => [...prev, newFeatureInput.trim()]);
      setNewFeatureInput("");
    }
  };

  const removeFeature = (featureToRemove: string) => {
    setCurrentFeatures(prev => prev.filter(feature => feature !== featureToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to list a property.");
      navigate('/login');
      return;
    }

    // Validation
    if (!formData.title || !formData.price || !formData.city || !formData.description || !formData.type || !formData.area || !formData.rooms || !formData.bedrooms || !formData.bathrooms) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (newImages.length === 0 && currentImages.length === 0 && !isEdit) { // Require at least one image for new properties
      toast.error("Please upload at least one image");
      return;
    }

    setIsSubmitting(true);

    const payload = new FormData();
    payload.append('title', formData.title);
    payload.append('description', formData.description);
    payload.append('price', formData.price.toString());
    payload.append('type', formData.type);
    payload.append('area', formData.area.toString());
    payload.append('rooms', formData.rooms.toString());
    payload.append('bedrooms', formData.bedrooms.toString());
    payload.append('bathrooms', formData.bathrooms.toString());
    payload.append('status', formData.status);
    payload.append('parking', formData.parking.toString());
    if (formData.year_built) payload.append('year_built', formData.year_built);
    payload.append('city', formData.city);
    payload.append('adress', formData.address); // Backend field is 'adress'
    if (formData.latitude !== null) payload.append('latitude', formData.latitude.toString());
    if (formData.longitude !== null) payload.append('longitude', formData.longitude.toString());
    
    // Features (as array of strings)
    currentFeatures.forEach(feature => {
      payload.append('Features_Property', feature); // Append multiple times with the same key
    });

    // Append new image files
    newImages.forEach(file => {
      payload.append('MediaProperty', file); // Backend expects 'MediaProperty' for image files
    });

    // For editing, include existing images (if backend expects them or handles deletion separately)
    // Currently, backend serializer replaces media if MediaProperty is in payload.
    // For now, only new images are uploaded. Deletion of old images would require a separate endpoint.

    try {
      if (isEdit) {
        await api.patch(`/properties/${id}/`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success("Property updated successfully!");
      } else {
        await api.post("/properties/", payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(isDraft ? "Property saved as draft" : "Property submitted for approval");
      }
      navigate("/agent/listings"); // Redirect to agent dashboard or listings
    } catch (err: any) {
      console.error("Submission error:", err.response?.data || err);
      toast.error(err.response?.data?.detail || "Failed to save property. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <Skeleton className="h-24 w-full mb-8" />
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <p className="text-red-500">{fetchError}</p>
        <Button onClick={() => navigate("/agent/listings")}>Back to Listings</Button>
      </div>
    );
  }

  if (!user || (!user.agent_profile && !user.is_superuser)) {
    return (
      <div className="p-4 md:p-8 space-y-6 text-center">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">Only agents and administrators can add/edit properties.</p>
        <Button onClick={() => navigate("/login")}>Login as Agent/Admin</Button>
      </div>
    );
  }


  const parkingOptions = [{ value: "true", label: "Yes" }, { value: "false", label: "No" }];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/agent/listings")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isEdit ? "Edit Property" : "Add New Property"}
            </h1>
            <p className="text-muted-foreground">
              {isEdit ? "Update property details" : "List a new property for sale or rent"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the main details of your property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Property Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Modern Villa in Masaki"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (TSh) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      placeholder="50000000"
                      className="pl-10"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Property Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status"/>
                    </SelectTrigger>
                    <SelectContent>
                      {propertyStatuses.map(status => (
                        <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Property Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type"/>
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    placeholder="3"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    placeholder="2"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">Area (m²) *</Label>
                  <Input
                    id="area"
                    type="number"
                    placeholder="250"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2"> {/* This maps to `area` too if type is land, or can be separate if needed */}
                  <Label htmlFor="rooms">Rooms</Label>
                  <Input
                    id="rooms"
                    type="number"
                    placeholder="5"
                    name="rooms"
                    value={formData.rooms}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year_built">Year Built</Label>
                  <Input
                    id="year_built"
                    type="number"
                    placeholder="2020"
                    name="year_built"
                    value={formData.year_built}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parking">Parking</Label>
                  <Select value={formData.parking.toString()} onValueChange={(value) => handleSelectChange("parking", value === "true")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parking availability" />
                    </SelectTrigger>
                    <SelectContent>
                      {parkingOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Property Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your property in detail..."
                  rows={5}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Property location details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="Dar es Salaam"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Area/Neighborhood *</Label> {/* Mapping to backend 'adress' */}
                  <Input
                    id="address"
                    placeholder="Masaki"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="-6.7924"
                    name="latitude"
                    value={formData.latitude ?? ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="39.2083"
                    name="longitude"
                    value={formData.longitude ?? ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="detailedAddress">Full Address (Optional)</Label>
                <Input
                  id="detailedAddress"
                  placeholder="123 Ocean Drive"
                  name="address" // Use 'address' field, which maps to backend 'adress'
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Property Images *</CardTitle>
              <CardDescription>Upload high-quality images of your property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentImages.map((media, index) => (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden group">
                    <img src={media.Images || "/placeholder.svg"} alt={`Property ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeCurrentImage(media.id)}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {newImages.map((file, index) => (
                  <div key={`new-img-${index}`} className="relative aspect-video rounded-lg overflow-hidden group">
                    <img src={URL.createObjectURL(file)} alt={`New Image ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <label htmlFor="imageUpload" className="aspect-video border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Add Image</span>
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Floor Plans */}
          {/* Removed Floor Plans section as it's not explicitly supported by backend MediaProperty for now */}

          {/* Features */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>Select all that apply</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {currentFeatures.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="pr-1">
                    {feature}
                    <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => removeFeature(feature)} />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a new feature (e.g., Swimming Pool)"
                  value={newFeatureInput}
                  onChange={(e) => setNewFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addFeature();
                    }
                  }}
                />
                <Button type="button" onClick={addFeature}>
                  <Plus className="w-4 h-4 mr-2" /> Add
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Press Enter or click "Add" to add a feature.</p>
            </CardContent>
          </Card>

          {/* Video URL is not explicitly separate in backend for now, assumed to be part of MediaProperty for future */}
          <Card className="glass-effect hidden"> {/* Hidden for now as video is part of MediaProperty */}
            <CardHeader>
              <CardTitle>Property Video</CardTitle>
              <CardDescription>Add a YouTube or Vimeo video URL (optional)</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="https://youtube.com/watch?v=..."
                value={""} // videoUrl state removed
                onChange={(e) => {}} // videoUrl state removed
              />
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/agent/listings")}>
              Cancel
            </Button>
            <div className="flex gap-3">
              {/* The concept of "draft" vs "submitted for approval" might be handled by is_published field */}
              {isEdit ? (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Property"}
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={async (e) => {
                      setFormData(prev => ({...prev, status: 'inactive'})); // Mark as inactive for draft
                      setIsDraft(true);
                      await handleSubmit(e);
                    }}
                  >
                    Save as Draft
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit for Approval"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
