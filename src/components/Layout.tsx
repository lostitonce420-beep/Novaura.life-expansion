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
  X
} from 'lucide-react';
import { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Activity },
  { name: 'Gemini Chat', href: '/chat', icon: MessageSquare },
  { name: 'Image Studio', href: '/image', icon: ImageIcon },
  { name: 'Video Studio', href: '/video', icon: Video },
  { name: 'Audio & Music', href: '/audio', icon: Music },
  { name: 'Voice Live', href: '/voice', icon: Mic },
  { name: 'Analysis', href: '/analysis', icon: Sparkles },
  { name: 'Grounding', href: '/grounding', icon: Search },
  { name: 'Cloud Manager', href: '/cloud', icon: Database },
];

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex">
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
        "fixed inset-y-0 left-0 z-40 w-64 bg-zinc-950 border-r border-zinc-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:block",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-zinc-800">
          <Sparkles className="h-6 w-6 text-indigo-500 mr-2" />
          <span className="font-semibold text-lg tracking-tight">Novaura</span>
        </div>
        <nav className="flex flex-1 flex-col px-4 py-6 space-y-1">
          {navigation.map((item) => {
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
        </nav>
        
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-400">
            <Database className="mr-3 h-5 w-5 text-zinc-500" />
            Firebase Auth
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
