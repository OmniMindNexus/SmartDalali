import { useNavigate } from "react-router-dom";
import { Home, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 md:p-12 text-center glass-effect">
        <div className="mb-8">
          <div className="text-8xl md:text-9xl font-bold text-primary/20 mb-4">
            404
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </Button>
          <Button
            size="lg"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Button>
          <Button
            size="lg"
            onClick={() => navigate("/properties")}
            variant="secondary"
            className="gap-2"
          >
            <Search className="w-5 h-5" />
            Browse Properties
          </Button>
        </div>
      </Card>
    </div>
  );
}
