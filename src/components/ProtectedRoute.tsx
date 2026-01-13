import { useAuth, UserType } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    allowedTypes?: UserType[];
}

// Helper function to get the correct dashboard route for each user type
const getDashboardRoute = (userType: UserType): string => {
    switch (userType) {
        case 'farmer':
            return '/farmer-dashboard';
        case 'expert':
            return '/expert-dashboard';
        case 'customer':
            return '/customer-dashboard';
        case 'data_operator':
            return '/data-operator-dashboard';
        default:
            return '/';
    }
};

export const ProtectedRoute = ({ children, requireAuth = true, allowedTypes }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading, user } = useAuth();

    // Wait for auth check to complete before redirecting
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (requireAuth && !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!requireAuth && isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // Check if user type is allowed for this route
    if (allowedTypes && allowedTypes.length > 0 && user) {
        if (!allowedTypes.includes(user.type)) {
            // Redirect to user's appropriate dashboard
            const redirectRoute = getDashboardRoute(user.type);
            return <Navigate to={redirectRoute} replace />;
        }
    }

    return <>{children}</>;
};
