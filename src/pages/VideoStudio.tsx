import { useState } from 'react';
import { getGeminiClient } from '../lib/gemini';
import { Video, Loader2, Play, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '../components/Layout';

export default function VideoStudio() {
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !imageFile) return;
    setIsLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      const ai = getGeminiClient();
      
      let imageConfig = undefined;
      if (imageFile) {
        const base64Data = await fileToBase64(imageFile);
        imageConfig = {
          imageBytes: base64Data,
          mimeType: imageFile.type,
        };
      }
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || undefined,
        image: imageConfig,
        config: {
          numberOfVideos: 1,
          aspectRatio: aspectRatio
        }
      });

      // Poll for completion
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({operation: operation});
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      
      if (downloadLink) {
        // We need to fetch the video with the API key header
        const apiKey = process.env.GEMINI_API_KEY;
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': apiKey || '',
          },
        });
        
        if (response.ok) {
          const blob = await response.blob();
          setVideoUrl(URL.createObjectURL(blob));
        } else {
          throw new Error('Failed to download video from URI');
        }
      } else {
        throw new Error('No video URI returned');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to generate video");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Video Studio</h1>
        <p className="text-zinc-400">Generate stunning videos from text prompts or images using Veo 3.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
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
            <label className="text-sm font-medium text-zinc-300">Starting Image (Optional)</label>
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border border-zinc-700">
                <img src={imagePreview} alt="Starting frame" className="w-full h-32 object-cover" />
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
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <ImageIcon className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">Upload an image to animate</p>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <label className="text-sm font-medium text-zinc-300">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the video you want to generate (e.g., A neon hologram of a cat driving at top speed)..."
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <button
              onClick={handleGenerate}
              disabled={(!prompt.trim() && !imageFile) || isLoading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Video size={18} />}
              {isLoading ? 'Generating (Takes a few mins)...' : 'Generate Video'}
            </button>
          </div>
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Output */}
        <div className="lg:col-span-2 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col items-center justify-center min-h-[500px] relative p-4">
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
    </div>
  );
}
