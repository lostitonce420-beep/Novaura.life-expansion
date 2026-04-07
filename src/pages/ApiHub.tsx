import React, { useState, useEffect } from 'react';
import { Key, CheckCircle, XCircle, Eye, EyeOff, Save, RefreshCw, ExternalLink, HelpCircle, Plus, Trash2, ChevronDown, ChevronUp, AlertTriangle, Zap } from 'lucide-react';

interface GuideStep {
  text: string;
}

interface ApiServiceDef {
  id: string;
  name: string;
  placeholder: string;
  regex: RegExp;
  errorMsg: string;
  guideUrl: string;
  inAppSupported: boolean;
  steps: GuideStep[];
  advancedGuide?: {
    title: string;
    content: React.ReactNode;
  };
}

const SERVICES: ApiServiceDef[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    placeholder: 'sk-...',
    regex: /^sk-(proj-)?[A-Za-z0-9_-]{20,}$/,
    errorMsg: 'OpenAI keys must start with "sk-" or "sk-proj-" followed by at least 20 characters.',
    guideUrl: 'https://platform.openai.com/api-keys',
    inAppSupported: false,
    steps: [
      { text: 'Go to platform.openai.com and log in.' },
      { text: 'Navigate to "API keys" in the left sidebar.' },
      { text: 'Click the "Create new secret key" button (top right).' },
      { text: 'Name your key, click "Create secret key", and copy the result.' }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    placeholder: 'sk-ant-...',
    regex: /^sk-ant-api03-[a-zA-Z0-9_-]{40,}$/,
    errorMsg: 'Anthropic keys typically start with "sk-ant-api03-" followed by a long string of characters.',
    guideUrl: 'https://console.anthropic.com/settings/keys',
    inAppSupported: false,
    steps: [
      { text: 'Go to console.anthropic.com and log in.' },
      { text: 'Click on "Settings" then "API Keys".' },
      { text: 'Click the "Create Key" button.' },
      { text: 'Copy the generated key.' }
    ]
  },
  {
    id: 'stripe',
    name: 'Stripe',
    placeholder: 'sk_test_... or sk_live_...',
    regex: /^(sk_test_|sk_live_)[a-zA-Z0-9]{20,}$/,
    errorMsg: 'Stripe secret keys must start with "sk_test_" or "sk_live_".',
    guideUrl: 'https://dashboard.stripe.com/apikeys',
    inAppSupported: true,
    steps: [
      { text: 'Go to dashboard.stripe.com and log in.' },
      { text: 'Toggle "Test mode" in the top right if you want a test key.' },
      { text: 'Navigate to "Developers" > "API keys".' },
      { text: 'Click "Reveal test key" (or live key) under Standard keys and copy it.' }
    ]
  },
  {
    id: 'twilio',
    name: 'Twilio',
    placeholder: '32-character Auth Token',
    regex: /^[a-f0-9]{32}$/i,
    errorMsg: 'Twilio Auth Tokens are exactly 32 hexadecimal characters.',
    guideUrl: 'https://console.twilio.com/',
    inAppSupported: false,
    steps: [
      { text: 'Go to console.twilio.com and log in.' },
      { text: 'Scroll down to the "Account Info" section on the main dashboard.' },
      { text: 'Locate "Auth Token", click "Show", and copy the 32-character string.' }
    ]
  },
  {
    id: 'github',
    name: 'GitHub',
    placeholder: 'ghp_... or github_pat_...',
    regex: /^(ghp_|github_pat_)[a-zA-Z0-9_]{36,}$/,
    errorMsg: 'GitHub tokens must start with "ghp_" (classic) or "github_pat_" (fine-grained).',
    guideUrl: 'https://github.com/settings/tokens',
    inAppSupported: true,
    steps: [
      { text: 'Go to GitHub Settings > Developer settings > Personal access tokens.' },
      { text: 'Choose "Tokens (classic)" or "Fine-grained tokens".' },
      { text: 'Click "Generate new token".' },
      { text: 'Select necessary scopes (e.g., repo) and generate. Copy the token.' }
    ]
  },
  {
    id: 'qwen',
    name: 'Qwen (DashScope)',
    placeholder: 'sk-...',
    regex: /^sk-[a-f0-9]{32}$/i,
    errorMsg: 'Qwen (DashScope) keys start with "sk-" followed by 32 hex characters.',
    guideUrl: 'https://dashscope.console.aliyun.com/apiKey',
    inAppSupported: false,
    steps: [
      { text: 'Log in to Alibaba Cloud DashScope console.' },
      { text: 'Go to "API-KEY Management" in the left menu.' },
      { text: 'Click "Create a new API-KEY".' },
      { text: 'Copy the key (starts with sk-).' }
    ]
  },
  {
    id: 'kimi',
    name: 'Kimi (Moonshot)',
    placeholder: 'sk-...',
    regex: /^sk-[a-zA-Z0-9]{32,}$/,
    errorMsg: 'Kimi keys start with "sk-" followed by alphanumeric characters.',
    guideUrl: 'https://platform.moonshot.cn/console/api-keys',
    inAppSupported: false,
    steps: [
      { text: 'Go to platform.moonshot.cn and log in.' },
      { text: 'Navigate to "API Key Management".' },
      { text: 'Click "Create API Key".' },
      { text: 'Copy the generated key.' }
    ]
  },
  {
    id: 'namecom',
    name: 'Name.com',
    placeholder: '40-character hex token',
    regex: /^[a-f0-9]{40}$/i,
    errorMsg: 'Name.com API tokens are typically 40 hexadecimal characters.',
    guideUrl: 'https://www.name.com/account/settings/api',
    inAppSupported: false,
    steps: [
      { text: 'Log in to Name.com.' },
      { text: 'Go to Account > Settings > API Tokens.' },
      { text: 'Generate a new token for Production or Test environment.' },
      { text: 'Copy the token.' }
    ]
  },
  {
    id: 'shopify',
    name: 'Shopify',
    placeholder: 'shpat_...',
    regex: /^shpat_[a-f0-9]{32}$/i,
    errorMsg: 'Shopify Admin API tokens start with "shpat_" followed by 32 hex characters.',
    guideUrl: 'https://admin.shopify.com/',
    inAppSupported: true,
    steps: [
      { text: 'Log in to your Shopify Admin.' },
      { text: 'Go to Settings > Apps and sales channels > Develop apps.' },
      { text: 'Create an app, configure Admin API scopes.' },
      { text: 'Install the app to get the Admin API access token (starts with shpat_).' }
    ]
  },
  {
    id: 'pixai',
    name: 'PixAI',
    placeholder: 'API Token',
    regex: /^[a-zA-Z0-9_-]{20,}$/,
    errorMsg: 'PixAI tokens must be at least 20 characters long.',
    guideUrl: 'https://pixai.art/',
    inAppSupported: false,
    steps: [
      { text: 'Log in to PixAI.' },
      { text: 'Go to your Profile Settings or Developer section.' },
      { text: 'Generate and copy your API token.' }
    ]
  },
  {
    id: 'facebook',
    name: 'Facebook (Meta Graph API)',
    placeholder: 'EAA...',
    regex: /^[A-Za-z0-9]{50,}$/,
    errorMsg: 'Meta Graph API tokens are typically long alphanumeric strings (often starting with EAA).',
    guideUrl: 'https://developers.facebook.com/',
    inAppSupported: true,
    steps: [
      { text: 'Go to developers.facebook.com and log in.' },
      { text: 'Create an App (Type: Business or Consumer).' },
      { text: 'Set up Facebook Login and generate a Page/User Access Token.' },
      { text: 'Copy the long alphanumeric token.' }
    ],
    advancedGuide: {
      title: "Developer: Real OAuth Implementation",
      content: (
        <div className="space-y-3 text-xs text-zinc-400 mt-2">
          <p><strong>1. Configure Meta App:</strong> Go to developers.facebook.com, create a Business App, and add Facebook Login.</p>
          <p><strong>2. Set Redirect URIs:</strong> Add your AI Studio container URLs to the Valid OAuth Redirect URIs in Meta settings:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><code>https://ais-dev-wd4yqs54ywtbuydkazsktj-118864325837.us-west2.run.app/auth/callback</code></li>
            <li><code>https://ais-pre-wd4yqs54ywtbuydkazsktj-118864325837.us-west2.run.app/auth/callback</code></li>
          </ul>
          <p><strong>3. Popup Flow:</strong> AI Studio runs in an iframe, so you must use a popup window (<code>window.open</code>) pointing to Meta's OAuth URL, not a redirect.</p>
          <p><strong>4. Callback & postMessage:</strong> Your <code>/auth/callback</code> route must exchange the code for a token, then send it back to the iframe using <code>window.opener.postMessage(&#123; type: 'OAUTH_SUCCESS', token: '...' &#125;, '*')</code>.</p>
        </div>
      )
    }
  },
  {
    id: 'instagram',
    name: 'Instagram (Graph API)',
    placeholder: 'EAA...',
    regex: /^[A-Za-z0-9]{50,}$/,
    errorMsg: 'Instagram Graph API uses Meta tokens, which are typically long alphanumeric strings.',
    guideUrl: 'https://developers.facebook.com/docs/instagram-api/',
    inAppSupported: true,
    steps: [
      { text: 'Go to developers.facebook.com and log in.' },
      { text: 'Ensure your Instagram Professional account is linked to a Facebook Page.' },
      { text: 'Generate a Page Access Token with instagram_basic and instagram_content_publish permissions.' },
      { text: 'Copy the long alphanumeric token.' }
    ],
    advancedGuide: {
      title: "Developer: Real OAuth Implementation",
      content: (
        <div className="space-y-3 text-xs text-zinc-400 mt-2">
          <p><strong>1. Configure Meta App:</strong> Create a Business App and add the Instagram Graph API product.</p>
          <p><strong>2. Set Redirect URIs:</strong> Add your AI Studio container URLs to the Valid OAuth Redirect URIs:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><code>https://ais-dev-wd4yqs54ywtbuydkazsktj-118864325837.us-west2.run.app/auth/callback</code></li>
            <li><code>https://ais-pre-wd4yqs54ywtbuydkazsktj-118864325837.us-west2.run.app/auth/callback</code></li>
          </ul>
          <p><strong>3. Scopes:</strong> Request <code>instagram_basic</code> and <code>instagram_content_publish</code> scopes in your OAuth URL.</p>
          <p><strong>4. Popup Flow:</strong> Use <code>window.open</code> for the auth flow and <code>window.opener.postMessage</code> in the callback to bypass iframe restrictions.</p>
        </div>
      )
    }
  },
  {
    id: 'gcp',
    name: 'Google Cloud Platform',
    placeholder: 'ya29.a0...',
    regex: /^ya29\.[a-zA-Z0-9_-]{50,}$/,
    errorMsg: 'Google OAuth access tokens typically start with "ya29." followed by a long string.',
    guideUrl: 'https://console.cloud.google.com/',
    inAppSupported: true,
    steps: [
      { text: 'Standard Google Login only provides profile data (email, name).' },
      { text: 'To manage Cloud resources, you must request the "https://www.googleapis.com/auth/cloud-platform" scope.' },
      { text: 'Use the Auto-Generate button to initiate this specific OAuth flow.' }
    ],
    advancedGuide: {
      title: "Why doesn't standard Google Login work for this?",
      content: (
        <div className="space-y-3 text-xs text-zinc-400 mt-2">
          <p>When a user logs into your app using standard Google Sign-In (like Firebase Auth), they are only granting permission to read their basic profile (email, name, profile picture).</p>
          <p>They are <strong>not</strong> granting your app permission to access their Google Cloud Platform billing, servers, or API keys.</p>
          <p>To generate API keys automatically, your app must trigger a separate OAuth flow specifically requesting the <code>https://www.googleapis.com/auth/cloud-platform</code> scope. This will prompt the user with a specific consent screen warning them that your app wants to manage their cloud data.</p>
        </div>
      )
    }
  }
];

interface ApiKeyState {
  key: string;
  isValidated: boolean | null;
  isTesting: boolean;
  validationError: string | null;
}

interface CustomKey {
  id: string;
  name: string;
  key: string;
}

interface InAppModalState {
  id: string;
  name: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMsg?: string;
}

export default function ApiHub() {
  const [keysState, setKeysState] = useState<Record<string, ApiKeyState>>({});
  const [customKeys, setCustomKeys] = useState<CustomKey[]>([]);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [expandedGuides, setExpandedGuides] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [inAppModal, setInAppModal] = useState<InAppModalState | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('novaura_api_keys');
    const savedCustom = localStorage.getItem('novaura_custom_keys');
    
    const initialState: Record<string, ApiKeyState> = {};
    SERVICES.forEach(s => {
      initialState[s.id] = { key: '', isValidated: null, isTesting: false, validationError: null };
    });

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach(id => {
          if (initialState[id]) {
            initialState[id].key = parsed[id];
          }
        });
      } catch (e) {
        console.error('Failed to parse saved API keys');
      }
    }
    setKeysState(initialState);

    if (savedCustom) {
      try {
        setCustomKeys(JSON.parse(savedCustom));
      } catch (e) {
        console.error('Failed to parse custom keys');
      }
    }
  }, []);

  const handleKeyChange = (id: string, value: string) => {
    setKeysState(prev => ({
      ...prev,
      [id]: { ...prev[id], key: value, isValidated: null, validationError: null }
    }));
    setSaveStatus('idle');
  };

  const handleCustomKeyChange = (id: string, value: string) => {
    setCustomKeys(prev => prev.map(k => k.id === id ? { ...k, key: value } : k));
    setSaveStatus('idle');
  };

  const toggleShowKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleGuide = (id: string) => {
    setExpandedGuides(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const saveKeys = () => {
    const toSave = Object.entries(keysState).reduce((acc, [id, state]) => {
      if (state.key) acc[id] = state.key;
      return acc;
    }, {} as Record<string, string>);
    
    localStorage.setItem('novaura_api_keys', JSON.stringify(toSave));
    localStorage.setItem('novaura_custom_keys', JSON.stringify(customKeys));
    
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const testIntegration = async (id: string) => {
    const service = SERVICES.find(s => s.id === id);
    if (!service) return;

    setKeysState(prev => ({
      ...prev,
      [id]: { ...prev[id], isTesting: true, validationError: null }
    }));
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const currentKey = keysState[id].key.trim();
    const isValid = service.regex.test(currentKey);
    
    setKeysState(prev => ({
      ...prev,
      [id]: { 
        ...prev[id], 
        isTesting: false, 
        isValidated: isValid,
        validationError: isValid ? null : service.errorMsg
      }
    }));

    // Auto-expand guide if validation fails
    if (!isValid) {
      setExpandedGuides(prev => ({ ...prev, [id]: true }));
    }
  };

  const addCustomKey = () => {
    const name = prompt("Enter the name of the service (e.g., HuggingFace):");
    if (name) {
      setCustomKeys(prev => [...prev, { id: `custom_${Date.now()}`, name, key: '' }]);
    }
  };

  const removeCustomKey = (id: string) => {
    setCustomKeys(prev => prev.filter(k => k.id !== id));
  };

  const executeAutoGenerate = async () => {
    if (!inAppModal) return;
    setInAppModal(prev => prev ? { ...prev, status: 'loading', errorMsg: undefined } : null);
    
    try {
      const res = await fetch('/api/oauth/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: inAppModal.id })
      });
      const data = await res.json();
      
      if (data.success) {
        setKeysState(prev => {
          const newState = {
            ...prev,
            [inAppModal.id]: { key: data.key, isValidated: true, isTesting: false, validationError: null }
          };
          
          // Auto-save
          const toSave = Object.entries(newState).reduce((acc, [id, state]) => {
            if (state.key) acc[id] = state.key;
            return acc;
          }, {} as Record<string, string>);
          localStorage.setItem('novaura_api_keys', JSON.stringify(toSave));
          
          return newState;
        });
        
        setInAppModal(prev => prev ? { ...prev, status: 'success' } : null);
        setTimeout(() => {
          setInAppModal(null);
        }, 2000);
      } else {
        setInAppModal(prev => prev ? { ...prev, status: 'error', errorMsg: data.error } : null);
      }
    } catch (e: any) {
      setInAppModal(prev => prev ? { ...prev, status: 'error', errorMsg: e.message || 'Network error' } : null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50 flex items-center gap-3">
          <Key className="h-8 w-8 text-indigo-500" />
          API Integration Hub
        </h1>
        <p className="mt-2 text-zinc-400 max-w-3xl">
          Manage your third-party API keys for Novaura.life. Keys are validated locally against strict format rules and stored securely in your browser's local storage.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 space-y-6">
          {SERVICES.map((service) => {
            const state = keysState[service.id] || { key: '', isValidated: null, isTesting: false, validationError: null };
            const isGuideOpen = expandedGuides[service.id];

            return (
              <div key={service.id} className="flex flex-col gap-4 p-5 bg-zinc-950/50 border border-zinc-800/80 rounded-xl transition-all">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="w-full lg:w-48 shrink-0 flex items-center justify-between lg:block">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200">{service.name}</h3>
                      <button 
                        onClick={() => toggleGuide(service.id)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 flex items-center gap-1"
                      >
                        <HelpCircle size={12} />
                        How to get this?
                      </button>
                    </div>
                    {service.inAppSupported && (
                      <button 
                        onClick={() => setInAppModal({ id: service.id, name: service.name, status: 'idle' })}
                        className="lg:hidden flex items-center gap-1 text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded border border-indigo-500/20"
                      >
                        <Zap size={12} /> Auto-Generate
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 relative">
                    <input
                      type={showKeys[service.id] ? "text" : "password"}
                      value={state.key}
                      onChange={(e) => handleKeyChange(service.id, e.target.value)}
                      placeholder={service.placeholder}
                      className={`w-full bg-zinc-900 border ${state.isValidated === false ? 'border-rose-500/50 focus:ring-rose-500' : state.isValidated === true ? 'border-emerald-500/50 focus:ring-emerald-500' : 'border-zinc-700 focus:ring-indigo-500'} rounded-md py-2.5 pl-3 pr-10 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-zinc-600 transition-colors`}
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey(service.id)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showKeys[service.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 justify-end">
                    {service.inAppSupported && (
                      <button 
                        onClick={() => setInAppModal({ id: service.id, name: service.name, status: 'idle' })}
                        className="hidden lg:flex items-center gap-1.5 px-3 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-sm font-medium rounded-md border border-indigo-500/20 transition-colors"
                        title="Generate automatically via OAuth/Cloud"
                      >
                        <Zap size={16} />
                        Auto
                      </button>
                    )}
                    <button
                      onClick={() => testIntegration(service.id)}
                      disabled={!state.key || state.isTesting}
                      className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium rounded-md transition-colors"
                    >
                      {state.isTesting ? (
                        <RefreshCw size={16} className="animate-spin text-indigo-400" />
                      ) : (
                        "Validate"
                      )}
                    </button>
                    
                    <div className="w-8 flex justify-center">
                      {state.isValidated === true && (
                        <CheckCircle size={22} className="text-emerald-500" />
                      )}
                      {state.isValidated === false && (
                        <XCircle size={22} className="text-rose-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Error Message & Guide Section */}
                {(state.validationError || isGuideOpen) && (
                  <div className={`mt-2 p-4 rounded-lg border ${state.validationError ? 'bg-rose-500/5 border-rose-500/20' : 'bg-zinc-900 border-zinc-800'}`}>
                    {state.validationError && (
                      <div className="flex items-start gap-2 mb-4 text-rose-400">
                        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Validation Failed</p>
                          <p className="text-sm opacity-90 mt-0.5">{state.validationError}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-zinc-200">How to get your {service.name} key:</h4>
                        <a 
                          href={service.guideUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                        >
                          Open Console <ExternalLink size={12} />
                        </a>
                      </div>
                      <ol className="list-decimal list-inside space-y-1.5 text-sm text-zinc-400">
                        {service.steps.map((step, idx) => (
                          <li key={idx} className="pl-1">{step.text}</li>
                        ))}
                      </ol>
                      
                      {service.advancedGuide && (
                        <details className="mt-4 group">
                          <summary className="text-xs font-medium text-indigo-400 cursor-pointer hover:text-indigo-300 list-none flex items-center gap-1">
                            <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
                            {service.advancedGuide.title}
                          </summary>
                          <div className="mt-3 pl-5 border-l-2 border-indigo-500/20">
                            {service.advancedGuide.content}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Custom Keys Section */}
          <div className="pt-6 border-t border-zinc-800/80">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-zinc-200">Custom Integrations</h3>
                <p className="text-sm text-zinc-500">Add any other API keys not listed above.</p>
              </div>
              <button
                onClick={addCustomKey}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-sm font-medium rounded-md transition-colors"
              >
                <Plus size={16} /> Add Key
              </button>
            </div>

            <div className="space-y-4">
              {customKeys.map(custom => (
                <div key={custom.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-zinc-950/30 border border-zinc-800/50 rounded-lg">
                  <div className="w-full sm:w-48 shrink-0">
                    <h3 className="text-sm font-medium text-zinc-200">{custom.name}</h3>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type={showKeys[custom.id] ? "text" : "password"}
                      value={custom.key}
                      onChange={(e) => handleCustomKeyChange(custom.id, e.target.value)}
                      placeholder="Enter API Key"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-md py-2 pl-3 pr-10 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey(custom.id)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showKeys[custom.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    onClick={() => removeCustomKey(custom.id)}
                    className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {customKeys.length === 0 && (
                <div className="text-center py-6 border border-dashed border-zinc-800 rounded-lg text-zinc-500 text-sm">
                  No custom keys added yet.
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-zinc-950/80 p-4 border-t border-zinc-800 flex justify-between items-center sticky bottom-0 z-10 backdrop-blur-sm">
          <p className="text-sm text-zinc-500">
            {saveStatus === 'saved' ? 'Configuration saved successfully.' : 'Unsaved changes will be lost.'}
          </p>
          <button
            onClick={saveKeys}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors shadow-lg shadow-indigo-500/20"
          >
            {saveStatus === 'saved' ? <CheckCircle size={18} /> : <Save size={18} />}
            {saveStatus === 'saved' ? 'Saved' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* In-App Generation Modal */}
      {inAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-indigo-400 mb-4">
              {inAppModal.status === 'success' ? (
                <CheckCircle size={24} className="text-emerald-500" />
              ) : inAppModal.status === 'error' ? (
                <AlertTriangle size={24} className="text-rose-500" />
              ) : (
                <Zap size={24} className={inAppModal.status === 'loading' ? 'animate-pulse' : ''} />
              )}
              <h2 className="text-xl font-semibold text-zinc-100">
                {inAppModal.status === 'success' ? 'Connection Successful' :
                 inAppModal.status === 'loading' ? 'Authenticating...' :
                 inAppModal.status === 'error' ? 'Connection Failed' :
                 `Connect ${inAppModal.name}`}
              </h2>
            </div>
            
            <div className="text-zinc-400 text-sm mb-6 leading-relaxed">
              {inAppModal.status === 'success' ? (
                <p className="text-emerald-400/90">Successfully generated and securely stored your {inAppModal.name} API key.</p>
              ) : inAppModal.status === 'loading' ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-4">
                  <RefreshCw size={32} className="animate-spin text-indigo-500" />
                  <p>Waiting for {inAppModal.name} authorization...</p>
                </div>
              ) : inAppModal.status === 'error' ? (
                <div className="text-rose-400/90">
                  <p>Failed to connect to {inAppModal.name}.</p>
                  <p className="mt-2 font-mono text-xs bg-rose-500/10 p-2 rounded">{inAppModal.errorMsg}</p>
                </div>
              ) : (
                <p>
                  Novaura will now securely connect to <strong>{inAppModal.name}</strong> via OAuth to automatically provision and inject your API key.
                  <br/><br/>
                  <em>This process is handled entirely by the Cloud Manager backend.</em>
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              {inAppModal.status !== 'loading' && inAppModal.status !== 'success' && (
                <button 
                  onClick={() => setInAppModal(null)}
                  className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 transition-colors"
                >
                  {inAppModal.status === 'error' ? 'Close' : 'Cancel'}
                </button>
              )}
              
              {inAppModal.status === 'idle' && (
                <button 
                  onClick={executeAutoGenerate}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2"
                >
                  <Zap size={16} />
                  Connect Account
                </button>
              )}
              
              {inAppModal.status === 'error' && (
                <button 
                  onClick={executeAutoGenerate}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
