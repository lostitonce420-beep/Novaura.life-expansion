import { useState } from 'react';
import { getGeminiClient } from '../lib/gemini';
import { Upload, Image as ImageIcon, Video, FileAudio, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../components/Layout';
import Markdown from 'react-markdown';

export default function Analysis() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('Analyze this media and describe what you see/hear in detail.');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (selected.type.startsWith('image/') || selected.type.startsWith('video/')) {
        setPreviewUrl(URL.createObjectURL(selected));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the data:mime/type;base64, prefix
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const ai = getGeminiClient();
      const base64Data = await fileToBase64(file);
      
      // Choose model based on file type
      const isAudio = file.type.startsWith('audio/');
      const model = isAudio ? 'gemini-3-flash-preview' : 'gemini-3.1-pro-preview';

      const response = await ai.models.generateContent({
        model: model,
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: file.type
            }
          },
          prompt
        ]
      });

      setResult(response.text || "No analysis returned.");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to analyze media");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Media Analysis</h1>
        <p className="text-zinc-400">Upload images, videos, or audio for deep analysis and transcription.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-6">
            <div 
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-colors relative",
                file ? "border-indigo-500 bg-indigo-500/5" : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50"
              )}
            >
              <input 
                type="file" 
                accept="image/*,video/*,audio/*" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {previewUrl ? (
                file?.type.startsWith('video/') ? (
                  <video src={previewUrl} className="max-h-48 mx-auto rounded-lg" controls />
                ) : (
                  <img src={previewUrl} className="max-h-48 mx-auto rounded-lg object-contain" alt="Preview" />
                )
              ) : file?.type.startsWith('audio/') ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                    <FileAudio className="w-8 h-8 text-zinc-400" />
                  </div>
                  <p className="text-zinc-300 font-medium">{file.name}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex gap-4 text-zinc-500">
                    <ImageIcon size={32} />
                    <Video size={32} />
                    <FileAudio size={32} />
                  </div>
                  <div>
                    <p className="text-zinc-300 font-medium">Click or drag to upload media</p>
                    <p className="text-zinc-500 text-sm mt-1">Supports Images, Video, and Audio</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-300">Prompt / Instructions</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!file || isLoading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg px-4 py-3 font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {isLoading ? 'Analyzing...' : 'Analyze Media'}
            </button>
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Output Section */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-zinc-800 bg-zinc-950/50">
            <h3 className="font-medium text-zinc-200">Analysis Result</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
                <Loader2 className="animate-spin w-8 h-8 text-indigo-500" />
                <p>Gemini is analyzing your media...</p>
              </div>
            ) : result ? (
              <div className="prose prose-invert max-w-none">
                <Markdown>{result}</Markdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
                <Sparkles size={48} className="opacity-20" />
                <p>Upload media and click analyze to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
