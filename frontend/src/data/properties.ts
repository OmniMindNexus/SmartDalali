// Simplified Property type used across the frontend components
export interface MediaProperty {
  id: number;
  Images: string | null;
  videos: string | null;
  caption: string;
}

export interface Features {
  id: number;
  features: string;
}

export interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  type: "House" | "Apartment" | "Office" | "Land" | "Villa" | "Shop" | "Warehouse";
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  city: string;
  address: string; // Corrected from 'adress' in backend
  location: string; // PointField in backend, represented as string "POINT(lng lat)"
  latitude: number | null;
  longitude: number | null;
  is_published: boolean;
  is_paid: boolean;
  featured_until: string | null;
  view_count: number;
  owner: number; // User ID
  created_at: string;
  updated_at: string;
  MediaProperty: MediaProperty[];
  Features_Property: Features[];
  agent: {
    id: number;
    username: string;
    name: string | null;
    phone: string | null;
  };
  main_image_url: string | null;
  status: "active" | "inactive" | "sold" | "rented";
}
