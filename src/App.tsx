import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Layout from './components/Layout';
import IntroScreen from './components/IntroScreen';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

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
    <AuthProvider>
      <BrowserRouter>
        {!introComplete && <IntroScreen onComplete={() => setIntroComplete(true)} />}
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="core" element={<ProtectedRoute><CoreTerminal /></ProtectedRoute>} />
            <Route path="chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="image" element={<ProtectedRoute><ImageStudio /></ProtectedRoute>} />
            <Route path="video" element={<ProtectedRoute><VideoStudio /></ProtectedRoute>} />
            <Route path="audio" element={<ProtectedRoute><AudioStudio /></ProtectedRoute>} />
            <Route path="voice" element={<ProtectedRoute><VoiceLive /></ProtectedRoute>} />
            <Route path="analysis" element={<ProtectedRoute><Analysis /></ProtectedRoute>} />
            <Route path="grounding" element={<ProtectedRoute><Grounding /></ProtectedRoute>} />
            <Route path="cloud" element={<ProtectedRoute><CloudManager /></ProtectedRoute>} />
            <Route path="api-hub" element={<ProtectedRoute><ApiHub /></ProtectedRoute>} />
            <Route path="stripe-demo" element={<ProtectedRoute><StripeDemo /></ProtectedRoute>} />
            <Route path="webmail" element={<ProtectedRoute><Webmail /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
