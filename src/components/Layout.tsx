import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { auth, signOut, signInWithPopup, googleProvider } from '../firebase';
import { Button, buttonVariants } from './ui/button';
import { 
  LayoutDashboard, 
  Calendar, 
  MessageSquare, 
  Newspaper, 
  ShieldCheck, 
  LogOut, 
  LogIn,
  Heart,
  Menu,
  X,
  Bell,
  User as UserIcon,
  UserPlus,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '../lib/utils';

export function Layout({ children }: { children: ReactNode }) {
  const { user, profile, isAdmin, isCoordinator, loginAsGuest } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Notícias', path: '/', icon: Newspaper },
    { name: 'Eventos', path: '/events', icon: Calendar },
    { name: 'Comunidade', path: '/community', icon: Heart },
    {name: 'Cursos', path: '/courses', icon: GraduationCap },
    { name: 'Fórum', path: '/forum', icon: MessageSquare },
  ];

  if (user) {
    navItems.push({ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard });
  }

  if (isCoordinator) {
    navItems.push({ name: 'Administração', path: '/admin', icon: ShieldCheck });
  }

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 py-2">
        <div className="w-full px-4 md:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo Text Only */}
            <Link to="/" className="flex items-center group max-w-[70%] sm:max-w-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-none flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight tracking-tighter group-hover:text-blue-700 transition-colors uppercase">
                  AMORCA
                </h1>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  to={item.path}
                  className={`px-4 py-3 rounded-none text-lg font-bold transition-all flex items-center gap-2 ${
                    location.pathname === item.path 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* User Actions */}
            <div className="flex items-center gap-6">
              {user ? (
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" className="relative text-slate-600 w-12 h-12">
                    <Bell className="w-6 h-6" />
                    <span className="absolute top-3 right-3 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"></span>
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger className="relative h-12 w-12 rounded-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all">
                      <Avatar className="h-12 w-12 border-2 border-blue-100 hover:border-blue-300 transition-colors">
                        <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                        <AvatarFallback className="font-bold">{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 p-2" align="end">
                      <div className="flex flex-col space-y-1 p-3">
                        <p className="text-lg font-bold leading-none">{user.displayName}</p>
                        <p className="text-sm leading-none text-muted-foreground mt-1">{user.email}</p>
                        <p className="text-xs font-black uppercase text-blue-600 mt-2 bg-blue-50 px-2 py-1 rounded inline-block w-fit">{profile?.role}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer flex items-center p-3 text-lg font-bold">
                        <UserIcon className="mr-3 h-5 w-5" />
                        <span>Meu Perfil</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/register')} className="cursor-pointer flex items-center p-3 text-lg font-bold">
                        <UserPlus className="mr-3 h-5 w-5" />
                        <span>Atualizar Cadastro</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer p-3 text-lg font-bold">
                        <LogOut className="mr-3 h-5 w-5" />
                        <span>Sair</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Link 
                    to="/register"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "hidden sm:flex border-orange-500 text-orange-600 hover:bg-orange-50 px-6 py-6 text-lg font-bold rounded-none"
                    )}
                  >
                    Seja um Associado
                  </Link>
                  <Button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700 text-white gap-3 px-6 py-6 text-lg font-bold rounded-none shadow-lg shadow-blue-200">
                    <LogIn className="w-5 h-5" />
                    Entrar
                  </Button>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden bg-white border-t border-slate-100 overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-8 space-y-4">
                {navItems.map((item) => (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-5 py-4 rounded-none text-xl font-bold flex items-center gap-4 transition-all ${
                      location.pathname === item.path 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon className="w-6 h-6" />
                    {item.name}
                  </Link>
                ))}
                {!user && (
                  <div className="pt-6 space-y-4">
                    <Link 
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "w-full border-orange-500 text-orange-600 px-6 py-8 text-xl font-bold rounded-none"
                      )}
                    >
                      Seja um Associado
                    </Link>
                    <Button onClick={handleLogin} className="w-full bg-blue-600 text-white h-16 text-xl font-bold rounded-none shadow-lg">
                      <LogIn className="w-6 h-6 mr-2" />
                      Entrar com Google
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className={cn("flex-grow", location.pathname === '/' ? "bg-gradient-to-br from-orange-500 to-blue-600" : "bg-slate-50")}>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-white font-black text-xl tracking-tight">AMORCA</h3>
              </div>
              <p className="text-lg leading-relaxed text-slate-400">
                Associação de Moradores do Residencial Caminho do Alvorada. Trabalhando juntos por uma comunidade melhor, mais segura e unida.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Links Rápidos</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="hover:text-blue-400 transition-colors">Notícias</Link></li>
                <li><Link to="/events" className="hover:text-blue-400 transition-colors">Eventos</Link></li>
                <li><Link to="/community" className="hover:text-blue-400 transition-colors">Comunidade</Link></li>
                <li><Link to="/forum" className="hover:text-blue-400 transition-colors">Fórum de Discussão</Link></li>
                <li><Link to="/register" className="hover:text-blue-400 transition-colors">Seja um Associado</Link></li>
                <li><Link to="/dashboard" className="hover:text-blue-400 transition-colors">Área do Associado</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contato</h4>
              <p className="text-sm mb-2">Residencial Caminho do Alvorada</p>
              <p className="text-sm mb-2">Email: contato@amorca.org.br</p>
              <p className="text-sm">Tel: (00) 0000-0000</p>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-xs">
            <p>&copy; {new Date().getFullYear()} AMORCA. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
