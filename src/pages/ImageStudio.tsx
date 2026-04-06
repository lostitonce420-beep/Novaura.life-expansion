import { useState } from 'react';
import { getGeminiClient } from '../lib/gemini';
import { Image as ImageIcon, Download, Loader2, Settings2, Upload, X, Edit3, Wand2 } from 'lucide-react';
import { cn } from '../components/Layout';

export default function ImageStudio() {
  const [mode, setMode] = useState<'generate' | 'edit'>('generate');
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview'>('gemini-3.1-flash-image-preview');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState('1K');
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceImage(file);
      setReferencePreview(URL.createObjectURL(file));
    }
  };

  const clearReferenceImage = () => {
    setReferenceImage(null);
    setReferencePreview(null);
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
    if (!prompt.trim()) return;
    if (mode === 'edit' && !referenceImage) {
      setError("Please upload a reference image to edit.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const ai = getGeminiClient();
      
      let response;
      
      if (mode === 'edit' && referenceImage) {
        // Image Editing Mode (Inpainting/Outpainting via text prompt)
        const base64Data = await fileToBase64(referenceImage);
        
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image', // 2.5-flash-image is recommended for editing
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: referenceImage.type,
                },
              },
              { text: prompt },
            ],
          },
        });
      } else {
        // Standard Generation Mode (Now supports image data alongside text)
        const parts: any[] = [{ text: prompt }];
        
        if (referenceImage) {
          const base64Data = await fileToBase64(referenceImage);
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: referenceImage.type,
            },
          });
        }

        response = await ai.models.generateContent({
          model: model, // Uses gemini-3-pro-image-preview or gemini-3.1-flash-image-preview
          contents: {
            parts: parts,
          },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio,
              imageSize: imageSize
            }
          }
        });
      }

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setImageUrl(`data:image/png;base64,${part.inlineData.data}`);
          foundImage = true;
          break;
        }
      }
      
      if (!foundImage) {
        setError("No image was returned by the model.");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to process image");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Image Studio</h1>
        <p className="text-zinc-400">Generate high-quality images or edit existing ones using Gemini.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="space-y-6 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          
          <div className="flex gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
            <button
              onClick={() => setMode('generate')}
              className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2", mode === 'generate' ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300")}
            >
              <Wand2 size={16} /> Generate
            </button>
            <button
              onClick={() => setMode('edit')}
              className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2", mode === 'edit' ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300")}
            >
              <Edit3 size={16} /> Edit
            </button>
          </div>

          {mode === 'generate' ? (
            <>
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Settings2 size={16} /> Model
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setModel('gemini-3.1-flash-image-preview')}
                    className={cn("px-3 py-2 text-sm rounded-lg border transition-colors", model === 'gemini-3.1-flash-image-preview' ? "bg-indigo-500/20 border-indigo-500 text-indigo-300" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700")}
                  >
                    Flash Image
                  </button>
                  <button
                    onClick={() => setModel('gemini-3-pro-image-preview')}
                    className={cn("px-3 py-2 text-sm rounded-lg border transition-colors", model === 'gemini-3-pro-image-preview' ? "bg-indigo-500/20 border-indigo-500 text-indigo-300" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700")}
                  >
                    Pro Image
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300">Aspect Ratio</label>
                <select 
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="1:1">1:1 (Square)</option>
                  <option value="3:4">3:4 (Portrait)</option>
                  <option value="4:3">4:3 (Landscape)</option>
                  <option value="9:16">9:16 (Vertical Video)</option>
                  <option value="16:9">16:9 (Widescreen)</option>
                  {model === 'gemini-3.1-flash-image-preview' && (
                    <>
                      <option value="1:4">1:4</option>
                      <option value="1:8">1:8</option>
                      <option value="4:1">4:1</option>
                      <option value="8:1">8:1</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300">Resolution</label>
                <select 
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500"
                >
                  {model === 'gemini-3.1-flash-image-preview' && <option value="512px">512px</option>}
                  <option value="1K">1K</option>
                  <option value="2K">2K</option>
                  <option value="4K">4K</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300">Reference Image (Optional)</label>
                {referencePreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-zinc-700">
                    <img src={referencePreview} alt="Reference" className="w-full h-40 object-cover" />
                    <button 
                      onClick={clearReferenceImage}
                      className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50 rounded-lg p-6 text-center transition-colors relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                    <p className="text-sm text-zinc-300 font-medium">Upload reference image</p>
                    <p className="text-xs text-zinc-500 mt-1">Use an image alongside your text prompt</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-300">Reference Image</label>
              {referencePreview ? (
                <div className="relative rounded-lg overflow-hidden border border-zinc-700">
                  <img src={referencePreview} alt="Reference" className="w-full h-40 object-cover" />
                  <button 
                    onClick={clearReferenceImage}
                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50 rounded-lg p-6 text-center transition-colors relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                  <p className="text-sm text-zinc-300 font-medium">Upload image to edit</p>
                  <p className="text-xs text-zinc-500 mt-1">Supports inpainting & outpainting</p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <label className="text-sm font-medium text-zinc-300">
              {mode === 'generate' ? 'Prompt' : 'Edit Instructions'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={mode === 'generate' ? "Describe the image you want to generate..." : "E.g., 'Add a llama next to the person' or 'Make the background a sunset'"}
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isLoading || (mode === 'edit' && !referenceImage)}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : (mode === 'generate' ? <ImageIcon size={18} /> : <Edit3 size={18} />)}
              {isLoading ? 'Processing...' : (mode === 'generate' ? 'Generate Image' : 'Edit Image')}
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
            <div className="flex flex-col items-center text-zinc-500 space-y-4">
              <Loader2 className="animate-spin w-12 h-12 text-indigo-500" />
              <p>{mode === 'generate' ? 'Crafting your image...' : 'Applying edits...'}</p>
            </div>
          ) : imageUrl ? (
            <div className="relative group w-full h-full flex items-center justify-center">
              <img 
                src={imageUrl} 
                alt="Generated" 
                className="max-w-full max-h-[600px] object-contain rounded-lg shadow-2xl"
              />
              <a 
                href={imageUrl} 
                download="novaura-generation.png"
                className="absolute bottom-4 right-4 bg-zinc-900/80 backdrop-blur border border-zinc-700 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-800"
              >
                <Download size={20} />
              </a>
            </div>
          ) : (
            <div className="flex flex-col items-center text-zinc-600 space-y-4">
              <ImageIcon size={48} className="opacity-50" />
              <p>Your {mode === 'generate' ? 'generated' : 'edited'} image will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
