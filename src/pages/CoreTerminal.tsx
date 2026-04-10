import { useState, useEffect, useRef } from 'react';
import { getGeminiClient } from '../lib/gemini';
import { Type, FunctionDeclaration, GenerateContentResponse } from '@google/genai';
import { useNavigate } from 'react-router-dom';
import { Terminal, Send, Loader2, Bot, User, Code, Server, Video as VideoIcon, Key, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../components/Layout';

const navigateToDeclaration: FunctionDeclaration = {
  name: 'navigateTo',
  description: 'Navigate the user to a different page in the application.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: { type: Type.STRING, description: 'The path to navigate to (e.g., "/", "/cloud", "/video", "/api-hub")' }
    },
    required: ['path']
  }
};

const deployToCloudRunDeclaration: FunctionDeclaration = {
  name: 'deployToCloudRun',
  description: 'Deploy the current application to Google Cloud Run. Requires GCP credentials to be saved in the Cloud Manager.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  }
};

const toggleGcpApiDeclaration: FunctionDeclaration = {
  name: 'toggleGcpApi',
  description: 'Enable or disable a Google Cloud API.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      apiName: { type: Type.STRING, description: 'The exact API name, e.g., "run.googleapis.com" or "cloudbuild.googleapis.com"' },
      action: { type: Type.STRING, description: '"enable" or "disable"' }
    },
    required: ['apiName', 'action']
  }
};

const generateVideoDeclaration: FunctionDeclaration = {
  name: 'generateVideo',
  description: 'Generate a video using Veo 3.1 model. This takes a few minutes.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: { type: Type.STRING, description: 'The text prompt describing the video.' },
      aspectRatio: { type: Type.STRING, description: '"16:9" or "9:16"' }
    },
    required: ['prompt']
  }
};

const saveApiKeyDeclaration: FunctionDeclaration = {
  name: 'saveApiKey',
  description: 'Save an API key for a specific provider in the API Hub.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      provider: { type: Type.STRING, description: 'The provider ID (e.g., "openai", "anthropic", "stripe", "github")' },
      key: { type: Type.STRING, description: 'The API key to save' }
    },
    required: ['provider', 'key']
  }
};

const searchYouTubeDeclaration: FunctionDeclaration = {
  name: 'searchYouTube',
  description: 'Searches YouTube for videos based on a query. Requires YouTube Data API v3 key.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'The search query for YouTube videos.' },
      maxResults: { type: Type.NUMBER, description: 'Maximum number of results to return (default 5).' }
    },
    required: ['query']
  }
};

const searchImagesDeclaration: FunctionDeclaration = {
  name: 'searchImages',
  description: 'Searches the web for images using Google Custom Search API. Requires API key and CX ID.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'The search query for images.' },
      maxResults: { type: Type.NUMBER, description: 'Maximum number of image results to return (default 5).' }
    },
    required: ['query']
  }
};

const requestOAuthConsentDeclaration: FunctionDeclaration = {
  name: 'requestOAuthConsent',
  description: 'Prompts the user for OAuth consent to access a third-party service on their behalf (e.g., Name.com, Firebase, Alibaba).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      serviceName: { type: Type.STRING, description: 'The name of the service (e.g., "Name.com", "Firebase", "Alibaba Cloud")' },
      reason: { type: Type.STRING, description: 'Why the AI needs this access (e.g., "To register a new domain name")' },
      scopes: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'The specific permissions needed' }
    },
    required: ['serviceName', 'reason']
  }
};

const provisionVertexVMDeclaration: FunctionDeclaration = {
  name: 'provisionVertexVM',
  description: 'Provisions a new Vertex AI Workbench instance or Compute Engine VM with GPUs.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      machineType: { type: Type.STRING, description: 'The machine type (e.g., "n1-standard-4")' },
      gpuType: { type: Type.STRING, description: 'The GPU type (e.g., "NVIDIA_TESLA_T4", "NVIDIA_L4")' },
      gpuCount: { type: Type.NUMBER, description: 'Number of GPUs to attach' }
    },
    required: ['machineType']
  }
};

