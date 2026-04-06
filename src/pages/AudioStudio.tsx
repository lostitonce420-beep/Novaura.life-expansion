import { useState } from 'react';
import { getGeminiClient } from '../lib/gemini';
import { Music, Loader2, Play, Volume2 } from 'lucide-react';
import { cn } from '../components/Layout';
import { Modality } from '@google/genai';

export default function AudioStudio() {
  const [prompt, setPrompt] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'music' | 'tts'>('music');
  const [musicModel, setMusicModel] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>('lyria-3-clip-preview');
  const [error, setError] = useState<string | null>(null);

  const handleGenerateMusic = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setAudioUrl(null);
    setLyrics('');

    try {
      const ai = getGeminiClient();
      
      const response = await ai.models.generateContentStream({
        model: musicModel,
        contents: prompt,
      });

      let audioBase64 = "";
      let foundLyrics = "";
      let mimeType = "audio/wav";

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !foundLyrics) {
            foundLyrics = part.text;
            setLyrics(foundLyrics);
          }
        }
      }

      if (audioBase64) {
        const binary = atob(audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        setAudioUrl(URL.createObjectURL(blob));
      } else {
        throw new Error("No audio generated");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to generate music");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTTS = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setAudioUrl(null);
    setLyrics('');

    try {
      const ai = getGeminiClient();
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        // TTS returns PCM data usually, but we'll try to play it as wav
        const blob = new Blob([bytes], { type: 'audio/wav' });
        setAudioUrl(URL.createObjectURL(blob));
      } else {
        throw new Error("No audio generated");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to generate speech");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Audio & Music Studio</h1>
        <p className="text-zinc-400">Generate music with Lyria or convert text to speech.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="space-y-6 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <div className="flex gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
            <button
              onClick={() => setMode('music')}
              className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2", mode === 'music' ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300")}
            >
              <Music size={16} /> Music
            </button>
            <button
              onClick={() => setMode('tts')}
              className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2", mode === 'tts' ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300")}
            >
              <Volume2 size={16} /> Speech
            </button>
          </div>

          {mode === 'music' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-300">Model</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMusicModel('lyria-3-clip-preview')}
                  className={cn("px-3 py-2 text-sm rounded-lg border transition-colors", musicModel === 'lyria-3-clip-preview' ? "bg-indigo-500/20 border-indigo-500 text-indigo-300" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700")}
                >
                  Clip (30s)
                </button>
                <button
                  onClick={() => setMusicModel('lyria-3-pro-preview')}
                  className={cn("px-3 py-2 text-sm rounded-lg border transition-colors", musicModel === 'lyria-3-pro-preview' ? "bg-indigo-500/20 border-indigo-500 text-indigo-300" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700")}
                >
                  Pro (Full)
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <label className="text-sm font-medium text-zinc-300">
              {mode === 'music' ? 'Prompt' : 'Text to speak'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={mode === 'music' ? "Describe the music (e.g., A cinematic orchestral track with heavy brass)..." : "Enter text to convert to speech..."}
              rows={5}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <button
              onClick={mode === 'music' ? handleGenerateMusic : handleGenerateTTS}
              disabled={!prompt.trim() || isLoading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : (mode === 'music' ? <Music size={18} /> : <Volume2 size={18} />)}
              {isLoading ? 'Generating...' : `Generate ${mode === 'music' ? 'Music' : 'Speech'}`}
            </button>
          </div>
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Output */}
        <div className="lg:col-span-2 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col p-6">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-8 bg-indigo-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-12 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-6 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-10 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                <div className="w-2 h-8 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <p>Generating audio...</p>
            </div>
          ) : audioUrl ? (
            <div className="flex-1 flex flex-col space-y-8">
              <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800 flex flex-col items-center justify-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Music className="w-10 h-10 text-indigo-400" />
                </div>
                <audio src={audioUrl} controls className="w-full max-w-md" />
              </div>
              
              {lyrics && (
                <div className="flex-1 bg-zinc-950 p-6 rounded-xl border border-zinc-800 overflow-y-auto">
                  <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Generated Lyrics / Metadata</h3>
                  <div className="whitespace-pre-wrap font-serif text-lg text-zinc-300 leading-relaxed">
                    {lyrics}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 space-y-4">
              <Play size={48} className="opacity-50" />
              <p>Your generated audio will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
