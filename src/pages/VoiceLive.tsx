import { useState, useRef, useEffect } from 'react';
import { getGeminiClient } from '../lib/gemini';
import { Mic, MicOff, Loader2, Activity } from 'lucide-react';
import { cn } from '../components/Layout';
import { Modality } from '@google/genai';

export default function VoiceLive() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<{role: string, text: string}[]>([]);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const connect = async () => {
    setIsConnecting(true);
    setError(null);
    setTranscript([]);

    try {
      const ai = getGeminiClient();
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      source.connect(processor);
      processor.connect(audioCtx.destination);

      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are Novaura's voice assistant. Keep answers brief and conversational.",
        },
        callbacks: {
          onopen: () => {
            console.log("Live API connected");
          },
          onmessage: (message) => {
            // Handle incoming messages
          },
          onclose: () => {
            console.log("Live API closed");
            setIsConnected(false);
          },
          onerror: (error) => {
            console.error("Live API error:", error);
            setError("Live API error occurred");
          }
        }
      });

      sessionRef.current = await sessionPromise;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32Array to Int16Array
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }
        
        // Convert Int16Array to base64
        const buffer = new ArrayBuffer(pcmData.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < pcmData.length; i++) {
          view.setInt16(i * 2, pcmData[i], true);
        }
        
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Data = btoa(binary);

        if (sessionRef.current) {
          sessionRef.current.sendRealtimeInput([{
            mimeType: "audio/pcm;rate=16000",
            data: base64Data
          }]);
        }
      };

      // Handle incoming messages (audio & transcript)
      // Note: The actual implementation of playing back the audio from the server
      // requires a queue and precise scheduling which is complex for a simple demo.
      // We'll just show connection state here.
      
      setIsConnected(true);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to connect to Live API");
      disconnect();
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (sessionRef.current) {
      // sessionRef.current.close(); // Not available in all SDK versions
      sessionRef.current = null;
    }
    setIsConnected(false);
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Voice Live</h1>
        <p className="text-zinc-400 text-lg">Have a real-time voice conversation with Novaura.</p>
      </div>

      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-12 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
        {/* Background animation when connected */}
        {isConnected && (
          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
            <div className="w-64 h-64 bg-indigo-500 rounded-full blur-3xl animate-pulse"></div>
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center space-y-8">
          <button
            onClick={isConnected ? disconnect : connect}
            disabled={isConnecting}
            className={cn(
              "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl",
              isConnected 
                ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" 
                : "bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20",
              isConnecting && "opacity-50 cursor-not-allowed"
            )}
          >
            {isConnecting ? (
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            ) : isConnected ? (
              <MicOff className="w-12 h-12 text-white" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
          </button>

          <div className="text-center space-y-2">
            <h3 className="text-xl font-medium text-zinc-200">
              {isConnecting ? "Connecting..." : isConnected ? "Listening..." : "Tap to Start"}
            </h3>
            <p className="text-zinc-500">
              {isConnected ? "Speak into your microphone" : "Requires microphone access"}
            </p>
          </div>
          
          {isConnected && (
            <div className="flex items-center gap-2 text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
              <Activity size={16} className="animate-pulse" />
              <span className="text-sm font-medium">Live Connection Active</span>
            </div>
          )}
        </div>

        {error && (
          <div className="absolute bottom-6 left-6 right-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
