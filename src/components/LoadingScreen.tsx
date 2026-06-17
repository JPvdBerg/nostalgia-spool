import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  onReady: () => void;
  assets: string[];
}

export default function LoadingScreen({ onReady, assets }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    let loadedCount = 0;
    const total = assets.length;

    if (total === 0) {
      onReady();
      return;
    }

    const preloadAsset = (url: string) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          loadedCount++;
          setProgress(Math.floor((loadedCount / total) * 100));
          resolve(url);
        };
        img.onerror = () => {
          loadedCount++;
          setProgress(Math.floor((loadedCount / total) * 100));
          resolve(url); // Continue even on error
        };
      });
    };

    const loadAll = async () => {
      setStatus('Fetching era metadata...');
      await new Promise(r => setTimeout(r, 800)); // Aesthetic delay
      
      setStatus('Accessing image repository...');
      // Load in batches to not choke the network
      const batchSize = 5;
      for (let i = 0; i < assets.length; i += batchSize) {
        const batch = assets.slice(i, i + batchSize);
        await Promise.all(batch.map(preloadAsset));
      }

      setStatus('Sequence complete.');
      await new Promise(r => setTimeout(r, 500));
      onReady();
    };

    loadAll();
  }, [assets, onReady]);

  return (
    <div className="fixed inset-0 bg-[#1a1a1a] z-[100] flex flex-col items-center justify-center p-10 font-mono">
      <div className="w-full max-w-md">
        <div className="flex justify-between mb-2 text-[10px] text-[#ff5722] font-bold">
          <span>SYSTEM_BOOT_SEQUENCE</span>
          <span>{progress}%</span>
        </div>
        
        <div className="h-8 border-2 border-[#404040] bg-black p-1 flex gap-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <div 
              key={i}
              className={`flex-1 transition-colors duration-300 ${i < (progress / 5) ? 'bg-[#ff5722]' : 'bg-[#262626]'}`}
            />
          ))}
        </div>
        
        <div className="mt-4 flex flex-col gap-1">
          <div className="text-xs text-[#e5e5e5]">
            <span className="text-[#a3a3a3]">STATUS:</span> {status}
          </div>
          <div className="text-[10px] text-[#404040]">
            LOCATION: CACHE_API_STORAGE_V1
          </div>
        </div>

        <div className="mt-20 flex justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-t-2 border-r-2 border-[#ff5722] rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
