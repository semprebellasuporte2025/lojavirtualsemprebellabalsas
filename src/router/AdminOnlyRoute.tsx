import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AdminPreloader from '../components/feature/AdminPreloader';

const AdminOnlyRoute = () => {
  const { isAdmin, isAtendente, isUsuario, loading } = useAuth();

  if (loading) {
    return <AdminPreloader />;
  }

  if (isAdmin || isUsuario) {
    return <Outlet />;
  }

  // Atendentes e não logados não podem acessar estas rotas.
  // Se for atendente, redireciona para o painel; caso contrário, para login.
  return isAtendente ? (
    <Navigate to="/paineladmin" replace />
  ) : (
    <Navigate to="/auth/login" replace />
  );
};

export default AdminOnlyRoute;