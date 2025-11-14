import { Navigate, useLocation } from 'react-router-dom';

export default function AdminAliasRedirect() {
  const location = useLocation();
  const current = location.pathname + location.search + location.hash;
  // Redireciona qualquer caminho que comece com /admin para /paineladmin
  const target = current.replace(/^\/admin(\/|$)/, '/paineladmin$1');
  return <Navigate to={target} replace />;
}