import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = () => {
  const { isAdmin, isAtendente, isUsuario, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>; // Ou um spinner de carregamento
  }

  return (isAdmin || isAtendente || isUsuario) ? <Outlet /> : <Navigate to="/auth/login" replace />;
};

export default ProtectedRoute;