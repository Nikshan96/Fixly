import { useState, useEffect } from "react";
import { IcPhone, IcClose, IcMic, IcSpeaker, IcMapPin } from "../Icons";
import Avatar from "../Avatar";

const VISUALIZER_BAR_HEIGHTS = [14, 24, 36, 22, 30];

export default function CallModal({ user = {}, onClose }) {
  const [status, setStatus]     = useState("Connecting...");
  const [isMuted, setIsMuted]   = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [duration, setDuration] = useState(0);

  // Simulate call connection and duration
  useEffect(() => {
    let timer;
    const connectTimer = setTimeout(() => {
      setStatus("Connected");
      timer = setInterval(() => setDuration(d => d + 1), 1000);
    }, 2500);

    return () => {
      clearTimeout(connectTimer);
      clearInterval(timer);
    };
  }, []);

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col items-center justify-between w-full h-full max-w-md p-8 text-center text-white">
        
        {/* Top Info */}
        <div className="flex flex-col items-center mt-12 gap-4 animate-slide-up">
          <Avatar user={user} size="xl" className="w-32 h-32 border-4 border-white/10 shadow-2xl" />
          
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">{user.name || "Customer"}</h2>
            <p className="text-sm font-medium text-white/50 flex items-center justify-center gap-1.5">
              {status === "Connected" ? (
                <span className="text-green-400 animate-pulse">● {formatDuration(duration)}</span>
              ) : (
                status
              )}
            </p>
          </div>
        </div>

        {/* Middle Visualization (optional) */}
        <div className="flex-1 flex items-center justify-center w-full">
           <div className={`w-full max-w-[200px] h-24 flex items-center justify-center gap-1 ${status === "Connected" ? "" : "opacity-30"}`}>
             {[...Array(5)].map((_, i) => (
               <div 
                 key={i} 
                 className="w-1.5 bg-white/40 rounded-full animate-pulse" 
                 style={{ 
                   height: status === "Connected" ? `${VISUALIZER_BAR_HEIGHTS[i]}px` : "4px",
                   animationDuration: "0.8s",
                   animationDelay: `${i * 0.1}s` 
                 }}
               />
             ))}
           </div>
        </div>

        {/* Bottom Actions */}
        <div className="w-full pb-12 space-y-8 animate-slide-up" style={{animationDelay: "0.1s"}}>
            
            {/* Control Row */}
            <div className="flex items-center justify-evenly px-4">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`flex flex-col items-center gap-2 group transition-all ${isMuted ? "text-white" : "text-white/50 hover:text-white"}`}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all ${isMuted ? "bg-white text-black border-white" : "border-white/20 bg-white/5"}`}>
                  <IcMic size={24} color="currentColor" />
                </div>
                <span className="text-xs font-medium">Mute</span>
              </button>

              <button 
                onClick={() => setIsSpeaker(!isSpeaker)}
                className={`flex flex-col items-center gap-2 group transition-all ${isSpeaker ? "text-white" : "text-white/50 hover:text-white"}`}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all ${isSpeaker ? "bg-white text-black border-white" : "border-white/20 bg-white/5"}`}>
                  <IcSpeaker size={24} color="currentColor" />
                </div>
                <span className="text-xs font-medium">Speaker</span>
              </button>
            </div>

            {/* End Call */}
            <div className="flex justify-center">
              <button 
                onClick={onClose}
                className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30 hover:bg-red-600 hover:scale-105 active:scale-95 transition-all"
              >
                <IcPhone size={32} className="rotate-[135deg]" />
              </button>
            </div>

        </div>
      </div>
    </div>
  );
}