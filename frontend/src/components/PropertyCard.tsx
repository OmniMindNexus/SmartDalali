import { Bed, Bath, MapPin, Square, Heart } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Property } from "@/data/properties";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  const handleClick = () => {
    navigate(`/properties/${property.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const isFeatured = property.featured_until && new Date(property.featured_until) > new Date();

  // Determine the image source
  const imageUrl = property.main_image_url || (property.MediaProperty && property.MediaProperty.length > 0 ? property.MediaProperty[0].Images : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800');

  return (
    <Card className="overflow-hidden hover-lift cursor-pointer group" onClick={handleClick}>
      <div className="relative aspect-video overflow-hidden">
        <img
          src={imageUrl}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
          {isFeatured && (
            <Badge className="bg-gradient-to-r from-primary to-accent">Featured</Badge>
          )}
          <Button
            size="icon"
            variant="secondary"
            className="ml-auto"
            onClick={handleFavoriteClick}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="capitalize">
            {property.type}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {property.title}
          </h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="w-3 h-3" />
            <span className="line-clamp-1">{property.city}</span>
          </div>
        </div>
        <div className="text-2xl font-bold text-primary mb-3">
          TSh {property.price.toLocaleString()}
          {property.status === "rented" && <span className="text-sm text-muted-foreground">/mo</span>}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground pt-3 border-t">
          {property.bedrooms && (
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Square className="w-4 h-4" />
            <span>{property.area}m²</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
