import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { PropertyMap } from "@/components/PropertyMap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { Property } from "@/data/properties"; // Import the updated Property interface
import { Skeleton } from "@/components/ui/skeleton";

export default function MapView() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndFilterProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/properties/?is_published=true"); // Fetch all published properties
      const fetchedProperties: Property[] = response.data.results || [];
      setProperties(fetchedProperties);
      
      let filtered = fetchedProperties;

      // Apply filters based on current state
      if (searchQuery) {
        filtered = filtered.filter(p =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.address.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (selectedType !== "all") {
        filtered = filtered.filter(p => p.type === selectedType);
      }

      if (selectedCity !== "all") {
        filtered = filtered.filter(p => p.city === selectedCity);
      }
      setFilteredProperties(filtered);
    } catch (err) {
      setError("Failed to load properties for map view.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedType, selectedCity]);

  useEffect(() => {
    fetchAndFilterProperties();
  }, [fetchAndFilterProperties]); // Rerun when filters or search query change

  const cities = [...new Set(properties.map(p => p.city))]; // Use p.city directly
  const types = [...new Set(properties.map(p => p.type))]; // Use p.type directly

  // handleFilter now just triggers refetching/re-filtering
  const handleApplyFilters = () => {
    fetchAndFilterProperties();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading properties...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Property Map</h1>
          <p className="text-muted-foreground">Explore properties on an interactive map</p>
        </div>

        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter
            </CardTitle>
            <CardDescription>Find properties by location, type, or keywords</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="md:col-span-2"
              />
              
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map(type => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCity} onValueChange={(value) => setSelectedCity(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleApplyFilters} className="md:col-span-4">
                <Search className="h-4 w-4 mr-2" />
                Apply Filters ({filteredProperties.length} properties)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <PropertyMap properties={filteredProperties} height="70vh" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
