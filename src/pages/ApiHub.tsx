import React, { useState, useEffect } from 'react';
import { Key, CheckCircle, XCircle, Eye, EyeOff, Save, RefreshCw } from 'lucide-react';

interface ApiKeyConfig {
  id: string;
  name: string;
  key: string;
  isValidated: boolean | null;
  isTesting: boolean;
}

const INITIAL_SERVICES: ApiKeyConfig[] = [
  { id: 'openai', name: 'OpenAI', key: '', isValidated: null, isTesting: false },
  { id: 'anthropic', name: 'Anthropic', key: '', isValidated: null, isTesting: false },
  { id: 'stripe', name: 'Stripe', key: '', isValidated: null, isTesting: false },
  { id: 'twilio', name: 'Twilio', key: '', isValidated: null, isTesting: false },
  { id: 'github', name: 'GitHub', key: '', isValidated: null, isTesting: false },
];

export default function ApiHub() {
  const [services, setServices] = useState<ApiKeyConfig[]>(INITIAL_SERVICES);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  useEffect(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('novaura_api_keys');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setServices(prev => prev.map(s => ({
          ...s,
          key: parsed[s.id] || '',
        })));
      } catch (e) {
        console.error('Failed to parse saved API keys');
      }
    }
  }, []);

  const handleKeyChange = (id: string, value: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, key: value, isValidated: null } : s));
    setSaveStatus('idle');
  };

  const toggleShowKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const saveKeys = () => {
    const toSave = services.reduce((acc, s) => {
      if (s.key) acc[s.id] = s.key;
      return acc;
    }, {} as Record<string, string>);
    localStorage.setItem('novaura_api_keys', JSON.stringify(toSave));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const testIntegration = async (id: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, isTesting: true } : s));
    
    // Simulate API validation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setServices(prev => prev.map(s => {
      if (s.id === id) {
        // Basic mock validation logic based on typical key prefixes/lengths
        let isValid = false;
        if (s.key) {
          if (id === 'openai' && s.key.startsWith('sk-') && s.key.length > 20) isValid = true;
          else if (id === 'anthropic' && s.key.startsWith('sk-ant-') && s.key.length > 20) isValid = true;
          else if (id === 'stripe' && (s.key.startsWith('sk_test_') || s.key.startsWith('sk_live_')) && s.key.length > 20) isValid = true;
          else if (id === 'twilio' && s.key.length > 20) isValid = true;
          else if (id === 'github' && (s.key.startsWith('ghp_') || s.key.startsWith('github_pat_')) && s.key.length > 20) isValid = true;
          else isValid = s.key.length > 10; // Fallback
        }
        return { ...s, isTesting: false, isValidated: isValid };
      }
      return s;
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50 flex items-center gap-3">
          <Key className="h-8 w-8 text-indigo-500" />
          API Integration Hub
        </h1>
        <p className="mt-2 text-zinc-400">
          Manage your third-party API keys for Novaura.life. Keys are stored securely in your browser's local storage.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 space-y-6">
          {services.map((service) => (
            <div key={service.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-lg">
              <div className="w-full sm:w-48 shrink-0">
                <h3 className="text-sm font-medium text-zinc-200">{service.name}</h3>
                <p className="text-xs text-zinc-500 mt-1">API Key</p>
              </div>
              
              <div className="flex-1 relative">
                <input
                  type={showKeys[service.id] ? "text" : "password"}
                  value={service.key}
                  onChange={(e) => handleKeyChange(service.id, e.target.value)}
                  placeholder={`Enter ${service.name} API Key`}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-md py-2 pl-3 pr-10 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey(service.id)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showKeys[service.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => testIntegration(service.id)}
                  disabled={!service.key || service.isTesting}
                  className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium rounded-md transition-colors"
                >
                  {service.isTesting ? (
                    <RefreshCw size={16} className="animate-spin text-indigo-400" />
                  ) : (
                    "Test"
                  )}
                </button>
                
                <div className="w-8 flex justify-center">
                  {service.isValidated === true && (
                    <CheckCircle size={20} className="text-emerald-500" />
                  )}
                  {service.isValidated === false && (
                    <XCircle size={20} className="text-rose-500" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-zinc-950/80 p-4 border-t border-zinc-800 flex justify-between items-center">
          <p className="text-sm text-zinc-500">
            {saveStatus === 'saved' ? 'Configuration saved successfully.' : 'Unsaved changes will be lost.'}
          </p>
          <button
            onClick={saveKeys}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            {saveStatus === 'saved' ? <CheckCircle size={16} /> : <Save size={16} />}
            {saveStatus === 'saved' ? 'Saved' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