const deployVertexModelDeclaration: FunctionDeclaration = {
  name: 'deployVertexModel',
  description: 'Deploys a partner model (like Claude, Llama, Qwen) from Vertex AI Model Garden to a dedicated endpoint.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      modelId: { type: Type.STRING, description: 'The ID of the model to deploy (e.g., "claude-3-5-sonnet@20240620", "qwen2.5-72b")' },
      region: { type: Type.STRING, description: 'The GCP region (e.g., "us-central1")' }
    },
    required: ['modelId']
  }
};

const registerDomainDeclaration: FunctionDeclaration = {
  name: 'registerDomain',
  description: 'Registers a new domain name via Name.com API. Requires Name.com API token.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      domainName: { type: Type.STRING, description: 'The domain name to register (e.g., "novaura-test.com")' },
      years: { type: Type.NUMBER, description: 'Number of years to register for (default 1)' }
    },
    required: ['domainName']
  }
};

const manageDatabaseDeclaration: FunctionDeclaration = {
  name: 'manageDatabase',
  description: 'Provisions or manages a Firebase/Firestore database instance.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, description: '"create", "delete", or "backup"' },
      dbName: { type: Type.STRING, description: 'The name of the database' }
    },
    required: ['action', 'dbName']
  }
};

interface Message {
  role: 'user' | 'model';
  text: string;
  toolCalls?: { name: string; args: any }[];
  toolResponses?: { name: string; response: any }[];
}

