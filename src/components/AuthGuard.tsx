import { useAuth } from '../hooks/useAuth';
import { ReactNode } from 'react';

export function AuthGuard({ children, requireAdmin, requireCoordinator }: { 
  children: ReactNode, 
  requireAdmin?: boolean,
  requireCoordinator?: boolean 
}) {
  const { user, profile, loading, isAdmin, isCoordinator } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Acesso Restrito</h2>
        <p className="mb-6 text-muted-foreground">Você precisa estar logado para acessar esta página.</p>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
        <p className="mb-6 text-muted-foreground">Esta página é restrita para administradores.</p>
      </div>
    );
  }

  if (requireCoordinator && !isCoordinator) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
        <p className="mb-6 text-muted-foreground">Esta página é restrita para coordenadores.</p>
      </div>
    );
  }

  return <>{children}</>;
}
