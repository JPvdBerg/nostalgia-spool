import { useEffect, useState, useMemo } from 'react'
import { motion, useMotionValueEvent, AnimatePresence, PanInfo } from 'framer-motion'
import { useAudio } from './hooks/useAudio'
import { tracks } from './data'
import LoadingScreen from './components/LoadingScreen'

function formatTime(s: number) {
  if (!s || !Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// --- Helper Components ---

const TypewriterText = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    let i = 0;
    setDisplayedText(''); // Reset on new text
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 20); // Faster typing speed
    return () => clearInterval(interval);
  }, [text, onComplete]);

  return <span>{displayedText}</span>;
};
const FullscreenCarousel = ({ track, onClose }: { track: any; onClose: () => void }) => {
  const [photoIndex, setPhotoIndex] = useState(0);

  const nextPhoto = () => setPhotoIndex(prev => (prev + 1) % track.photos.length);
  const prevPhoto = () => setPhotoIndex(prev => (prev - 1 + track.photos.length) % track.photos.length);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center backdrop-blur-sm"
    >
      <button onClick={onClose} className="absolute top-4 right-4 text-white font-bold mono text-lg p-4 z-20">[ CLOSE ]</button>
      <div className="w-full h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.img
            key={photoIndex}
            src={track.photos[photoIndex].src || track.photos[photoIndex]}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="max-w-[90vw] max-h-[80vh] object-contain border-4 border-black shadow-2xl"
          />
        </AnimatePresence>
      </div>
      <div className="absolute bottom-10 flex gap-4">
        <button onClick={prevPhoto} className="btn-mechanical text-white px-8 py-3 mono">PREV</button>
        <button onClick={nextPhoto} className="btn-mechanical text-white px-8 py-3 mono">NEXT</button>
      </div>
    </motion.div>
  );
};