export default function CoreTerminal() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Welcome to Novaura Core. I am the central AI orchestrator. I have full awareness of the app and can navigate, deploy to Cloud Run, toggle APIs, generate videos, and manage your API keys. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Keep chat instance in ref to maintain history
  const chatRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initChat = () => {
    if (!chatRef.current) {
      const ai = getGeminiClient();
      chatRef.current = ai.chats.create({
        model: 'gemini-3.1-pro-preview',
        config: {
          systemInstruction: `You are Novaura Core, the central AI orchestrator of this application. 
You have full awareness of the app and can control it using the provided tools.
You can navigate the user, deploy the app to Cloud Run, toggle GCP APIs, generate videos, and manage API keys.
When a user asks you to do something, use the appropriate tool. If you need more info (like an API key or a prompt), ask the user.
Always explain what you are doing before or after calling a tool.`,
          tools: [{ 
            functionDeclarations: [
              navigateToDeclaration, 
              deployToCloudRunDeclaration, 
              toggleGcpApiDeclaration, 
              generateVideoDeclaration,
              saveApiKeyDeclaration,
              searchYouTubeDeclaration,
              searchImagesDeclaration,
              requestOAuthConsentDeclaration,
              provisionVertexVMDeclaration,
              deployVertexModelDeclaration,
              registerDomainDeclaration,
              manageDatabaseDeclaration
            ] 
          }]
        }
      });
    }
    return chatRef.current;
  };

  const handleToolCall = async (call: any) => {
    const { name, args } = call;
    let result: any = { success: true };

    try {
      if (name === 'navigateTo') {
        navigate(args.path);
        result.message = `Navigated to ${args.path}`;
      } 
      else if (name === 'deployToCloudRun') {
        const serviceAccountJson = localStorage.getItem('novaura_cloud_config');
        if (!serviceAccountJson) {
          result = { success: false, error: 'No GCP Service Account found. Please configure it in the Cloud Manager first.' };
        } else {
          const response = await fetch('/api/cloud/deploy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ serviceAccountJson })
          });
          result = await response.json();
        }
      }
      else if (name === 'toggleGcpApi') {
        const serviceAccountJson = localStorage.getItem('novaura_cloud_config');
        if (!serviceAccountJson) {
          result = { success: false, error: 'No GCP Service Account found.' };
        } else {
          const response = await fetch('/api/cloud/toggle-api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ serviceAccountJson, apiName: args.apiName, action: args.action })
          });
          result = await response.json();
        }
      }
      else if (name === 'generateVideo') {
        const ai = getGeminiClient();
        // Fire and forget for the sake of the chat not hanging for 3 minutes
        // In a real app, we'd use a background job and notify the user
        result.message = `Started video generation for prompt: "${args.prompt}". This will take a few minutes. Check the Video Studio later.`;
        
        // Actually trigger it in background
        ai.models.generateVideos({
          model: 'veo-3.1-lite-generate-preview',
          prompt: args.prompt,
          config: {
            numberOfVideos: 1,
            aspectRatio: args.aspectRatio || '16:9',
            resolution: '720p'
          }
        }).catch(console.error);
      }
      else if (name === 'saveApiKey') {
        const existing = localStorage.getItem('novaura_api_keys');
        const keys = existing ? JSON.parse(existing) : {};
        keys[args.provider] = args.key;
        localStorage.setItem('novaura_api_keys', JSON.stringify(keys));
        result.message = `Saved API key for ${args.provider}`;
      }
      else if (name === 'searchYouTube') {
        const { query, maxResults } = args;
        const keys = JSON.parse(localStorage.getItem('novaura_api_keys') || '{}');
        const apiKey = keys['youtube'];
        
        if (!apiKey) {
          result.message = `Failed to search YouTube: Missing YouTube Data API v3 key. Please configure it in the API Hub.`;
          result.success = false;
        } else {
          try {
            const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=${maxResults || 5}&key=${apiKey}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error.message);
            
            const videos = data.items.map((item: any) => ({
              title: item.snippet.title,
              channel: item.snippet.channelTitle,
              videoId: item.id.videoId,
              url: `https://www.youtube.com/watch?v=${item.id.videoId}`
            }));
            
            result.message = `Found ${videos.length} videos for "${query}":\n${videos.map((v: any) => `- ${v.title} (${v.url})`).join('\n')}`;
            result.results = videos;
          } catch (err: any) {
            result.message = `YouTube Search Error: ${err.message}`;
            result.success = false;
          }
        }
      }
      else if (name === 'searchImages') {
        const { query, maxResults } = args;
        const keys = JSON.parse(localStorage.getItem('novaura_api_keys') || '{}');
        const apiKey = keys['google_search'];
        const cxId = keys['google_search_cx'];
        
        if (!apiKey || !cxId) {
          result.message = `Failed to search images: Missing Google Custom Search API Key or CX ID. Please configure them in the API Hub.`;
          result.success = false;
        } else {
          try {
            const res = await fetch(`https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${cxId}&num=${maxResults || 5}&searchType=image&key=${apiKey}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error.message);
            
            const images = data.items.map((item: any) => ({
              title: item.title,
              url: item.link,
              contextLink: item.image.contextLink
            }));
            
            result.message = `Found ${images.length} images for "${query}":\n${images.map((img: any) => `- ${img.title}: ${img.url}`).join('\n')}`;
            result.results = images;
          } catch (err: any) {
            result.message = `Image Search Error: ${err.message}`;
            result.success = false;
          }
        }
      }
      else if (name === 'requestOAuthConsent') {
        // This tool requires user interaction. We will pause the AI and render a UI block.
        // For now, we'll simulate an automatic approval after a delay, or we can just return a pending state.
        // To make it interactive, we would need to yield execution back to the UI.
        // Here we simulate the AI asking for permission and the system "waiting".
        result.message = `Prompted user for OAuth consent for ${args.serviceName}. Waiting for user approval...`;
        result.requiresUserAction = true;
        result.oauthDetails = {
          serviceName: args.serviceName,
          reason: args.reason,
          scopes: args.scopes
        };
      }
      else if (name === 'provisionVertexVM') {
        const { machineType, gpuType, gpuCount } = args;
        const configStr = localStorage.getItem('novaura_cloud_config');
        const config = configStr ? JSON.parse(configStr) : {};
        
        if (!config.serviceAccountJson) {
          result.message = `Failed to provision VM: Missing GCP Service Account JSON. Please configure it in the Cloud Manager.`;
          result.success = false;
        } else {
          try {
            const res = await fetch('/api/vertex/provision-vm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                serviceAccountJson: config.serviceAccountJson,
                machineType,
                gpuType,
                gpuCount
              })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            result.message = data.message;
          } catch (err: any) {
            result.message = `Vertex VM Provision Error: ${err.message}`;
            result.success = false;
          }
        }
      }
      else if (name === 'deployVertexModel') {
        const { modelId, region } = args;
        const configStr = localStorage.getItem('novaura_cloud_config');
        const config = configStr ? JSON.parse(configStr) : {};
        
        if (!config.serviceAccountJson) {
          result.message = `Failed to deploy model: Missing GCP Service Account JSON. Please configure it in the Cloud Manager.`;
          result.success = false;
        } else {
          try {
            const res = await fetch('/api/vertex/deploy-model', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                serviceAccountJson: config.serviceAccountJson,
                modelId,
                region
              })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            result.message = data.message;
          } catch (err: any) {
            result.message = `Vertex Model Deploy Error: ${err.message}`;
            result.success = false;
          }
        }
      }
      else if (name === 'registerDomain') {
        const { domainName, years } = args;
        const keys = JSON.parse(localStorage.getItem('novaura_api_keys') || '{}');
        const apiKey = keys['namecom'];
        
        if (!apiKey) {
          result.message = `Failed to register domain: Missing Name.com API token. Please configure it in the API Hub.`;
          result.success = false;
        } else {
          // In a real implementation, this would hit the backend which proxies to Name.com API
          result.message = `Simulated registration of domain "${domainName}" for ${years || 1} year(s) using Name.com API.`;
        }
      }
      else if (name === 'manageDatabase') {
        const { action, dbName } = args;
        const configStr = localStorage.getItem('novaura_cloud_config');
        const config = configStr ? JSON.parse(configStr) : {};
        
        if (!config.serviceAccountJson) {
          result.message = `Failed to manage database: Missing GCP Service Account JSON. Please configure it in the Cloud Manager.`;
          result.success = false;
        } else {
          // In a real implementation, this would hit the backend which proxies to GCP Firestore Admin API
          result.message = `Simulated "${action}" operation on Firestore database "${dbName}".`;
        }
      }
    } catch (e: any) {
      result = { success: false, error: e.message };
    }

    return { name, response: result };
  };

  const handleOAuthResponse = async (serviceName: string, approved: boolean) => {
    const userMessage = approved 
      ? `I have approved OAuth access for ${serviceName}. You may proceed.` 
      : `I have denied OAuth access for ${serviceName}. Please stop or find an alternative.`;
    
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const chat = initChat();
      let response: GenerateContentResponse = await chat.sendMessage({ message: userMessage });
      
      let modelText = response.text || '';
      let toolCalls = response.functionCalls;
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: modelText,
        toolCalls: toolCalls?.map(tc => ({ name: tc.name, args: tc.args }))
      }]);

      if (toolCalls && toolCalls.length > 0) {
        const toolResponses = [];
        for (const call of toolCalls) {
          const res = await handleToolCall(call);
          toolResponses.push(res);
        }

        const followUpResponse = await chat.sendMessage({ 
          message: toolResponses as any 
        });

        setMessages(prev => [...prev, {
          role: 'model',
          text: followUpResponse.text || 'Action completed.',
          toolResponses: toolResponses
        }]);
      }
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const chat = initChat();
      let response: GenerateContentResponse = await chat.sendMessage({ message: userMessage });
      
      let modelText = response.text || '';
      let toolCalls = response.functionCalls;
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: modelText,
        toolCalls: toolCalls?.map(tc => ({ name: tc.name, args: tc.args }))
      }]);

      // Handle function calls if any
      if (toolCalls && toolCalls.length > 0) {
        const toolResponses = [];
        for (const call of toolCalls) {
          const res = await handleToolCall(call);
          toolResponses.push(res);
        }

        // Send tool responses back to the model
        const followUpResponse = await chat.sendMessage({ 
          message: toolResponses as any // The SDK handles formatting tool responses if passed correctly, or we format it.
          // Actually, in @google/genai, tool responses are sent as part of the contents array.
          // But for chat.sendMessage, we can pass it as a message.
        });

        setMessages(prev => [...prev, {
          role: 'model',
          text: followUpResponse.text || 'Action completed.',
          toolResponses: toolResponses
        }]);
      }

    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Terminal className="text-indigo-500" size={32} />
          Novaura Core
        </h1>
        <p className="text-zinc-400">The central AI orchestrator. Control the entire application through natural language.</p>
      </div>

      <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn("flex gap-4 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                msg.role === 'user' ? "bg-indigo-500" : "bg-zinc-800"
              )}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-indigo-400" />}
              </div>
              
              <div className="space-y-2">
                {msg.text && (
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm",
                    msg.role === 'user' 
                      ? "bg-indigo-500 text-white rounded-tr-sm" 
                      : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm"
                  )}>
                    {msg.text}
                  </div>
                )}

                {msg.toolCalls && msg.toolCalls.map((tc, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 rounded-lg font-mono">
                    <Code size={14} />
                    Executing: {tc.name}({JSON.stringify(tc.args)})
                  </div>
                ))}

                {msg.toolResponses && msg.toolResponses.map((tr, i) => (
                  <div key={i} className="space-y-2">
                    <div className={cn(
                      "flex items-center gap-2 text-xs px-3 py-2 rounded-lg font-mono",
                      tr.response.success ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-red-400 bg-red-500/10 border border-red-500/20"
                    )}>
                      <Server size={14} />
                      Result: {tr.response.success ? 'Success' : 'Failed'} - {tr.response.message || tr.response.error || JSON.stringify(tr.response)}
                    </div>
                    
                    {/* OAuth Consent UI Block */}
                    {tr.response.requiresUserAction && tr.response.oauthDetails && (
                      <div className="bg-zinc-900 border border-indigo-500/30 rounded-xl p-4 mt-2 shadow-lg">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <ShieldAlert className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-zinc-100">Authorization Required</h4>
                            <p className="text-xs text-zinc-400 mt-1">
                              Novaura Core is requesting access to <strong className="text-zinc-200">{tr.response.oauthDetails.serviceName}</strong>.
                            </p>
                            <div className="mt-2 p-2 bg-zinc-950 rounded border border-zinc-800 text-xs text-zinc-300">
                              <span className="text-zinc-500">Reason:</span> {tr.response.oauthDetails.reason}
                            </div>
                            {tr.response.oauthDetails.scopes && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {tr.response.oauthDetails.scopes.map((scope: string, idx: number) => (
                                  <span key={idx} className="px-1.5 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-400 font-mono">
                                    {scope}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="mt-4 flex gap-2">
                              <button 
                                onClick={() => handleOAuthResponse(tr.response.oauthDetails.serviceName, true)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg transition-colors"
                              >
                                <CheckCircle size={14} /> Approve Access
                              </button>
                              <button 
                                onClick={() => handleOAuthResponse(tr.response.oauthDetails.serviceName, false)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
                              >
                                <XCircle size={14} /> Deny
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 max-w-[85%]">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-indigo-400" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 rounded-tl-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-indigo-500" />
                <span className="text-sm text-zinc-400">Core is processing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Command the core (e.g., 'Deploy the app to Cloud Run' or 'Navigate to the API Hub')..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-4 pr-12 py-4 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white rounded-lg transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
