import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
        <p className="mt-5 text-sm text-muted-foreground">
          If you need help finding something or ran into a problem,{' '}
          <a href="mailto:support@polishedbooking.com?subject=Help — page not found on Polished" className="text-primary no-underline hover:underline">
            email our support team
          </a>{' '}
          and we'll get you sorted.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
