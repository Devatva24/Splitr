import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
    <p className="label-xs mb-4">404</p>
    <p className="text-sm text-muted-foreground mb-6">Page not found.</p>
    <Link to="/" className="text-xs text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity">
      Back to home
    </Link>
  </div>
);

export default NotFound;
