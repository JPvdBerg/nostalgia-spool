import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { useAudio } from './hooks/useAudio'
import { tracks } from './data'
import LoadingScreen from './components/LoadingScreen'

// --- Haptics & Hooks ---
const vibrate = (duration: number) => { if (window.navigator.vibrate) window.navigator.vibrate(duration); };
const useLongPress = (callback = () => {}, ms = 500) => {
    const timeout = useRef<NodeJS.Timeout>();
    const onTouchStart = (e: React.TouchEvent) => {
        timeout.current = setTimeout(() => callback(), ms);
    };
    const onTouchEnd = () => {
        clearTimeout(timeout.current);
    };
    return { onTouchStart, onTouchEnd };
};

// --- Helper & UI Components ---
const PhotoCarousel = ({ track, onEject }: { track: any, onEject: ()=>void }) => {
    const [index, setIndex] = useState(0);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY, currentTarget } = e;
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        const x = (clientX - left) / width - 0.5;
        const y = (clientY - top) / height - 0.5;
        setTilt({ x: -y * 15, y: x * 15 });
    };

    return (
        <motion.div 
            className="w-full aspect-[4/3] relative" 
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.3}
            onDragEnd={(e, {offset}) => { if(offset.y > 100) onEject() }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setTilt({x:0, y:0})}
            style={{ perspective: "1000px" }}
        >
            <AnimatePresence>
                <motion.div 
                    key={index}
                    className="absolute inset-0 image-grid-item"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
                >
                    <img src={track.photos[index].src || track.photos[index]} className="w-full h-full object-cover"/>
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
};

const ArchiveModal = ({ tracks, onSelect, onClose, currentTrackId }: any) => {
    return (
        <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} className="fixed inset-0 bg-surface z-[100] flex flex-col">
            <div className="p-4 border-b-4 border-black flex justify-between items-center">
                <h2 className="font-display text-lg text-glow">DB_ARCHIVE</h2>
                <button onClick={onClose} className="interactive-brutalist p-2 border-2 border-black">CLOSE</button>
            </div>
            <ul className="flex-1 overflow-y-auto">
              {tracks.map((track:any) => (
                <li key={track.id} onClick={() => onSelect(track)} className={`p-4 border-b-2 border-black ${currentTrackId === track.id ? 'bg-accent-raw text-black' : 'hover:bg-accent-raw/20'}`}>
                  <p className="font-bold uppercase truncate">{track.title}</p>
                </li>
              ))}
            </ul>
        </motion.div>
    )
}

// --- Main App Component ---
export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const audio = useAudio({});

  const { currentTrack, isPlaying, selectTrack, toggle, stop: eject } = audio;
  
  const longPressEvents = useLongPress(() => { 
      vibrate(50);
      // Future radial menu logic here
  });

  return (
    <>
      <AnimatePresence>{!isReady && <LoadingScreen onReady={() => setIsReady(true)} assets={[]}/>}</AnimatePresence>
      <AnimatePresence>{showArchive && <ArchiveModal tracks={tracks} currentTrackId={currentTrack?.id} onSelect={(track:any) => { selectTrack(track); setShowArchive(false);}} onClose={() => setShowArchive(false)} />}</AnimatePresence>
      
      <div {...longPressEvents} className="flex flex-col h-screen bg-bg text-text font-mono overflow-hidden">
        <div className="crt-overlay" style={{'--bass-bloom': 0.5} as React.CSSProperties} />
        <header className="h-14 bg-black border-b-4 border-black flex items-center justify-between px-4 z-10 shrink-0">
             <h1 className="font-display text-2xl text-glow tracking-widest">N.SPOOL</h1>
             <button onClick={() => {vibrate(10); setShowArchive(true);}} className="interactive-brutalist border-2 border-black h-10 px-4 text-xs mono">ARCHIVE</button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
            {currentTrack ? (
                <PhotoCarousel track={currentTrack} onEject={() => {vibrate(50); eject()}}/>
            ) : (
                <div className="text-center">
                    <p className="font-display text-3xl">AWAITING INPUT</p>
                    <p className="text-text-dim">SELECT A MEMORY FROM THE ARCHIVE</p>
                </div>
            )}
        </main>
        
        <footer className="shrink-0 p-2 border-t-4 border-black bg-surface" style={{paddingBottom: 'env(safe-area-inset-bottom)'}}>
            <div className="flex items-center justify-center gap-2">
                <button onClick={() => vibrate(10)} className="interactive-brutalist border-2 border-black flex-1 py-3">PRV</button>
                <button onClick={() => {vibrate(50); toggle()}} className="interactive-brutalist border-2 border-black flex-1 py-3 bg-accent-raw text-black font-bold text-lg">{isPlaying ? 'HALT' : 'PLAY'}</button>
                <button onClick={() => vibrate(10)} className="interactive-brutalist border-2 border-black flex-1 py-3">NXT</button>
            </div>
        </footer>
      </div>
    </>
  )
}
