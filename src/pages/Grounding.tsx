import { useState } from 'react';
import { getGeminiClient } from '../lib/gemini';
import { Search, MapPin, Loader2, Globe } from 'lucide-react';
import { cn } from '../components/Layout';
import Markdown from 'react-markdown';

export default function Grounding() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [groundingChunks, setGroundingChunks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'search' | 'maps'>('search');
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setGroundingChunks([]);

    try {
      const ai = getGeminiClient();
      
      const config: any = {
        tools: mode === 'search' ? [{ googleSearch: {} }] : [{ googleMaps: {} }],
      };

      // Add location context for maps if possible
      if (mode === 'maps') {
        try {
          // Try to get user location, fallback to SF if not available or denied
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          }).catch(() => null);

          if (position) {
            config.toolConfig = {
              retrievalConfig: {
                latLng: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
                }
              }
            };
          }
        } catch (e) {
          console.log("Geolocation not available, proceeding without it.");
        }
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: config
      });

      setResult(response.text || "No response generated.");
      
      // Extract grounding chunks
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        setGroundingChunks(chunks);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to generate response");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Grounding</h1>
        <p className="text-zinc-400">Connect Gemini to real-world data using Google Search and Google Maps.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="space-y-6 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <div className="flex gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
            <button
              onClick={() => setMode('search')}
              className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2", mode === 'search' ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300")}
            >
              <Search size={16} /> Search
            </button>
            <button
              onClick={() => setMode('maps')}
              className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2", mode === 'maps' ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300")}
            >
              <MapPin size={16} /> Maps
            </button>
          </div>

          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <label className="text-sm font-medium text-zinc-300">Query</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={mode === 'search' ? "Ask about recent news, events, or facts..." : "Ask about places, restaurants, or locations..."}
              rows={5}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <button
              onClick={handleSearch}
              disabled={!prompt.trim() || isLoading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : (mode === 'search' ? <Globe size={18} /> : <MapPin size={18} />)}
              {isLoading ? 'Searching...' : `Search with ${mode === 'search' ? 'Google' : 'Maps'}`}
            </button>
          </div>
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Output */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col min-h-[400px]">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950/50">
              <h3 className="font-medium text-zinc-200">Response</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
                  <Loader2 className="animate-spin w-8 h-8 text-indigo-500" />
                  <p>Searching and generating response...</p>
                </div>
              ) : result ? (
                <div className="prose prose-invert max-w-none">
                  <Markdown>{result}</Markdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
                  {mode === 'search' ? <Globe size={48} className="opacity-20" /> : <MapPin size={48} className="opacity-20" />}
                  <p>Ask a question to see grounded results</p>
                </div>
              )}
            </div>
          </div>

          {/* Sources / Grounding Chunks */}
          {groundingChunks.length > 0 && (
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="p-4 border-b border-zinc-800 bg-zinc-950/50">
                <h3 className="font-medium text-zinc-200">Sources</h3>
              </div>
              <div className="p-4">
                <ul className="space-y-3">
                  {groundingChunks.map((chunk, idx) => {
                    if (chunk.web) {
                      return (
                        <li key={idx} className="flex items-start gap-3">
                          <Globe className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <a href={chunk.web.uri} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline font-medium block">
                              {chunk.web.title}
                            </a>
                            <span className="text-xs text-zinc-500 truncate block max-w-md">{chunk.web.uri}</span>
                          </div>
                        </li>
                      );
                    } else if (chunk.maps) {
                      return (
                        <li key={idx} className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <a href={chunk.maps.uri} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline font-medium block">
                              {chunk.maps.title || 'Google Maps Location'}
                            </a>
                            <span className="text-xs text-zinc-500 truncate block max-w-md">{chunk.maps.uri}</span>
                          </div>
                        </li>
                      );
                    }
                    return null;
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
