import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

import Home from './pages/Home';
import Chat from './pages/Chat';
import ImageStudio from './pages/ImageStudio';
import VideoStudio from './pages/VideoStudio';
import AudioStudio from './pages/AudioStudio';
import VoiceLive from './pages/VoiceLive';
import Analysis from './pages/Analysis';
import Grounding from './pages/Grounding';
import CloudManager from './pages/CloudManager';
import ApiHub from './pages/ApiHub';
import StripeDemo from './pages/StripeDemo';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="chat" element={<Chat />} />
          <Route path="image" element={<ImageStudio />} />
          <Route path="video" element={<VideoStudio />} />
          <Route path="audio" element={<AudioStudio />} />
          <Route path="voice" element={<VoiceLive />} />
          <Route path="analysis" element={<Analysis />} />
          <Route path="grounding" element={<Grounding />} />
          <Route path="cloud" element={<CloudManager />} />
          <Route path="api-hub" element={<ApiHub />} />
          <Route path="stripe-demo" element={<StripeDemo />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
