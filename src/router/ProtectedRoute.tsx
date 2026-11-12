import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AdminPreloader from '../components/feature/AdminPreloader';

const ProtectedRoute = () => {
  const { isAdmin, isAtendente, isUsuario, loading } = useAuth();

  if (loading) {
    return <AdminPreloader message="Carregando sessão do usuário..." />;
  }

  return (isAdmin || isAtendente || isUsuario) ? <Outlet /> : <Navigate to="/auth/login" replace />;
};

export default ProtectedRoute;