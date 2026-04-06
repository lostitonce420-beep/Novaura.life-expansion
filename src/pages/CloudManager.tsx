import { useState, useEffect } from 'react';
import { Key, Cloud, Database, Server, AlertTriangle, Save, CheckCircle2, Loader2, Copy } from 'lucide-react';
import { cn } from '../components/Layout';

const CLOUD_CONFIG_KEY = 'novaura_cloud_config';

export default function CloudManager() {
  const [serviceAccountJson, setServiceAccountJson] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'services'>('config');
  
  // API Key Generation State
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [generatedKeys, setGeneratedKeys] = useState<{service: string, key: string}[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(CLOUD_CONFIG_KEY);
    if (saved) {
      setServiceAccountJson(saved);
      setIsSaved(true);
    }
  }, []);

  const handleSave = () => {
    try {
      if (serviceAccountJson.trim()) {
        // Validate JSON
        JSON.parse(serviceAccountJson);
        localStorage.setItem(CLOUD_CONFIG_KEY, serviceAccountJson);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      } else {
        localStorage.removeItem(CLOUD_CONFIG_KEY);
      }
    } catch (e) {
      alert('Invalid JSON format. Please paste a valid Google Cloud Service Account JSON.');
    }
  };

  const handleGenerateKey = async (serviceType: string) => {
    setIsGenerating(serviceType);
    setError(null);
    
    try {
      const response = await fetch('/api/cloud/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          serviceType, 
          serviceAccountJson 
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate key');
      }
      
      setGeneratedKeys(prev => [{ service: data.service, key: data.key }, ...prev]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const hasConfig = !!serviceAccountJson.trim();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Cloud Manager</h1>
        <p className="text-zinc-400">Manage your Google Cloud API keys and service connections.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('config')}
            className={cn(
              "px-6 py-4 text-sm font-medium transition-colors",
              activeTab === 'config' ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            )}
          >
            <div className="flex items-center gap-2">
              <Key size={16} /> Admin Credentials
            </div>
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={cn(
              "px-6 py-4 text-sm font-medium transition-colors",
              activeTab === 'services' ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            )}
          >
            <div className="flex items-center gap-2">
              <Cloud size={16} /> Services & APIs
            </div>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'config' ? (
            <div className="space-y-6 max-w-3xl">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-200/90">
                <AlertTriangle className="shrink-0 mt-0.5 text-amber-500" size={20} />
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-amber-500">Security Warning</p>
                  <p>
                    Pasting a Google Cloud Service Account JSON into a browser application is a security risk. 
                    This interface saves the key to your browser's local storage. Do not use this on a public or shared computer.
                  </p>
                  <p>
                    For production applications, API keys and Service Accounts should be managed securely on a backend server (like Node.js or Cloud Run) and never exposed to the client.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300">Google Cloud Service Account JSON</label>
                <textarea
                  value={serviceAccountJson}
                  onChange={(e) => setServiceAccountJson(e.target.value)}
                  placeholder='{\n  "type": "service_account",\n  "project_id": "your-project",\n  "private_key_id": "...",\n  "private_key": "...",\n  "client_email": "..."\n}'
                  rows={10}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-300 font-mono focus:outline-none focus:border-indigo-500 resize-y"
                />
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleSave}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-6 py-2.5 font-medium flex items-center gap-2 transition-colors"
                >
                  <Save size={18} />
                  Save Configuration
                </button>
                {isSaved && (
                  <span className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                    <CheckCircle2 size={16} /> Saved to Local Storage
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {!hasConfig ? (
                <div className="text-center py-12 space-y-4">
                  <Key size={48} className="mx-auto text-zinc-600" />
                  <p className="text-zinc-400">Please configure your Admin Credentials first to manage services.</p>
                  <button 
                    onClick={() => setActiveTab('config')}
                    className="text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Go to Configuration
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Firebase Card */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Database className="text-orange-500" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-100">Firebase & Firestore</h3>
                        <p className="text-xs text-zinc-500">Database & Authentication</p>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400">
                      Provision a new Firebase database and set up authentication rules for your project.
                    </p>
                    <button 
                      onClick={() => alert('In a full-stack environment, this would trigger a backend script using the @google-cloud/resource-manager SDK to provision Firebase resources.')}
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Provision Firebase
                    </button>
                  </div>

                  {/* Cloud Run Card */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Server className="text-blue-500" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-100">Cloud Run</h3>
                        <p className="text-xs text-zinc-500">Serverless Hosting</p>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400">
                      Deploy this application to Google Cloud Run and generate a public URL.
                    </p>
                    <button 
                      onClick={() => alert('In a full-stack environment, this would trigger a backend script using the @google-cloud/run SDK to deploy the container.')}
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Deploy to Cloud Run
                    </button>
                  </div>
                  
                  {/* API Keys Card */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4 md:col-span-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Key className="text-emerald-500" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-100">API Key Generator</h3>
                        <p className="text-xs text-zinc-500">Manage Project API Keys</p>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400">
                      Generate new restricted API keys for specific Google Cloud services.
                    </p>
                    
                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleGenerateKey('gemini')}
                        disabled={isGenerating !== null}
                        className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isGenerating === 'gemini' ? <Loader2 size={16} className="animate-spin" /> : null}
                        Generate Gemini API Key
                      </button>
                      <button 
                        onClick={() => handleGenerateKey('maps')}
                        disabled={isGenerating !== null}
                        className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isGenerating === 'maps' ? <Loader2 size={16} className="animate-spin" /> : null}
                        Generate Maps API Key
                      </button>
                    </div>

                    {generatedKeys.length > 0 && (
                      <div className="mt-6 space-y-3">
                        <h4 className="text-sm font-medium text-zinc-300 border-b border-zinc-800 pb-2">Generated Keys</h4>
                        <div className="space-y-2">
                          {generatedKeys.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                              <div>
                                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">{item.service}</span>
                                <code className="block text-sm text-zinc-300 mt-1 font-mono">{item.key}</code>
                              </div>
                              <button 
                                onClick={() => copyToClipboard(item.key)}
                                className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors"
                                title="Copy to clipboard"
                              >
                                <Copy size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