// --- Main App Component ---

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [fullscreen, setFullscreen] = useState(false);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-5), msg]); // Keep log shorter
  };

  const audio = useAudio({
    onEnded: () => {
      addLog("Playback sequence complete.");
      const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id);
      if (currentIndex !== -1 && currentIndex < tracks.length - 1) {
        selectTrack(tracks[currentIndex + 1]);
      }
    }
  });

  const {
    currentTrack,
    isPlaying,
    time,
    duration,
    selectTrack,
    toggle,
  } = audio;
  
  useEffect(() => {
    addLog(`[${new Date().toLocaleTimeString()}] System sequence initiated...`);
  }, []);

  const [currentTimeStr, setCurrentTimeStr] = useState("0:00");
  const [durationStr, setDurationStr] = useState("0:00");

  useMotionValueEvent(time, "change", (latest) => setCurrentTimeStr(formatTime(latest)));
  useEffect(() => setDurationStr(formatTime(duration)), [duration]);

  useEffect(() => {
    if (currentTrack) {
      addLog(`Loading track: ${currentTrack.title}`);
      if (window.innerWidth < 1024) setShowArchive(false);
    }
  }, [currentTrack]);
  
  const [clock, setClock] = useState(new Date().toLocaleTimeString());
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const progressPct = duration > 0 ? (time.get() / duration) * 100 : 0;

  const allAssets = useMemo(() => tracks.flatMap(t => [t.coverArt, ...t.photos.map(p => typeof p === 'string' ? p : p.src)]), []);

  const handleSwipe = (info: PanInfo) => {
    if (Math.abs(info.offset.x) < 50) return;
    const direction = info.offset.x > 0 ? 'right' : 'left';
    const idx = tracks.findIndex(t => t.id === currentTrack?.id);
    if (direction === 'left' && idx < tracks.length - 1) {
      selectTrack(tracks[idx + 1]);
    } else if (direction === 'right' && idx > 0) {
      selectTrack(tracks[idx - 1]);
    }
  };

  return (
    <>
      <AnimatePresence>{!isReady && <LoadingScreen onReady={() => setIsReady(true)} assets={allAssets} />}</AnimatePresence>
      <AnimatePresence>{fullscreen && currentTrack && <FullscreenCarousel track={currentTrack} onClose={() => setFullscreen(false)} />}</AnimatePresence>
      
      <div className="flex flex-col h-screen bg-[#1a1a1a] text-[#e5e5e5] font-sans overflow-hidden">
        <div className="crt-overlay" />
        {/* ... Header and Footer are mostly the same but with refined classes ... */}
        <header className="h-12 bg-black border-b-2 border-[#404040] flex items-center justify-between px-4 z-[60] shrink-0">
             <div className="flex items-center gap-3">
                 <span className="mono text-glow text-sm md:text-base">NS_SPOOL //</span>
             </div>
             <div className="flex gap-3 md:gap-5 items-center">
                 <button onClick={() => setShowArchive(!showArchive)} className="lg:hidden btn-mechanical text-white h-8 px-3 text-[10px] mono uppercase">ARCHIVE</button>
                 <div className="bg-[#262626] border border-[#404040] px-2 py-0.5 text-[10px] uppercase hidden sm:flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 rounded-full online-indicator"></div>
                     <span className="mono text-glow">SYSTEM_ONLINE</span>
                 </div>
                 <div className="mono text-xs">{clock}</div>
             </div>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
          {/* ARCHIVE */}
          <aside className={`fixed inset-0 top-12 z-50 lg:static lg:w-80 lg:shrink-0 lg:translate-x-0 bg-[#111] border-r-2 border-[#404040] transition-transform duration-300 flex flex-col ${showArchive ? 'translate-x-0' : '-translate-x-full'}`}>
             <div className="p-4 border-b-2 border-[#404040] bg-[#262626] flex justify-between items-center">
                 <span className="mono text-xs font-bold uppercase">DB_ARCHIVE</span>
                 <button onClick={() => setShowArchive(false)} className="lg:hidden p-1 text-glow mono">[X]</button>
             </div>
             <ul className="flex-1 overflow-y-auto">
                {tracks.map((track) => (
                  <li key={track.id} onClick={() => selectTrack(track)} className={`btn-mechanical w-full justify-start p-4 border-b border-[#404040] ${currentTrack?.id === track.id ? 'bg-accent text-black' : 'hover:bg-surface'}`}>
                    <div className="flex-1 text-left"><h3 className="text-sm font-extrabold uppercase truncate">{track.title}</h3></div>
                    <span className={`mono text-[10px] ${currentTrack?.id === track.id ? 'text-black' : 'text-glow'}`}>{track.era}</span>
                  </li>
                ))}
             </ul>
          </aside>

          {/* MAIN CONTENT & PLAYER */}
          <main className="flex-1 flex flex-col overflow-y-auto bg-grid">
              <div className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 place-content-start">
                  {/* Photo-centric view when track is playing */}
                  {currentTrack ? (
                      <>
                        <motion.section 
                          className="panel order-first lg:order-last cursor-pointer"
                          onClick={() => setFullscreen(true)}
                          onPanEnd={(_, info) => handleSwipe(info)}
                        >
                          <div className="panel-label">IMG_REPO</div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                            {currentTrack.photos.slice(0, 6).map((p, i) => (
                              <div key={i} className="aspect-square bg-black border border-border overflow-hidden">
                                <img src={typeof p === 'string' ? p : p.src} className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all" alt="" />
                              </div>
                            ))}
                          </div>
                        </motion.section>
                        
                        <section className="panel flex flex-col justify-between">
                            <div>
                              <div className="panel-label">MD_DATA_STREAM</div>
                              <h1 className="font-black uppercase truncate">{currentTrack.title}</h1>
                              <p className="text-text-dim uppercase tracking-widest mb-4">{currentTrack.artist}</p>
                            </div>
                            <div className="h-24 mono text-[10px] leading-relaxed overflow-hidden flex flex-col-reverse">
                              {logs.slice().reverse().map((log, i) => <div key={i}>{i === 0 ? <TypewriterText text={log} /> : log}</div>)}
                              <div className="blink mt-1">_</div>
                            </div>
                        </section>
                      </>
                  ) : (
                      <div className="panel lg:col-span-2 text-center">
                          <div className="panel-label">AWAIT_INPUT</div>
                          <p className="mono text-text-dim">No track selected. Please access DB_ARCHIVE.</p>
                      </div>
                  )}
              </div>
              
              {/* STICKY PLAYER CONTROLS */}
              <div className="shrink-0 p-2 md:p-4 bg-black/50 backdrop-blur-sm border-t-2 border-border">
                <div className="w-full h-3 bg-black border-2 border-black relative cursor-pointer" onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    audio.seek((e.clientX - rect.left) / rect.width * duration);
                }}>
                  <motion.div className="h-full bg-accent" style={{ width: `${progressPct}%` }}/>
                  <div className="absolute top-1/2 left-2 -translate-y-1/2 mix-blend-exclusion font-bold mono text-[9px] text-white">{currentTimeStr}</div>
                  <div className="absolute top-1/2 right-2 -translate-y-1/2 mix-blend-exclusion font-bold mono text-[9px] text-white">{durationStr}</div>
                </div>

                <div className="flex mt-2">
                  <div className="flex-1 flex items-center">
                    <motion.div animate={{ rotate: isPlaying ? 360:0 }} transition={{ repeat: Infinity, ease:'linear', duration:2 }} className="w-16 h-16 rounded-full bg-surface border-2 border-black flex items-center justify-center overflow-hidden">
                       {currentTrack && <img src={currentTrack.coverArt} className="w-full h-full object-cover" alt="cover"/>}
                    </motion.div>
                  </div>
                  <div className="flex-[2] flex gap-px">
                      <button onClick={() => handleSwipe({ offset: { x: 51 } } as PanInfo)} className="btn-mechanical flex-1 bg-surface text-white">PRV</button>
                      <button onClick={toggle} className="btn-mechanical flex-[1.5] bg-accent text-black font-extrabold">{isPlaying ? 'HALT' : 'PLAY'}</button>
                      <button onClick={() => handleSwipe({ offset: { x: -51 } } as PanInfo)} className="btn-mechanical flex-1 bg-surface text-white">NXT</button>
                  </div>
                  <div className="flex-1"></div>
                </div>
              </div>
          </main>
        </div>
      </div>
    </>
  )
}
