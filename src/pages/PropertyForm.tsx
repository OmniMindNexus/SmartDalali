import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, X, Plus, MapPin, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function PropertyForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    propertyStatus: "sale",
    type: "apartment",
    bedrooms: "",
    bathrooms: "",
    parking: "yes",
    area: "",
    landSize: "",
    yearBuilt: "",
    about: "",
    location: "",
    city: "",
    address: ""
  });

  const [images, setImages] = useState<string[]>([]);
  const [floorPlans, setFloorPlans] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [isDraft, setIsDraft] = useState(false);

  const amenitiesList = [
    "Swimming Pool", "Gym", "Parking", "Garden", "Security",
    "Air Conditioning", "Balcony", "Elevator", "Generator",
    "Internet", "Furnished", "Pet Friendly"
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "images" | "floorPlans") => {
    const files = e.target.files;
    if (files) {
      // In a real app, upload to server/storage
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      if (type === "images") {
        setImages([...images, ...newImages]);
      } else {
        setFloorPlans([...floorPlans, ...newImages]);
      }
    }
  };

  const removeImage = (index: number, type: "images" | "floorPlans") => {
    if (type === "images") {
      setImages(images.filter((_, i) => i !== index));
    } else {
      setFloorPlans(floorPlans.filter((_, i) => i !== index));
    }
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.price || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (images.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    // In a real app, send to API
    const propertyData = {
      ...formData,
      images,
      floorPlans,
      videoUrl,
      amenities: selectedAmenities,
      status: isDraft ? "draft" : "pending",
      createdAt: new Date().toISOString()
    };

    console.log("Submitting property:", propertyData);
    
    toast.success(isDraft ? "Property saved as draft" : "Property submitted for approval");
    navigate("/agent-dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/agent-dashboard")}>
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
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyStatus">Property Status *</Label>
                  <Select value={formData.propertyStatus} onValueChange={(value) => setFormData({ ...formData, propertyStatus: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">For Sale</SelectItem>
                      <SelectItem value="rent">For Rent</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Property Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    placeholder="3"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    placeholder="2"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">Area (m²) *</Label>
                  <Input
                    id="area"
                    type="number"
                    placeholder="250"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landSize">Land Size (m²)</Label>
                  <Input
                    id="landSize"
                    type="number"
                    placeholder="500"
                    value={formData.landSize}
                    onChange={(e) => setFormData({ ...formData, landSize: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearBuilt">Year Built</Label>
                  <Input
                    id="yearBuilt"
                    type="number"
                    placeholder="2020"
                    value={formData.yearBuilt}
                    onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parking">Parking</Label>
                  <Select value={formData.parking} onValueChange={(value) => setFormData({ ...formData, parking: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">Property Description *</Label>
                <Textarea
                  id="about"
                  placeholder="Describe your property in detail..."
                  rows={5}
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
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
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Area/Neighborhood *</Label>
                  <Input
                    id="location"
                    placeholder="Masaki"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Full Address</Label>
                <Input
                  id="address"
                  placeholder="123 Ocean Drive"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden group">
                    <img src={img} alt={`Property ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index, "images")}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <label className="aspect-video border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, "images")}
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Floor Plans */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Floor Plans</CardTitle>
              <CardDescription>Upload floor plan images (optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {floorPlans.map((img, index) => (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden group">
                    <img src={img} alt={`Floor plan ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index, "floorPlans")}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <label className="aspect-video border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload Floor Plan</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, "floorPlans")}
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Features & Amenities</CardTitle>
              <CardDescription>Select all that apply</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {amenitiesList.map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity}
                      checked={selectedAmenities.includes(amenity)}
                      onCheckedChange={() => toggleAmenity(amenity)}
                    />
                    <label
                      htmlFor={amenity}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {amenity}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Video URL */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Property Video</CardTitle>
              <CardDescription>Add a YouTube or Vimeo video URL (optional)</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/agent-dashboard")}>
              Cancel
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={(e: any) => {
                  setIsDraft(true);
                  handleSubmit(e);
                }}
              >
                Save as Draft
              </Button>
              <Button type="submit">
                {isEdit ? "Update Property" : "Submit for Approval"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
