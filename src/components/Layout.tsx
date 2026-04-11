import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Mic, 
  Search, 
  MapPin, 
  Activity,
  Sparkles,
  Database,
  Menu,
  X,
  Key,
  CreditCard,
  Terminal,
  Mail,
  LogOut,
  LogIn
} from 'lucide-react';
import { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import MatrixBackground from './MatrixBackground';
import { useAuth } from '../context/AuthContext';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const mainNavigation = [
  { name: 'Dashboard', href: '/', icon: Activity },
  { name: 'Novaura Core', href: '/core', icon: Terminal },
  { name: 'Gemini Chat', href: '/chat', icon: MessageSquare },
  { name: 'Image Studio', href: '/image', icon: ImageIcon },
  { name: 'Video Studio', href: '/video', icon: Video },
  { name: 'Audio & Music', href: '/audio', icon: Music },
  { name: 'Voice Live', href: '/voice', icon: Mic },
  { name: 'Analysis', href: '/analysis', icon: Sparkles },
  { name: 'Grounding', href: '/grounding', icon: Search },
];

const adminNavigation = [
  { name: 'Cloud Manager', href: '/cloud', icon: Database },
  { name: 'API Hub', href: '/api-hub', icon: Key },
  { name: 'Webmail', href: '/webmail', icon: Mail },
  { name: 'Stripe Demo', href: '/stripe-demo', icon: CreditCard },
];

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signIn, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex relative overflow-hidden">
      {/* Matrix Background */}
      <MatrixBackground />

      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-zinc-900 rounded-md border border-zinc-800 text-zinc-400 hover:text-zinc-50"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-zinc-950 border-r border-zinc-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:block flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-zinc-800">
          <Sparkles className="h-6 w-6 text-indigo-500 mr-2" />
          <span className="font-semibold text-lg tracking-tight">Novaura</span>
        </div>
        <nav className="flex flex-1 flex-col px-4 py-6 space-y-6 overflow-y-auto">
          <div className="space-y-1">
            <h3 className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Workspace</h3>
            {mainNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    isActive 
                      ? 'bg-indigo-500/10 text-indigo-400' 
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50',
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors'
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300',
                      'mr-3 h-5 w-5 shrink-0 transition-colors'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="space-y-1">
            <h3 className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Admin & Dev Tools</h3>
            {adminNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    isActive 
                      ? 'bg-indigo-500/10 text-indigo-400' 
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50',
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors'
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300',
                      'mr-3 h-5 w-5 shrink-0 transition-colors'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
        
        <div className="p-4 border-t border-zinc-800 mt-auto">
          {user ? (
            <div className="flex flex-col space-y-3">
              <div className="flex items-center px-2">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full mr-3" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center mr-3">
                    {user.email?.[0].toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium text-zinc-200 truncate">{user.displayName || 'User'}</span>
                  <span className="text-xs text-zinc-500 truncate">{user.email}</span>
                </div>
              </div>
              <button 
                onClick={signOut}
                className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-zinc-400 bg-zinc-900/50 hover:bg-zinc-800 hover:text-zinc-50 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          ) : (
            <button 
              onClick={signIn}
              className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign in with Google
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
