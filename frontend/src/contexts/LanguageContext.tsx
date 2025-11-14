import { createContext, useContext, useState, ReactNode } from "react";

export const LANGUAGES = {
  en: { name: "English", code: "en" },
  sw: { name: "Kiswahili", code: "sw" },
  fr: { name: "Français", code: "fr" },
  es: { name: "Español", code: "es" },
};

export type LanguageCode = keyof typeof LANGUAGES;

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    "app.title": "SmartDalali",
    "app.tagline": "Find Your Dream Property in Tanzania",
    "nav.home": "Home",
    "nav.properties": "Properties",
    "nav.dashboard": "Dashboard",
    "nav.admin": "Admin",
    "nav.login": "Login",
    "nav.logout": "Logout",
    "hero.title": "Discover Properties Across Tanzania",
    "hero.subtitle": "Buy, rent, or sell apartments, houses, and land with ease",
    "search.placeholder": "Search by location, property type...",
    "property.forSale": "For Sale",
    "property.forRent": "For Rent",
    "property.land": "Land",
    "filter.all": "All Properties",
    "filter.sale": "For Sale",
    "filter.rent": "For Rent",
    "filter.land": "Land",
    "agent.dashboard": "Agent Dashboard",
    "agent.myListings": "My Listings",
    "agent.addProperty": "Add Property",
    "agent.subscription": "Subscription",
    "admin.dashboard": "Admin Dashboard",
    "admin.users": "Users",
    "admin.properties": "Properties",
    "admin.payments": "Payments",
    "login.title": "Sign In",
    "login.email": "Email",
    "login.password": "Password",
    "login.submit": "Sign In",
    "login.testAccounts": "Test Accounts",
  },
  sw: {
    "app.title": "SmartDalali",
    "app.tagline": "Pata Mali Yako ya Ndoto Tanzania",
    "nav.home": "Nyumbani",
    "nav.properties": "Mali",
    "nav.dashboard": "Dashibodi",
    "nav.admin": "Msimamizi",
    "nav.login": "Ingia",
    "nav.logout": "Toka",
    "hero.title": "Gundua Mali Kote Tanzania",
    "hero.subtitle": "Nunua, panga au uze vyumba, nyumba na ardhi kwa urahisi",
    "search.placeholder": "Tafuta kwa eneo, aina ya mali...",
    "property.forSale": "Kwa Mauzo",
    "property.forRent": "Kwa Kupanga",
    "property.land": "Ardhi",
    "filter.all": "Mali Zote",
    "filter.sale": "Kwa Mauzo",
    "filter.rent": "Kwa Kupanga",
    "filter.land": "Ardhi",
    "agent.dashboard": "Dashibodi ya Wakala",
    "agent.myListings": "Orodha Zangu",
    "agent.addProperty": "Ongeza Mali",
    "agent.subscription": "Usajili",
    "admin.dashboard": "Dashibodi ya Msimamizi",
    "admin.users": "Watumiaji",
    "admin.properties": "Mali",
    "admin.payments": "Malipo",
    "login.title": "Ingia",
    "login.email": "Barua Pepe",
    "login.password": "Nywila",
    "login.submit": "Ingia",
    "login.testAccounts": "Akaunti za Majaribio",
  },
  fr: {
    "app.title": "SmartDalali",
    "app.tagline": "Trouvez la Propriété de Vos Rêves en Tanzanie",
    "nav.home": "Accueil",
    "nav.properties": "Propriétés",
    "nav.dashboard": "Tableau de bord",
    "nav.admin": "Admin",
    "nav.login": "Connexion",
    "nav.logout": "Déconnexion",
    "hero.title": "Découvrez des Propriétés à Travers la Tanzanie",
    "hero.subtitle": "Achetez, louez ou vendez des appartements, maisons et terrains facilement",
    "search.placeholder": "Rechercher par emplacement, type de propriété...",
    "property.forSale": "À Vendre",
    "property.forRent": "À Louer",
    "property.land": "Terrain",
    "filter.all": "Toutes les Propriétés",
    "filter.sale": "À Vendre",
    "filter.rent": "À Louer",
    "filter.land": "Terrain",
    "agent.dashboard": "Tableau de Bord Agent",
    "agent.myListings": "Mes Annonces",
    "agent.addProperty": "Ajouter Propriété",
    "agent.subscription": "Abonnement",
    "admin.dashboard": "Tableau de Bord Admin",
    "admin.users": "Utilisateurs",
    "admin.properties": "Propriétés",
    "admin.payments": "Paiements",
    "login.title": "Se Connecter",
    "login.email": "Email",
    "login.password": "Mot de passe",
    "login.submit": "Se Connecter",
    "login.testAccounts": "Comptes de Test",
  },
  es: {
    "app.title": "SmartDalali",
    "app.tagline": "Encuentra Tu Propiedad Soñada en Tanzania",
    "nav.home": "Inicio",
    "nav.properties": "Propiedades",
    "nav.dashboard": "Panel",
    "nav.admin": "Admin",
    "nav.login": "Iniciar Sesión",
    "nav.logout": "Cerrar Sesión",
    "hero.title": "Descubre Propiedades en Tanzania",
    "hero.subtitle": "Compra, alquila o vende apartamentos, casas y terrenos fácilmente",
    "search.placeholder": "Buscar por ubicación, tipo de propiedad...",
    "property.forSale": "En Venta",
    "property.forRent": "En Alquiler",
    "property.land": "Terreno",
    "filter.all": "Todas las Propiedades",
    "filter.sale": "En Venta",
    "filter.rent": "En Alquiler",
    "filter.land": "Terreno",
    "agent.dashboard": "Panel del Agente",
    "agent.myListings": "Mis Listados",
    "agent.addProperty": "Agregar Propiedad",
    "agent.subscription": "Suscripción",
    "admin.dashboard": "Panel de Admin",
    "admin.users": "Usuarios",
    "admin.properties": "Propiedades",
    "admin.payments": "Pagos",
    "login.title": "Iniciar Sesión",
    "login.email": "Correo",
    "login.password": "Contraseña",
    "login.submit": "Iniciar Sesión",
    "login.testAccounts": "Cuentas de Prueba",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const stored = localStorage.getItem("smartdalali_language");
    return (stored as LanguageCode) || "en";
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem("smartdalali_language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
