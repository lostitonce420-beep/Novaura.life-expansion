import { Video, Loader2, Image as ImageIcon, X, Plus, Sparkles, Wand2, FileVideo } from 'lucide-react';
import { cn } from './Layout';

interface VideoEditorControlsProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  aspectRatio: '16:9' | '9:16';
  setAspectRatio: (ratio: '16:9' | '9:16') => void;
  sourcePreview: string | null;
  sourceType: 'image' | 'video' | null;
  sourceFile: File | null;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearImage: () => void;
  handleGenerate: () => void;
  handleExtend: () => void;
  isLoading: boolean;
  videoUrl: string | null;
  lastOperation: any | null;
  error: string | null;
}

export default function VideoEditorControls({
  prompt,
  setPrompt,
  aspectRatio,
  setAspectRatio,
  sourcePreview,
  sourceType,
  sourceFile,
  handleImageChange,
  clearImage,
  handleGenerate,
  handleExtend,
  isLoading,
  videoUrl,
  lastOperation,
  error
}: VideoEditorControlsProps) {
  return (
    <div className="space-y-6 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
      <div className="space-y-3">
        <label className="text-sm font-medium text-zinc-300">Aspect Ratio</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setAspectRatio('16:9')}
            className={cn("px-3 py-2 text-sm rounded-lg border transition-colors", aspectRatio === '16:9' ? "bg-indigo-500/20 border-indigo-500 text-indigo-300" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700")}
          >
            16:9 Landscape
          </button>
          <button
            onClick={() => setAspectRatio('9:16')}
            className={cn("px-3 py-2 text-sm rounded-lg border transition-colors", aspectRatio === '9:16' ? "bg-indigo-500/20 border-indigo-500 text-indigo-300" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700")}
          >
            9:16 Portrait
          </button>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-zinc-800">
        <label className="text-sm font-medium text-zinc-300">Starting Media (Image or Video)</label>
        {sourcePreview ? (
          <div className="relative rounded-lg overflow-hidden border border-zinc-700">
            <img src={sourcePreview} alt="Starting frame" className="w-full h-32 object-cover" />
            <button 
              onClick={clearImage}
              className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ) : sourceType === 'video' ? (
           <div className="relative rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950 p-4 flex items-center justify-center h-32">
             <div className="text-center">
               <FileVideo className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
               <p className="text-xs text-zinc-400">Video uploaded and ready to extend</p>
             </div>
             <button 
              onClick={clearImage}
              className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
            >
              <X size={16} />
            </button>
           </div>
        ) : (
          <div className="border-2 border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50 rounded-lg p-4 text-center transition-colors relative">
            <input 
              type="file" 
              accept="image/*,video/*" 
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <ImageIcon className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
            <p className="text-xs text-zinc-400">Upload an image or video to start</p>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-4 border-t border-zinc-800">
        <label className="text-sm font-medium text-zinc-300">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={videoUrl ? "Describe how to extend the video..." : "Describe the video you want to generate (e.g., A neon hologram of a cat driving at top speed)..."}
          rows={4}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 resize-none"
        />
        <div className="flex flex-col gap-2">
          <button
            onClick={handleGenerate}
            disabled={(!prompt.trim() && !sourceFile) || isLoading || sourceType === 'video'}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {isLoading && !lastOperation && sourceType !== 'video' ? <Loader2 className="animate-spin" size={18} /> : <Video size={18} />}
            {isLoading && !lastOperation && sourceType !== 'video' ? 'Generating...' : 'Generate New Video'}
          </button>
          
          {(videoUrl || sourceType === 'video') && (
            <button
              onClick={handleExtend}
              disabled={!prompt.trim() || isLoading}
              className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 rounded-lg px-4 py-2.5 font-medium flex items-center justify-center gap-2 transition-colors border border-zinc-700"
            >
              {isLoading && (lastOperation || sourceType === 'video') ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
              {isLoading && (lastOperation || sourceType === 'video') ? 'Extending...' : 'Extend Video (+7s)'}
            </button>
          )}
        </div>
      </div>
      
      {videoUrl && (
        <div className="space-y-3 pt-4 border-t border-zinc-800">
          <label className="text-sm font-medium text-zinc-300">Quick Effects</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPrompt(prompt + ", cinematic lighting, 4k, highly detailed")}
              className="px-2 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-md text-zinc-400 hover:border-indigo-500/50 hover:text-indigo-300 transition-colors flex items-center gap-1.5"
            >
              <Sparkles size={12} /> Cinematic
            </button>
            <button
              onClick={() => setPrompt(prompt + ", slow motion, graceful movement")}
              className="px-2 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-md text-zinc-400 hover:border-indigo-500/50 hover:text-indigo-300 transition-colors flex items-center gap-1.5"
            >
              <Wand2 size={12} /> Slow Motion
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
