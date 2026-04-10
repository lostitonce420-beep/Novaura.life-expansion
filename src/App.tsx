import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Layout from './components/Layout';
import IntroScreen from './components/IntroScreen';

import Home from './pages/Home';
import CoreTerminal from './pages/CoreTerminal';
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
import Webmail from './pages/Webmail';

export default function App() {
  const [introComplete, setIntroComplete] = useState(false);

  return (
    <BrowserRouter>
      {!introComplete && <IntroScreen onComplete={() => setIntroComplete(true)} />}
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="core" element={<CoreTerminal />} />
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
          <Route path="webmail" element={<Webmail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
