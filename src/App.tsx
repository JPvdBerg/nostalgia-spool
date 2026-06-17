import { useEffect, useState, useMemo } from 'react'
import { motion, useMotionValueEvent, AnimatePresence } from 'framer-motion'
import { useAudio } from './hooks/useAudio'
import { tracks } from './data'
import LoadingScreen from './components/LoadingScreen'

function formatTime(s: number) {
  if (!s || !Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] System sequence initiated...`,
    `[${new Date().toLocaleTimeString()}] Loading binary...`,
    `[${new Date().toLocaleTimeString()}] Fetching era metadata...`,
  ]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-10), `[${new Date().toLocaleTimeString()}] ${msg}`]);
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
    status
  } = audio;

  const [currentTimeStr, setCurrentTimeStr] = useState("0:00");
  const [durationStr, setDurationStr] = useState("0:00");

  useMotionValueEvent(time, "change", (latest) => {
    setCurrentTimeStr(formatTime(latest));
  });

  useEffect(() => {
    setDurationStr(formatTime(duration));
  }, [duration]);

  useEffect(() => {
    if (currentTrack) {
      addLog(`Loading track: ${currentTrack.title}`);
      if (window.innerWidth < 1024) setShowArchive(false);
    }
  }, [currentTrack]);

  useEffect(() => {
    if (status === 'playing') addLog("Audio stream engaged.");
    if (status === 'paused') addLog("Audio stream halted.");
    if (status === 'error') addLog("CRITICAL ERROR: Stream corruption detected.");
  }, [status]);

  const [clock, setClock] = useState(new Date().toLocaleTimeString());
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const progressPct = duration > 0 ? (time.get() / duration) * 100 : 0;

  const allAssets = useMemo(() => {
    return tracks.flatMap(t => [
      t.coverArt,
      ...t.photos.map(p => typeof p === 'string' ? p : p.src)
    ]);
  }, []);

  return (
    <>
      <AnimatePresence>
        {!isReady && (
          <LoadingScreen onReady={() => setIsReady(true)} assets={allAssets} />
        )}
      </AnimatePresence>

      <div className="flex flex-col h-screen bg-[#1a1a1a] text-[#e5e5e5] font-sans overflow-hidden">
        {/* TOP HEADER */}
        <header className="h-12 bg-black border-b-2 border-[#404040] flex items-center justify-between px-4 z-[60]">
          <div className="flex items-center gap-3">
            <span className="mono text-[#ff5722] font-black text-sm md:text-base">NS_SPOOL //</span>
            <span className="mono text-[10px] hidden sm:inline">VER_6.17.2026</span>
          </div>
          <div className="flex gap-3 md:gap-5">
            <button 
              onClick={() => setShowArchive(!showArchive)}
              className="lg:hidden h-8 px-3 bg-[#262626] border border-[#404040] text-[10px] mono uppercase font-bold"
            >
              {showArchive ? 'CLOSE_ARCHIVE' : 'OPEN_ARCHIVE'}
            </button>
            <div className="bg-[#262626] border border-[#404040] px-2 py-0.5 text-[10px] uppercase tracking-widest hidden sm:flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80]"></div>
              <span className="mono">Online</span>
            </div>
            <div className="mono text-xs flex items-center">{clock}</div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
          {/* LEFT COLUMN: DB_ARCHIVE (Mobile: Overlay/Slide-in, Desktop: Fixed) */}
          <aside className={`
            fixed inset-0 top-12 z-50 lg:static lg:z-0 lg:w-80 lg:translate-x-0
            bg-[#111] border-r-2 border-[#404040] transition-transform duration-300 flex flex-col
            ${showArchive ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="p-4 border-b-2 border-[#404040] bg-[#262626] flex justify-between items-center">
              <span className="mono text-xs font-bold uppercase tracking-tight">DB_ARCHIVE // {String(tracks.length).padStart(2, '0')}_ENTRIES</span>
              <button onClick={() => setShowArchive(false)} className="lg:hidden p-1 text-[#ff5722]">
                [X]
              </button>
            </div>
            <ul className="flex-1 overflow-y-auto">
              {tracks.map((track, i) => (
                <li 
                  key={track.id}
                  onClick={() => selectTrack(track)}
                  className={`p-4 border-b border-[#404040] cursor-pointer transition-colors group relative
                    ${currentTrack?.id === track.id ? 'bg-[#ff5722] text-black border-l-4 border-l-white' : 'hover:bg-[#222]'}`}
                >
                  <div className="flex justify-between mb-1 mono text-[10px]">
                    <span>#{String(i + 1).padStart(2, '0')}</span>
                    <span className={currentTrack?.id === track.id ? 'text-black' : 'text-[#ff5722]'}>{track.era}</span>
                  </div>
                  <h3 className="text-sm font-extrabold uppercase truncate">{track.title}</h3>
                </li>
              ))}
            </ul>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-[radial-gradient(#404040_1px,transparent_0)] [background-size:40px_40px]">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[1fr_380px] gap-6 md:gap-10">
              
              {/* CENTER: PLAYER (Front & Center) */}
              <section className="flex flex-col gap-6">
                <div className="panel">
                  <div className="panel-label">OS_PLAYER_01</div>
                  <div className="w-full aspect-square md:aspect-video bg-black border-2 border-[#404040] flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-30 pointer-events-none bg-[repeating-linear-gradient(45deg,#111,#111_2px,transparent_2px,transparent_10px)]" />
                    
                    <motion.div 
                      animate={{ rotate: isPlaying ? 360 : 0 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 rounded-full bg-[radial-gradient(circle_at_center,#333_0%,#111_100%)] border-4 border-black shadow-2xl relative flex items-center justify-center z-10"
                    >
                      <div className="absolute inset-[8px] rounded-full border border-white/5 pointer-events-none" />
                      
                      {/* Dynamic Record Label Art */}
                      <div className="w-[38%] h-[38%] rounded-full bg-[#ff5722] border-2 border-black overflow-hidden z-20 relative flex items-center justify-center">
                        {currentTrack?.coverArt ? (
                          <img src={currentTrack.coverArt} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full bg-[#ff5722] text-black flex flex-col items-center justify-center text-center font-black">
                             <span className="mono text-[8px]">{currentTrack ? String(tracks.findIndex(t => t.id === currentTrack.id) + 1).padStart(3, '0') : '---'}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.3)_100%)]" />
                        <div className="w-3 h-3 rounded-full bg-black border border-white/20 absolute z-30 shadow-inner" />
                      </div>
                    </motion.div>
                  </div>

                  {/* Scrubber */}
                  <div className="mt-3 h-12 bg-black border-2 border-black relative cursor-pointer" onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const pct = x / rect.width;
                    audio.seek(pct * duration);
                  }}>
                    <motion.div 
                      className="h-full bg-[#ff5722]"
                      style={{ width: `${progressPct}%` }}
                    />
                    <div className="absolute top-1/2 left-3 -translate-y-1/2 mix-blend-difference font-bold mono text-xs text-white">
                      {currentTimeStr} / {durationStr}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex gap-[2px] bg-black border-2 border-black mt-[2px]">
                    <button 
                      onClick={() => {
                        const idx = tracks.findIndex(t => t.id === currentTrack?.id);
                        if (idx > 0) selectTrack(tracks[idx - 1]);
                      }}
                      className="flex-1 bg-[#262626] border-none text-white font-bold hover:bg-[#333] active:bg-[#ff5722] active:text-black"
                    >
                      PRV
                    </button>
                    <button 
                      onClick={toggle}
                      className="flex-[2] bg-[#ff5722] text-black border-none font-bold hover:opacity-90 active:bg-white"
                    >
                      {isPlaying ? 'HALT' : 'PLAY'}
                    </button>
                    <button 
                      onClick={() => {
                        const idx = tracks.findIndex(t => t.id === currentTrack?.id);
                        if (idx < tracks.length - 1) selectTrack(tracks[idx + 1]);
                      }}
                      className="flex-1 bg-[#262626] border-none text-white font-bold hover:bg-[#333] active:bg-[#ff5722] active:text-black"
                    >
                      NXT
                    </button>
                  </div>
                </div>

                {/* TRACK INFO */}
                <div className="panel">
                  <div className="panel-label">MD_DATA_STREAM</div>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-baseline gap-1 sm:gap-4">
                    <h1 className="text-xl md:text-3xl font-black uppercase truncate">{currentTrack?.title || 'NO_TRACK_LOADED'}</h1>
                    <span className="mono text-[#ff5722] font-bold shrink-0">ERA_{currentTrack?.era || '----'}</span>
                  </div>
                  <p className="text-[#a3a3a3] text-xs md:text-sm uppercase tracking-widest mt-1 mb-5">{currentTrack?.artist || 'UNKNOWN_SOURCE'}</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 mt-3">
                    <div className="border border-[#404040] p-2 bg-[#1a1a1a]">
                      <label className="text-[8px] text-[#a3a3a3] uppercase block">Format</label>
                      <span className="text-[10px] font-bold mono">MPEG_L3</span>
                    </div>
                    <div className="border border-[#404040] p-2 bg-[#1a1a1a]">
                      <label className="text-[8px] text-[#a3a3a3] uppercase block">Source</label>
                      <span className="text-[10px] font-bold mono truncate">MASTER_TAPE</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* RIGHT COLUMN: IMAGES (Front & Center on Mobile) & LOGS */}
              <section className="flex flex-col gap-6 order-first lg:order-last">
                <div className="panel order-first">
                  <div className="panel-label">IMG_REPOSITORY</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 max-h-[400px] overflow-y-auto pr-2">
                    {currentTrack?.photos.map((photo, i) => (
                      <div key={i} className="aspect-square bg-black border border-[#404040] overflow-hidden">
                        <img 
                          src={typeof photo === 'string' ? photo : photo.src} 
                          className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-300" 
                          alt="" 
                        />
                      </div>
                    )) || Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="aspect-square bg-black border border-[#404040] p-2 flex flex-col justify-between">
                        <span className="mono text-[8px] text-[#ff5722]">ERR_404</span>
                        <div className="flex-1 flex items-center justify-center opacity-20">
                          <div className="w-4 h-4 border border-white rotate-45" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel h-[120px] lg:flex-1">
                  <div className="panel-label">SYS_LOG</div>
                  <div className="mono text-[10px] leading-relaxed flex flex-col gap-1 overflow-y-auto h-full pr-2">
                    {logs.map((log, i) => (
                      <div key={i} className={log.includes('CRITICAL') ? 'text-[#ff5722]' : ''}>
                        {log}
                      </div>
                    ))}
                    <div className="blink">_</div>
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>

        {/* FOOTER */}
        <footer className="h-8 bg-black border-t-2 border-[#404040] flex items-center px-4 font-mono text-[9px] text-[#a3a3a3] z-[60]">
          <span className="flex gap-2">
            <span className="hidden sm:inline">ROOT@NS_SPOOL:~$</span>
            <span className="text-white">NOSTALGIA_SEQUENCER --ACTIVE --DEBUG=OFF</span>
          </span>
        </footer>
      </div>
    </>
  )
}
