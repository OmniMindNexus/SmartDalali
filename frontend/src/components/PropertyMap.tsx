import { Property } from "@/data/properties";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PropertyMapProps {
  properties: Property[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}

export function PropertyMap({ 
  properties, 
  center = [-6.7924, 39.2083],
  zoom = 12,
  height = "600px"
}: PropertyMapProps) {
  const navigate = useNavigate();

  const validProperties = properties.filter(
    p => p.latitude !== null && p.longitude !== null
  );

  return (
    <div style={{ height, width: "100%", borderRadius: "0.5rem" }} className="relative bg-gradient-to-br from-primary/5 to-accent/5 border rounded-lg overflow-hidden">
      {/* Map Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center p-8">
          <Navigation className="h-16 w-16 mx-auto mb-4 text-primary animate-pulse" />
          <h3 className="text-xl font-semibold mb-2">Interactive Map View</h3>
          <p className="text-muted-foreground mb-4">
            Map visualization coming soon with Mapbox integration
          </p>
          <p className="text-sm text-muted-foreground">
            {validProperties.length} properties with coordinates
          </p>
        </div>
      </div>

      {/* Property Markers (Grid View Alternative) */}
      <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur p-4 max-h-48 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {validProperties.slice(0, 6).map((property) => (
            <Card key={property.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/properties?id=${property.id}`)}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <img
                    src={property.main_image_url || (property.MediaProperty && property.MediaProperty.length > 0 ? property.MediaProperty[0].Images : '/placeholder.svg')}
                    alt={property.title}
                    className="w-16 h-16 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{property.title}</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {property.city}
                    </p>
                    <p className="text-sm font-semibold text-primary mt-1">
                      TZS {property.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {validProperties.length > 6 && (
          <Button 
            variant="outline" 
            className="w-full mt-3"
            onClick={() => navigate("/properties")}
          >
            View All {validProperties.length} Properties
          </Button>
        )}
      </div>
    </div>
  );
}
