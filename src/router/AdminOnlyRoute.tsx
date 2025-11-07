import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminOnlyRoute = () => {
  const { isAdmin, isAtendente, isUsuario, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
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