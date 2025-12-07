import React, { useState } from 'react';
import { Video, User, Sparkles, Download, X, Play, RefreshCw } from 'lucide-react';
import { logger } from '../services/loggerService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AvatarVideo: React.FC<Props> = ({ isOpen, onClose }) => {
  const [selectedAvatar, setSelectedAvatar] = useState('avatar1');
  const [script, setScript] = useState('');
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!script) return;
    setGenerating(true);
    setVideoUrl(null);

    // MOCK GENERATION
    try {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate API time
      setVideoUrl('https://assets.mixkit.co/videos/preview/mixkit-woman-doing-yoga-meditation-40896-large.mp4'); // Mock output
      logger.log('INFO', 'AI Avatar Video Generated', { requestData: { avatar: selectedAvatar, scriptLength: script.length } });
    } catch (e) {
      logger.log('ERROR', 'Avatar Generation Failed', { error: e });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex overflow-hidden shadow-2xl animate-in zoom-in-95">
        
        {/* Left: Configuration */}
        <div className="w-1/3 bg-earth-50 p-6 flex flex-col border-r border-earth-100">
          <div className="mb-6">
             <h3 className="font-serif font-bold text-xl text-earth-900 flex items-center gap-2">
               <Sparkles className="h-5 w-5 text-herb-600" /> AI Avatar Studio
             </h3>
             <p className="text-xs text-earth-500 mt-1">Create engaging explainer videos</p>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto">
            <div>
              <label className="text-xs font-bold text-earth-500 uppercase mb-2 block">Choose Avatar</label>
              <div className="grid grid-cols-3 gap-2">
                 {['1', '2', '3', '4', '5'].map(id => (
                   <button
                     key={id}
                     onClick={() => setSelectedAvatar(`avatar${id}`)}
                     className={`aspect-square rounded-lg border-2 overflow-hidden relative ${selectedAvatar === `avatar${id}` ? 'border-herb-600 ring-2 ring-herb-100' : 'border-transparent'}`}
                   >
                     <img src={`https://ui-avatars.com/api/?name=Avatar+${id}&background=random`} className="w-full h-full object-cover" />
                   </button>
                 ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-earth-500 uppercase mb-2 block">Script (Text to Video)</label>
              <textarea 
                className="w-full h-40 p-3 rounded-lg border border-earth-200 focus:border-herb-500 focus:ring-1 focus:ring-herb-500 outline-none text-sm resize-none"
                placeholder="Type what the avatar should say..."
                value={script}
                onChange={e => setScript(e.target.value)}
              />
              <p className="text-right text-xs text-earth-400 mt-1">{script.length} chars</p>
            </div>
          </div>

          <div className="pt-4 border-t border-earth-200 mt-4">
             <button
               onClick={handleGenerate}
               disabled={generating || !script}
               className="w-full bg-herb-600 text-white py-3 rounded-xl font-bold hover:bg-herb-700 disabled:opacity-50 flex items-center justify-center gap-2"
             >
               {generating ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Video className="h-5 w-5" />}
               {generating ? 'Rendering...' : 'Generate Video'}
             </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="flex-1 bg-black flex items-center justify-center relative">
           <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white z-10">
             <X className="h-6 w-6" />
           </button>

           {videoUrl ? (
             <div className="relative w-full h-full flex flex-col">
               <video src={videoUrl} controls className="w-full h-full object-contain bg-black" />
               <div className="absolute bottom-6 right-6 flex gap-2">
                 <button className="bg-white text-earth-900 px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition-transform">
                   <Download className="h-4 w-4" /> Export MP4
                 </button>
               </div>
             </div>
           ) : (
             <div className="text-center text-white/30 p-8">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mx-auto mb-4">
                  <Play className="h-8 w-8 ml-1" />
                </div>
                <p className="font-serif text-xl">Preview Area</p>
                <p className="text-sm">Video will appear here after generation</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};