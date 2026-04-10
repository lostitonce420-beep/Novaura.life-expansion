import { useState, useEffect } from 'react';
import { Key, Cloud, Database, Server, AlertTriangle, Save, CheckCircle2, Loader2, Copy, ExternalLink, Globe, Shield, HardDrive, ToggleLeft, ToggleRight, TerminalSquare, Box, Mail, Settings, Cpu, Network, Plus, Image as ImageIcon, Video } from 'lucide-react';
import { cn } from '../components/Layout';

const CLOUD_CONFIG_KEY = 'novaura_cloud_config';
const ALIBABA_CONFIG_KEY = 'novaura_alibaba_config';
const LEGAL_CONSENT_KEY = 'novaura_legal_consent';

export default function CloudManager() {
  const [serviceAccountJson, setServiceAccountJson] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'services' | 'admin' | 'infrastructure' | 'vertex'>('config');
  
  // API Key Generation State
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [generatedKeys, setGeneratedKeys] = useState<{service: string, key: string}[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Deployment State
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);

  // Alibaba State
  const [alibabaConfig, setAlibabaConfig] = useState({ accessKeyId: '', accessKeySecret: '', region: 'cn-hangzhou' });
  const [isAlibabaSaved, setIsAlibabaSaved] = useState(false);
  const [isAlibabaDeploying, setIsAlibabaDeploying] = useState(false);
  const [alibabaDeployUrl, setAlibabaDeployUrl] = useState<string | null>(null);

  // Admin Services State
  const [apiToggles, setApiToggles] = useState<Record<string, { loading: boolean, enabled: boolean }>>({
    'run.googleapis.com': { loading: false, enabled: false },
    'cloudbuild.googleapis.com': { loading: false, enabled: false },
    'drive.googleapis.com': { loading: false, enabled: false },
    'firebase.googleapis.com': { loading: false, enabled: false },
  });

  // Legal Consent State
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(LEGAL_CONSENT_KEY) === 'true') {
      setHasAcceptedTerms(true);
    }

    const saved = localStorage.getItem(CLOUD_CONFIG_KEY);
    if (saved) {
      setServiceAccountJson(saved);
      setIsSaved(true);
    }
    
    const savedAlibaba = localStorage.getItem(ALIBABA_CONFIG_KEY);
    if (savedAlibaba) {
      try {
        setAlibabaConfig(JSON.parse(savedAlibaba));
      } catch (e) {}
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

  const handleDeploy = async () => {
    setIsDeploying(true);
    setError(null);
    setDeployUrl(null);
    
    try {
      const response = await fetch('/api/cloud/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          serviceAccountJson 
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to deploy to Cloud Run');
      }
      
      setDeployUrl(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleAlibabaSave = () => {
    if (alibabaConfig.accessKeyId && alibabaConfig.accessKeySecret) {
      localStorage.setItem(ALIBABA_CONFIG_KEY, JSON.stringify(alibabaConfig));
      setIsAlibabaSaved(true);
      setTimeout(() => setIsAlibabaSaved(false), 3000);
    } else {
      localStorage.removeItem(ALIBABA_CONFIG_KEY);
    }
  };

  const handleAlibabaDeploy = async () => {
    setIsAlibabaDeploying(true);
    setError(null);
    setAlibabaDeployUrl(null);
    
    try {
      const response = await fetch('/api/alibaba/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alibabaConfig)
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to deploy to Alibaba Cloud');
      }
      
      setAlibabaDeployUrl(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAlibabaDeploying(false);
    }
  };

  const handleApiToggle = async (apiName: string, currentEnabled: boolean) => {
    setApiToggles(prev => ({ ...prev, [apiName]: { ...prev[apiName], loading: true } }));
    setError(null);
    
    const action = currentEnabled ? 'disable' : 'enable';
    
    try {
      const response = await fetch('/api/cloud/toggle-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          serviceAccountJson,
          apiName,
          action
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || `Failed to ${action} API`);
      }
      
      setApiToggles(prev => ({ ...prev, [apiName]: { loading: false, enabled: !currentEnabled } }));
    } catch (err: any) {
      setError(err.message);
      setApiToggles(prev => ({ ...prev, [apiName]: { ...prev[apiName], loading: false } }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const acceptTerms = () => {
    localStorage.setItem(LEGAL_CONSENT_KEY, 'true');
    setHasAcceptedTerms(true);
  };

  const hasConfig = !!serviceAccountJson.trim() || !!alibabaConfig.accessKeyId.trim();

  if (!hasAcceptedTerms) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-8 bg-zinc-950 border border-red-500/30 rounded-2xl space-y-8 shadow-2xl shadow-red-500/5">
        <div className="flex items-center gap-4 text-red-400 border-b border-red-500/20 pb-6">
          <div className="p-3 bg-red-500/10 rounded-xl">
            <AlertTriangle size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Experimental AI Liability Waiver</h2>
            <p className="text-sm text-red-400/80 mt-1">Required consent for autonomous cloud operations</p>
          </div>
        </div>
        
        <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
          <p className="text-base text-zinc-200">Before proceeding to the Cloud Manager, you must legally acknowledge the following terms:</p>
          
          <div className="space-y-4 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
            <div className="space-y-2">
              <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                Autonomous Financial Actions
              </h3>
              <p className="text-zinc-400 pl-3.5">
                By providing your cloud credentials (OAuth, Service Accounts, or API Keys), you explicitly authorize this experimental AI technology to access your cloud resources, billing accounts, and infrastructure to provision services on your behalf.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                User Responsibility & Liability
              </h3>
              <p className="text-zinc-400 pl-3.5">
                You acknowledge that all creations, deployments, and modifications are executed directly on your personal or corporate cloud accounts. You assume full and sole responsibility for any associated cloud costs, misconfigurations, security implications, or damages incurred.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                No Warranty or Indemnification
              </h3>
              <p className="text-zinc-400 pl-3.5">
                Novaura provides these autonomous deployment tools strictly "as-is". We take absolutely no responsibility for misuse, data loss, financial damages, or unintended consequences potentially caused by experimental autonomous creations and actions.
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={acceptTerms} 
          className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Shield size={18} />
          I Understand and Accept Full Responsibility
        </button>
      </div>
    );
  }

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
          <button
            onClick={() => setActiveTab('admin')}
            className={cn(
              "px-6 py-4 text-sm font-medium transition-colors",
              activeTab === 'admin' ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            )}
          >
            <div className="flex items-center gap-2">
              <Shield size={16} /> Admin Services
            </div>
          </button>
          <button
            onClick={() => setActiveTab('infrastructure')}
            className={cn(
              "px-6 py-4 text-sm font-medium transition-colors",
              activeTab === 'infrastructure' ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            )}
          >
            <div className="flex items-center gap-2">
              <Settings size={16} /> Infrastructure & Domains
            </div>
          </button>
          <button
            onClick={() => setActiveTab('vertex')}
            className={cn(
              "px-6 py-4 text-sm font-medium transition-colors",
              activeTab === 'vertex' ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            )}
          >
            <div className="flex items-center gap-2">
              <Cpu size={16} /> Vertex AI & VMs
            </div>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'config' ? (
            <div className="space-y-10 max-w-3xl">
              {/* Alibaba Cloud Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
                    <Globe className="text-orange-500" size={20} /> Alibaba Cloud (Aliyun)
                  </h2>
                  <span className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-medium border border-orange-500/20">
                    Active Partnership
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">AccessKey ID</label>
                    <input
                      type="text"
                      value={alibabaConfig.accessKeyId}
                      onChange={(e) => setAlibabaConfig({...alibabaConfig, accessKeyId: e.target.value})}
                      placeholder="LTAI5t..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">AccessKey Secret</label>
                    <input
                      type="password"
                      value={alibabaConfig.accessKeySecret}
                      onChange={(e) => setAlibabaConfig({...alibabaConfig, accessKeySecret: e.target.value})}
                      placeholder="••••••••••••••••"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-zinc-300">Deployment Region</label>
                    <select
                      value={alibabaConfig.region}
                      onChange={(e) => setAlibabaConfig({...alibabaConfig, region: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-orange-500 appearance-none"
                    >
                      <option value="cn-hangzhou">China (Hangzhou) - cn-hangzhou</option>
                      <option value="cn-beijing">China (Beijing) - cn-beijing</option>
                      <option value="cn-shanghai">China (Shanghai) - cn-shanghai</option>
                      <option value="ap-southeast-1">Singapore - ap-southeast-1</option>
                      <option value="us-west-1">US (Silicon Valley) - us-west-1</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleAlibabaSave}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-6 py-2.5 font-medium flex items-center gap-2 transition-colors"
                  >
                    <Save size={18} />
                    Save Alibaba Config
                  </button>
                  {isAlibabaSaved && (
                    <span className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                      <CheckCircle2 size={16} /> Saved to Local Storage
                    </span>
                  )}
                </div>
              </div>

              {/* GCP Section */}
              <div className="space-y-6 pt-6 border-t border-zinc-800/50">
                <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
                  <Server className="text-blue-400" size={20} /> Google Cloud Platform
                </h2>
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
            </div>
          ) : activeTab === 'services' ? (
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
                  {/* Alibaba Cloud Card */}
                  <div className="bg-zinc-950 border border-orange-500/20 rounded-xl p-6 space-y-4 relative overflow-hidden md:col-span-2">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="flex items-center gap-3 relative">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                        <Globe className="text-orange-400" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-100">Alibaba Cloud (Aliyun)</h3>
                        <p className="text-xs text-orange-400/80 font-medium">Function Compute (FC) - International Reach</p>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400 relative max-w-2xl">
                      Deploy this application directly to Alibaba Cloud servers in <strong>{alibabaConfig.region || 'China'}</strong>. 
                      Leverage your partnership credits for zero-latency access in the APAC region and global marketing presence.
                    </p>
                    <button 
                      onClick={handleAlibabaDeploy}
                      disabled={isAlibabaDeploying || !alibabaConfig.accessKeyId}
                      className="w-full md:w-auto px-8 py-2.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isAlibabaDeploying ? <Loader2 size={16} className="animate-spin" /> : null}
                      Deploy to Aliyun
                    </button>
                    {alibabaDeployUrl && (
                      <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg relative inline-block w-full">
                        <p className="text-xs text-emerald-400 font-medium mb-1">Deployment Successful!</p>
                        <a href={alibabaDeployUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-400 hover:text-orange-300 break-all flex items-center gap-1">
                          {alibabaDeployUrl} <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>

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
                        <h3 className="font-semibold text-zinc-100">Cloud Run & Build</h3>
                        <p className="text-xs text-zinc-500">Serverless Hosting Pipeline</p>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400">
                      Zip your workspace, submit to Cloud Build, and deploy the container to Google Cloud Run.
                    </p>
                    <button 
                      onClick={handleDeploy}
                      disabled={isDeploying}
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isDeploying ? <Loader2 size={16} className="animate-spin" /> : null}
                      Build & Deploy to Cloud Run
                    </button>
                    {deployUrl && (
                      <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <p className="text-xs text-emerald-400 font-medium mb-1">Deployment Successful!</p>
                        <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:text-indigo-300 break-all flex items-center gap-1">
                          {deployUrl} <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Replit Card */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <TerminalSquare className="text-orange-500" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-100">Replit Deploy</h3>
                        <p className="text-xs text-zinc-500">Instant IDE & Hosting</p>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400">
                      Export this project directly to a new Repl for instant collaborative editing and hosting.
                    </p>
                    <button 
                      onClick={() => alert('In a full environment, this would package the app and use the Replit API to create a new Repl.')}
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Export to Replit
                    </button>
                  </div>

                  {/* AWS Card */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Box className="text-amber-500" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-100">AWS Amplify</h3>
                        <p className="text-xs text-zinc-500">Amazon Web Services</p>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400">
                      Deploy the frontend and backend to AWS Amplify. Requires AWS credentials in API Hub.
                    </p>
                    <button 
                      onClick={() => alert('In a full environment, this would trigger an AWS Amplify deployment pipeline.')}
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Deploy to AWS
                    </button>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <HardDrive className="text-green-500" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-100">Google Drive</h3>
                        <p className="text-xs text-zinc-500">File Storage & Sync</p>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400">
                      Connect to Google Drive to read, write, and sync files directly from your application.
                    </p>
                    <button 
                      onClick={() => alert('Drive SDK initialized. In a full app, this opens the file picker.')}
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Connect Drive SDK
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
          ) : activeTab === 'admin' ? (
            <div className="space-y-6">
              {!hasConfig ? (
                <div className="text-center py-12 space-y-4">
                  <Shield size={48} className="mx-auto text-zinc-600" />
                  <p className="text-zinc-400">Please configure your Admin Credentials first to manage policies.</p>
                  <button 
                    onClick={() => setActiveTab('config')}
                    className="text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Go to Configuration
                  </button>
                </div>
              ) : (
                <div className="max-w-3xl space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2 mb-2">
                      <Shield className="text-indigo-400" size={20} /> API & Policy Management
                    </h2>
                    <p className="text-sm text-zinc-400">
                      Enable or disable core Google Cloud APIs for your project directly from this interface. 
                      No need to navigate the complex GCP console.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl divide-y divide-zinc-800/50">
                    {[
                      { id: 'run.googleapis.com', name: 'Cloud Run API', desc: 'Required for serverless container hosting.' },
                      { id: 'cloudbuild.googleapis.com', name: 'Cloud Build API', desc: 'Required for zipping and building Docker images.' },
                      { id: 'drive.googleapis.com', name: 'Google Drive API', desc: 'Required for reading and writing files to Drive.' },
                      { id: 'firebase.googleapis.com', name: 'Firebase Management API', desc: 'Required for provisioning Firebase resources.' },
                    ].map((api) => (
                      <div key={api.id} className="p-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-zinc-200">{api.name}</h4>
                          <code className="text-xs text-zinc-500 font-mono mt-1 block">{api.id}</code>
                          <p className="text-xs text-zinc-400 mt-1">{api.desc}</p>
                        </div>
                        <button
                          onClick={() => handleApiToggle(api.id, apiToggles[api.id].enabled)}
                          disabled={apiToggles[api.id].loading}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50",
                            apiToggles[api.id].enabled 
                              ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" 
                              : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                          )}
                        >
                          {apiToggles[api.id].loading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : apiToggles[api.id].enabled ? (
                            <ToggleRight size={20} className="text-emerald-500" />
                          ) : (
                            <ToggleLeft size={20} />
                          )}
                          {apiToggles[api.id].enabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'infrastructure' ? (
            <div className="space-y-6">
              <div className="max-w-3xl space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2 mb-2">
                    <Settings className="text-indigo-400" size={20} /> Infrastructure & Domains
                  </h2>
                  <p className="text-sm text-zinc-400">
                    Manage your Name.com domains, DNS settings, and cPanel Webmail accounts.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name.com DNS Management */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Globe className="text-blue-500" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-100">Name.com DNS</h3>
                        <p className="text-xs text-zinc-500">Domain Reseller & DNS</p>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400">
                      Manage DNS records for novaura.life and other domains. The AI can automatically configure A, CNAME, and TXT records.
                    </p>
                    <button 
                      onClick={() => alert('DNS Management interface would open here. The AI can also control this via the manageDnsRecord tool.')}
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Manage DNS Records
                    </button>
                  </div>

                  {/* cPanel Webmail Management */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Mail className="text-emerald-500" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-100">cPanel Webmail</h3>
                        <p className="text-xs text-zinc-500">Email Administration</p>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400">
                      Create and manage @novaura.life email accounts. The AI can provision new inboxes automatically.
                    </p>
                    <button 
                      onClick={() => alert('cPanel Email Administration interface would open here. The AI can also control this via the createCpanelEmail tool.')}
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Manage Email Accounts
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        {activeTab === 'vertex' && (
          <div className="space-y-6">
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
                    <Network className="text-indigo-400" /> Model Garden Endpoints
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">Deploy partner models (Claude, Llama, Qwen) to dedicated Vertex endpoints.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors">
                  <Plus size={16} /> Deploy Model
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Cpu className="text-orange-400" size={20} />
                      </div>
                      <div>
                        <h4 className="font-medium text-zinc-200">Claude 3.5 Sonnet</h4>
                        <p className="text-xs text-zinc-500">us-central1 • Anthropic</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs rounded-md">Not Deployed</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-4">Requires accepting terms in Vertex AI Model Garden before deployment.</p>
                  <button className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors">
                    Configure Endpoint
                  </button>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Cpu className="text-blue-400" size={20} />
                      </div>
                      <div>
                        <h4 className="font-medium text-zinc-200">Qwen 2.5 (72B)</h4>
                        <p className="text-xs text-zinc-500">us-central1 • Alibaba</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs rounded-md">Not Deployed</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-4">Deploy Qwen to a dedicated GPU instance for high-throughput inference.</p>
                  <button className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors">
                    Configure Endpoint
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
                    <Server className="text-indigo-400" /> Vertex AI Workbench (VMs)
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">Provision and manage GPU-accelerated virtual machines for training and inference.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors">
                  <Plus size={16} /> Create Instance
                </button>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-8 text-center">
                <Server className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h4 className="text-zinc-300 font-medium mb-1">No Workbench Instances</h4>
                <p className="text-zinc-500 text-sm max-w-md mx-auto">
                  Create a JupyterLab notebook instance or a custom Compute Engine VM with attached GPUs (NVIDIA L4, T4, or A100) to run custom models.
                </p>
              </div>
            </div>

            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
              <h3 className="text-lg font-medium text-zinc-100 flex items-center gap-2 mb-6">
                <ImageIcon className="text-indigo-400" /> Vertex Media Generation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-950 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="text-emerald-400" size={24} />
                    <div>
                      <h4 className="font-medium text-zinc-200">Imagen 3</h4>
                      <p className="text-xs text-zinc-500">High-fidelity image generation</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                      <CheckCircle2 size={12} /> Ready
                    </span>
                  </div>
                </div>
                <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-950 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Video className="text-emerald-400" size={24} />
                    <div>
                      <h4 className="font-medium text-zinc-200">Veo / Imagen Video</h4>
                      <p className="text-xs text-zinc-500">Cinematic video generation</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                      <CheckCircle2 size={12} /> Ready
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-4">
                These models are accessed via the Image Studio and Video Studio tabs using your configured GCP Service Account.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
