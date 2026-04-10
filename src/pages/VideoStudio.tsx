import { useState, useEffect, useReducer } from 'react';
import { getGeminiClient } from '../lib/gemini';
import { Video } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import VideoEditorControls from '../components/VideoEditorControls';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface VideoHistoryState {
  videoUrl: string | null;
  operation: any | null;
  sourceFile: File | null;
  sourceType: 'image' | 'video' | null;
}

interface VideoStudioState {
  prompt: string;
  sourceFile: File | null;
  sourcePreview: string | null;
  sourceType: 'image' | 'video' | null;
  videoUrl: string | null;
  isLoading: boolean;
  aspectRatio: '16:9' | '9:16';
  error: string | null;
  lastOperation: any | null;
  history: VideoHistoryState[];
  historyIndex: number;
}

type VideoStudioAction =
  | { type: 'SET_PROMPT'; payload: string }
  | { type: 'SET_ASPECT_RATIO'; payload: '16:9' | '9:16' }
  | { type: 'SET_SOURCE'; payload: { file: File; sourceType: 'image' | 'video'; preview: string | null } }
  | { type: 'CLEAR_SOURCE' }
  | { type: 'START_LOADING' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RESULT'; payload: { videoUrl: string; operation: any } }
  | { type: 'UNDO' }
  | { type: 'REDO' };

const initialState: VideoStudioState = {
  prompt: '',
  sourceFile: null,
  sourcePreview: null,
  sourceType: null,
  videoUrl: null,
  isLoading: false,
  aspectRatio: '16:9',
  error: null,
  lastOperation: null,
  history: [{ videoUrl: null, operation: null, sourceFile: null, sourceType: null }],
  historyIndex: 0,
};

function videoStudioReducer(state: VideoStudioState, action: VideoStudioAction): VideoStudioState {
  switch (action.type) {
    case 'SET_PROMPT':
      return { ...state, prompt: action.payload };
    case 'SET_ASPECT_RATIO':
      return { ...state, aspectRatio: action.payload };
    case 'SET_SOURCE':
      return {
        ...state,
        sourceFile: action.payload.file,
        sourceType: action.payload.sourceType,
        sourcePreview: action.payload.preview,
        error: null,
        // If it's a video, we treat it as a result too (for extension)
        ...(action.payload.sourceType === 'video' ? {
          videoUrl: action.payload.preview,
          lastOperation: null,
          history: [...state.history.slice(0, state.historyIndex + 1), {
            videoUrl: action.payload.preview,
            operation: null,
            sourceFile: action.payload.file,
            sourceType: 'video'
          }],
          historyIndex: state.historyIndex + 1
        } : {})
      };
    case 'CLEAR_SOURCE':
      const isVideo = state.sourceType === 'video';
      return {
        ...state,
        sourceFile: null,
        sourcePreview: null,
        sourceType: null,
        ...(isVideo ? {
          videoUrl: null,
          lastOperation: null,
          history: [...state.history.slice(0, state.historyIndex + 1), {
            videoUrl: null,
            operation: null,
            sourceFile: null,
            sourceType: null
          }],
          historyIndex: state.historyIndex + 1
        } : {})
      };
    case 'START_LOADING':
      return { ...state, isLoading: true, error: null };
    case 'SET_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'SET_RESULT':
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({
        videoUrl: action.payload.videoUrl,
        operation: action.payload.operation,
        sourceFile: state.sourceFile,
        sourceType: state.sourceType
      });
      return {
        ...state,
        isLoading: false,
        videoUrl: action.payload.videoUrl,
        lastOperation: action.payload.operation,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    case 'UNDO':
      if (state.historyIndex > 0) {
        const prevIndex = state.historyIndex - 1;
        const prevState = state.history[prevIndex];
        return {
          ...state,
          historyIndex: prevIndex,
          videoUrl: prevState.videoUrl,
          lastOperation: prevState.operation,
          sourceFile: prevState.sourceFile,
          sourceType: prevState.sourceType,
        };
      }
      return state;
    case 'REDO':
      if (state.historyIndex < state.history.length - 1) {
        const nextIndex = state.historyIndex + 1;
        const nextState = state.history[nextIndex];
        return {
          ...state,
          historyIndex: nextIndex,
          videoUrl: nextState.videoUrl,
          lastOperation: nextState.operation,
          sourceFile: nextState.sourceFile,
          sourceType: nextState.sourceType,
        };
      }
      return state;
    default:
      return state;
  }
}

export default function VideoStudio() {
  const [state, dispatch] = useReducer(videoStudioReducer, initialState);
  const {
    prompt,
    sourceFile,
    sourcePreview,
    sourceType,
    videoUrl,
    isLoading,
    aspectRatio,
    error,
    lastOperation,
    history,
    historyIndex
  } = state;

  const [isApiKeySelected, setIsApiKeySelected] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsApiKeySelected(hasKey);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectApiKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setIsApiKeySelected(true);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        dispatch({ type: 'SET_ERROR', payload: "File is too large. Please upload a file smaller than 20MB." });
        return;
      }
      const isVideo = file.type.startsWith('video/');
      const url = URL.createObjectURL(file);
      
      dispatch({
        type: 'SET_SOURCE',
        payload: {
          file,
          sourceType: isVideo ? 'video' : 'image',
          preview: isVideo ? url : url
        }
      });
    }
  };

  const clearImage = () => {
    dispatch({ type: 'CLEAR_SOURCE' });
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
    if (!prompt.trim() && !sourceFile) return;
    dispatch({ type: 'START_LOADING' });

    try {
      const ai = getGeminiClient();
      
      let imageConfig = undefined;
      if (sourceFile && sourceType === 'image') {
        const base64Data = await fileToBase64(sourceFile);
        imageConfig = {
          imageBytes: base64Data,
          mimeType: sourceFile.type,
        };
      }
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt: prompt || undefined,
        image: imageConfig,
        config: {
          numberOfVideos: 1,
          aspectRatio: aspectRatio,
          resolution: '720p'
        }
      });

      // Poll for completion
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({operation: operation});
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      
      if (downloadLink) {
        // Use the selected API key
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': apiKey || '',
          },
        });
        
        if (response.ok) {
          const blob = await response.blob();
          dispatch({
            type: 'SET_RESULT',
            payload: {
              videoUrl: URL.createObjectURL(blob),
              operation
            }
          });
        } else {
          throw new Error('Failed to download video from URI');
        }
      } else {
        throw new Error('No video URI returned');
      }
    } catch (err) {
      console.error(err);
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : "Failed to generate video" });
    }
  };

  const handleExtend = async () => {
    if ((!lastOperation && sourceType !== 'video') || !prompt.trim()) return;
    dispatch({ type: 'START_LOADING' });

    try {
      const ai = getGeminiClient();
      
      let videoConfig = undefined;
      if (lastOperation) {
        videoConfig = lastOperation.response?.generatedVideos?.[0]?.video;
      } else if (sourceType === 'video' && sourceFile) {
        const base64Data = await fileToBase64(sourceFile);
        videoConfig = {
          videoBytes: base64Data,
          mimeType: sourceFile.type
        };
      }
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt: prompt,
        video: videoConfig,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
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
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': apiKey || '',
          },
        });
        
        if (response.ok) {
          const blob = await response.blob();
          dispatch({
            type: 'SET_RESULT',
            payload: {
              videoUrl: URL.createObjectURL(blob),
              operation
            }
          });
        } else {
          throw new Error('Failed to download extended video');
        }
      }
    } catch (err) {
      console.error(err);
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : "Failed to extend video" });
    }
  };

  if (!isApiKeySelected) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="p-4 bg-indigo-500/10 rounded-full">
          <Video className="w-12 h-12 text-indigo-500" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-zinc-100">API Key Required</h2>
          <p className="text-zinc-400 max-w-md">
            Veo video generation requires a paid Google Cloud project API key. 
            Please select your key to continue.
          </p>
          <p className="text-xs text-zinc-500">
            Learn more about <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Gemini API billing</a>.
          </p>
        </div>
        <button
          onClick={handleSelectApiKey}
          className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-8 py-3 font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          Select API Key
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Video Studio</h1>
        <p className="text-zinc-400">Generate stunning videos from text prompts or images using Veo 3.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <VideoEditorControls
          prompt={prompt}
          setPrompt={(p) => dispatch({ type: 'SET_PROMPT', payload: p })}
          aspectRatio={aspectRatio}
          setAspectRatio={(r) => dispatch({ type: 'SET_ASPECT_RATIO', payload: r })}
          sourcePreview={sourcePreview}
          sourceType={sourceType}
          sourceFile={sourceFile}
          handleImageChange={handleImageChange}
          clearImage={clearImage}
          handleGenerate={handleGenerate}
          handleExtend={handleExtend}
          isLoading={isLoading}
          videoUrl={videoUrl}
          lastOperation={lastOperation}
          error={error}
        />

        {/* Output */}
        <VideoPlayer
          videoUrl={videoUrl}
          isLoading={isLoading}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onUndo={() => dispatch({ type: 'UNDO' })}
          onRedo={() => dispatch({ type: 'REDO' })}
        />
      </div>
    </div>
  );
}
