import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Mic, 
  Search, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

const features = [
  {
    name: 'Gemini Chat',
    description: 'Multi-turn conversations with Pro, Flash, and Lite models. Includes High Thinking mode.',
    href: '/chat',
    icon: MessageSquare,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    name: 'Image Studio',
    description: 'Generate high-quality images with precise aspect ratio and resolution controls.',
    href: '/image',
    icon: ImageIcon,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
  {
    name: 'Video Studio',
    description: 'Create stunning videos from text prompts using the Veo 3 model.',
    href: '/video',
    icon: Video,
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
  },
  {
    name: 'Audio & Music',
    description: 'Generate music tracks with Lyria or convert text to lifelike speech.',
    href: '/audio',
    icon: Music,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
  {
    name: 'Voice Live',
    description: 'Have real-time, low-latency voice conversations with the Gemini Live API.',
    href: '/voice',
    icon: Mic,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
  },
  {
    name: 'Media Analysis',
    description: 'Upload images, video, or audio for deep multimodal analysis and transcription.',
    href: '/analysis',
    icon: Sparkles,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
  },
  {
    name: 'Grounding',
    description: 'Connect Gemini to real-world data using Google Search and Google Maps.',
    href: '/grounding',
    icon: Search,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
  },
];

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-4 py-12">
        <div className="inline-flex items-center justify-center p-2 bg-indigo-500/10 rounded-2xl mb-4">
          <Sparkles className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-white">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Novaura</span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
          The ultimate showcase of Google's most advanced AI capabilities. Explore generative media, real-time voice, and deep multimodal analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Link
            key={feature.name}
            to={feature.href}
            className="group relative bg-zinc-900 rounded-3xl p-6 border border-zinc-800 hover:border-zinc-700 transition-all hover:shadow-2xl hover:shadow-indigo-500/5 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className={`w-12 h-12 rounded-2xl ${feature.bg} flex items-center justify-center mb-6`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-zinc-100 mb-2 group-hover:text-white transition-colors">
                {feature.name}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                {feature.description}
              </p>
              <div className="flex items-center text-sm font-medium text-indigo-400 group-hover:text-indigo-300 transition-colors">
                Explore feature <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
