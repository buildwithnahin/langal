import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import FarmerDashboard from "./FarmerDashboard";

const Index = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return;

    // If not authenticated, go to login page
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true });
      return;
    }

    // Redirect based on user type
    console.log('Index.tsx - Current user:', user);
    console.log('Index.tsx - User type:', user.type);

    switch (user.type) {
      case 'data_operator':
        navigate('/data-operator-dashboard', { replace: true });
        break;
      case 'expert':
        navigate('/expert-dashboard', { replace: true });
        break;
      case 'customer':
        navigate('/customer-dashboard', { replace: true });
        break;
      case 'farmer':
        navigate('/farmer-dashboard', { replace: true });
        break;
      default:
        console.warn('Unknown user type:', user.type);
        navigate('/login', { replace: true });
        break;
    }
  }, [user, isLoading, isAuthenticated, navigate]);

  // Show loading while checking auth
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">লোড হচ্ছে...</p>
      </div>
    </div>
  );
};

export default Index;
