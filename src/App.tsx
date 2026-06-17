import { useEffect, useState } from 'react'
import { motion, useMotionValueEvent } from 'framer-motion'
import { useAudio } from './hooks/useAudio'
import { tracks } from './data'

function formatTime(s: number) {
  if (!s || !Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function App() {
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

  return (
    <div className="flex flex-col h-screen bg-[#1a1a1a] text-[#e5e5e5] font-sans overflow-hidden">
      {/* TOP HEADER */}
      <header className="h-12 bg-black border-b-2 border-[#404040] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <span className="mono text-[#ff5722] font-black text-base">NS_SPOOL //</span>
          <span className="mono text-xs">VER_6.17.2026</span>
        </div>
        <div className="flex gap-5">
          <div className="bg-[#262626] border border-[#404040] px-2 py-0.5 text-[10px] uppercase tracking-widest flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80]"></div>
            <span className="mono">System_Online</span>
          </div>
          <div className="mono text-xs">{clock}</div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT COLUMN: DB_ARCHIVE */}
        <aside className="w-80 border-r-2 border-[#404040] bg-[#111] flex flex-col">
          <div className="p-4 border-b-2 border-[#404040] bg-[#262626]">
            <span className="mono text-xs font-bold">DB_ARCHIVE // {String(tracks.length).padStart(2, '0')}_ENTRIES</span>
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
                {currentTrack?.id === track.id && isPlaying && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-0.5 items-end h-3">
                    <motion.div animate={{ height: [4, 12, 6] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-black" />
                    <motion.div animate={{ height: [8, 4, 10] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-black" />
                    <motion.div animate={{ height: [6, 10, 4] }} transition={{ repeat: Infinity, duration: 0.4 }} className="w-1 bg-black" />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-10 grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-10 bg-[radial-gradient(#404040_1px,transparent_0)] [background-size:40px_40px]">
          
          {/* CENTER: PLAYER */}
          <section className="flex flex-col gap-6">
            <div className="panel">
              <div className="panel-label">OS_PLAYER_01</div>
              <div className="w-full aspect-video bg-black border-2 border-[#404040] flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 opacity-30 pointer-events-none bg-[repeating-linear-gradient(45deg,#111,#111_2px,transparent_2px,transparent_10px)]" />
                
                <motion.div 
                  animate={{ rotate: isPlaying ? 360 : 0 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-[radial-gradient(circle_at_center,#333_0%,#111_100%)] border-4 border-black shadow-2xl relative flex items-center justify-center z-10"
                >
                  <div className="absolute inset-[10px] rounded-full border border-white/5 pointer-events-none" />
                  <div className="w-24 h-24 rounded-full bg-[#ff5722] text-black flex flex-col items-center justify-center text-center font-black z-20">
                    <span className="mono text-xs">{currentTrack ? String(tracks.findIndex(t => t.id === currentTrack.id) + 1).padStart(3, '0') : '000'}</span>
                    <span className="text-[10px] tracking-[0.2em]">{currentTrack?.era || '----'}</span>
                  </div>
                </motion.div>
              </div>

              {/* Scrubber */}
              <div className="mt-3 h-10 bg-black border-2 border-black relative cursor-pointer" onClick={(e) => {
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
              <div className="flex gap-[2px] bg-black border-2 border-black">
                <button 
                  onClick={() => {
                    const idx = tracks.findIndex(t => t.id === currentTrack?.id);
                    if (idx > 0) selectTrack(tracks[idx - 1]);
                  }}
                  className="flex-1 bg-[#262626] border-none text-white p-4 mono font-bold hover:bg-[#333] active:bg-[#ff5722] active:text-black transition-colors"
                >
                  PRV
                </button>
                <button 
                  onClick={toggle}
                  className="flex-[2] bg-[#ff5722] text-black border-none p-4 mono font-bold hover:opacity-90 active:bg-white transition-colors"
                >
                  {isPlaying ? 'HALT_PLAYBACK' : 'EXECUTE_PLAY'}
                </button>
                <button 
                  onClick={() => {
                    const idx = tracks.findIndex(t => t.id === currentTrack?.id);
                    if (idx < tracks.length - 1) selectTrack(tracks[idx + 1]);
                  }}
                  className="flex-1 bg-[#262626] border-none text-white p-4 mono font-bold hover:bg-[#333] active:bg-[#ff5722] active:text-black transition-colors"
                >
                  NXT
                </button>
              </div>
            </div>

            {/* TRACK INFO */}
            <div className="panel">
              <div className="panel-label">MD_DATA_STREAM</div>
              <div className="flex justify-between items-baseline">
                <h1 className="text-3xl font-black uppercase truncate">{currentTrack?.title || 'NO_TRACK_LOADED'}</h1>
                <span className="mono text-[#ff5722] font-bold">ERA_{currentTrack?.era || '----'}</span>
              </div>
              <p className="text-[#a3a3a3] uppercase tracking-widest mb-5">{currentTrack?.artist || 'UNKNOWN_SOURCE'}</p>
              
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="border border-[#404040] p-2 bg-[#1a1a1a]">
                  <label className="text-[9px] text-[#a3a3a3] uppercase block">Bitrate</label>
                  <span className="text-xs font-bold mono">320 KBPS</span>
                </div>
                <div className="border border-[#404040] p-2 bg-[#1a1a1a]">
                  <label className="text-[9px] text-[#a3a3a3] uppercase block">Format</label>
                  <span className="text-xs font-bold mono">MPEG_L3</span>
                </div>
                <div className="border border-[#404040] p-2 bg-[#1a1a1a]">
                  <label className="text-[9px] text-[#a3a3a3] uppercase block">Source</label>
                  <span className="text-xs font-bold mono">MASTER_TAPE</span>
                </div>
                <div className="border border-[#404040] p-2 bg-[#1a1a1a]">
                  <label className="text-[9px] text-[#a3a3a3] uppercase block">Status</label>
                  <span className="text-xs font-bold mono text-[#ff5722]">ENCRYPTED</span>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: IMAGES & LOGS */}
          <section className="flex flex-col gap-6">
            <div className="panel">
              <div className="panel-label">IMG_REPOSITORY</div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {currentTrack?.photos.map((photo, i) => (
                  <div key={i} className="aspect-square bg-black border border-[#404040] overflow-hidden group">
                    <img 
                      src={typeof photo === 'string' ? photo : photo.src} 
                      className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-300" 
                      alt="" 
                    />
                  </div>
                )) || Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-black border border-[#404040] p-2 flex flex-col justify-between">
                    <span className="mono text-[8px] text-[#ff5722]">ERR_404</span>
                    <div className="flex-1 flex items-center justify-center opacity-20">
                      <div className="w-4 h-4 border border-white rotate-45" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel flex-1">
              <div className="panel-label">SYS_LOG</div>
              <div className="mono text-[10px] leading-relaxed flex flex-col gap-1 overflow-hidden h-full">
                {logs.map((log, i) => (
                  <div key={i} className={log.includes('CRITICAL') ? 'text-[#ff5722]' : ''}>
                    {log}
                  </div>
                ))}
                <div className="blink">_</div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="h-8 bg-black border-t-2 border-[#404040] flex items-center px-4 font-mono text-[10px] text-[#a3a3a3]">
        <span className="flex gap-2">
          <span>ROOT@NS_SPOOL:~$</span>
          <span className="text-white">NOSTALGIA_SEQUENCER --ACTIVE --DEBUG=OFF</span>
        </span>
      </footer>
    </div>
  )
}
