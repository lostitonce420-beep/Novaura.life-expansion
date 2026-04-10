import { useState } from 'react';
import { Mail, Lock, ArrowRight, Server, Globe, Shield } from 'lucide-react';

export default function Webmail() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      alert('In a production environment, this would authenticate against the cPanel Webmail server via IMAP/SMTP or redirect to the Roundcube/Horde interface.');
    }, 1500);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 mb-6">
            <Mail className="h-8 w-8 text-indigo-500" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
            Novaura Webmail
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Secure access to your @novaura.life email account
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email-address" className="block text-sm font-medium text-zinc-300 mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-zinc-500" />
                    </div>
                    <input
                      id="email-address"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-colors"
                      placeholder="you@novaura.life"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-zinc-500" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-zinc-700 rounded bg-zinc-950"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-400">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-indigo-400 hover:text-indigo-300">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-zinc-900 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign in to Webmail
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
          
          <div className="bg-zinc-950/50 px-8 py-6 border-t border-zinc-800">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              Connection Settings (IMAP/SMTP)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Server className="w-4 h-4 text-zinc-500 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-zinc-300">Incoming (IMAP)</p>
                  <p className="text-xs text-zinc-500">mail.novaura.life</p>
                  <p className="text-xs text-zinc-500">Port: 993 (SSL)</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Globe className="w-4 h-4 text-zinc-500 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-zinc-300">Outgoing (SMTP)</p>
                  <p className="text-xs text-zinc-500">mail.novaura.life</p>
                  <p className="text-xs text-zinc-500">Port: 465 (SSL)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center flex items-center justify-center gap-2 text-xs text-zinc-500">
          <Shield className="w-4 h-4" />
          Secured by cPanel & Novaura Infrastructure
        </div>
      </div>
    </div>
  );
}
