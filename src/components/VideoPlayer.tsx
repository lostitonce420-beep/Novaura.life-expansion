import { Loader2, Play, Undo2, Redo2 } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string | null;
  isLoading: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export default function VideoPlayer({
  videoUrl,
  isLoading,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}: VideoPlayerProps) {
  return (
    <div className="lg:col-span-2 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col relative">
      {/* Header with Undo/Redo */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo || isLoading}
          className="p-2 bg-black/50 hover:bg-black/80 disabled:opacity-30 text-white rounded-lg backdrop-blur-sm transition-colors"
          title="Undo"
        >
          <Undo2 size={18} />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo || isLoading}
          className="p-2 bg-black/50 hover:bg-black/80 disabled:opacity-30 text-white rounded-lg backdrop-blur-sm transition-colors"
          title="Redo"
        >
          <Redo2 size={18} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] p-4 relative">
        {isLoading ? (
          <div className="flex flex-col items-center text-zinc-500 space-y-6 max-w-sm text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
              <Loader2 className="animate-spin w-16 h-16 text-indigo-500 relative z-10" />
            </div>
            <div>
              <p className="text-lg font-medium text-zinc-300 mb-2">Rendering your vision...</p>
              <p className="text-sm text-zinc-500">Video generation typically takes 2-3 minutes. Feel free to explore other tabs while you wait.</p>
            </div>
          </div>
        ) : videoUrl ? (
          <div className="w-full h-full flex items-center justify-center">
            <video 
              src={videoUrl} 
              controls 
              autoPlay 
              loop
              className="max-w-full max-h-[600px] rounded-lg shadow-2xl bg-black"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center text-zinc-600 space-y-4">
            <Play size={48} className="opacity-50" />
            <p>Your generated video will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
