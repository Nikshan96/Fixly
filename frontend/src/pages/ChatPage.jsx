import { useState, useEffect, useRef, useCallback } from "react";
import { chatAPI } from "../services/api";
import { getSocket, joinConversation, emitTyping, emitStopTyping } from "../services/socket";
import { useAuth } from "../context/AuthContext";
import { formatTime, formatDate, dialPhone } from "../utils/helpers";
import Avatar  from "../components/Avatar";
import CallModal from "../components/modals/CallModal";
import { IcArrowLeft, IcSend, IcPhone, IcPin, IcLoader, IcImage, IcClose } from "../components/Icons";

// ── Typing indicator ──────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs">C</div>
      <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
        {[0,1,2].map(i=>(
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse2" style={{animationDelay:`${i*0.2}s`}}/>
        ))}
      </div>
    </div>
  );
}

// ── Single message bubble ─────────────────────────────────────────────────
function MessageBubble({ msg, isMine }) {
  return (
    <div className={`flex items-end gap-2 mb-3 ${isMine?"flex-row-reverse":""}`}>
      {!isMine && (
        <div className="w-7 h-7 rounded-full bg-btn-orange flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
          {msg.senderName?.[0]?.toUpperCase()}
        </div>
      )}
      <div className={`max-w-[72%] ${isMine?"items-end":"items-start"} flex flex-col`}>
        {msg.imageUrl && (
          <div className={`mb-1 overflow-hidden rounded-2xl border border-white/10 ${isMine ? "rounded-br-sm" : "rounded-bl-sm"}`}>
            <img src={msg.imageUrl} alt="attachment" className="block max-w-[200px] max-h-[200px] object-cover" />
          </div>
        )}
        {msg.text && (
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isMine
              ? "bg-btn-orange text-white " + (msg.imageUrl ? "rounded-tr-sm rounded-br-sm" : "rounded-br-sm")
              : "bg-white/[0.12] text-white/90 " + (msg.imageUrl ? "rounded-tl-sm rounded-bl-sm" : "rounded-bl-sm")
          }`}>
            {msg.text}
          </div>
        )}
        <div className={`flex items-center gap-1 mt-1 ${isMine?"flex-row-reverse":""}`}>
          <span className="text-[10px] text-white/30">{formatTime(msg.createdAt || msg.timestamp)}</span>
          {isMine && (
            <span className={`text-[10px] ${msg.readBy?.length > 1 ? "text-blue-400" : "text-white/30"}`}>
              {msg.readBy?.length > 1 ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Date divider ──────────────────────────────────────────────────────────
function DateDivider({ date }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-white/10"/>
      <span className="text-[10px] text-white/30 px-2">{formatDate(date)}</span>
      <div className="flex-1 h-px bg-white/10"/>
    </div>
  );
}

// ── Main ChatPage ─────────────────────────────────────────────────────────
export default function ChatPage({ job, onBack }) {
  const { user }         = useAuth();
  const [messages,    setMessages]    = useState([]);
  const [text,        setText]        = useState("");
  const [image,       setImage]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [sending,     setSending]     = useState(false);
  const [isTyping,    setIsTyping]    = useState(false);
  const [inCall,      setInCall]      = useState(false);
  const bottomRef    = useRef(null);
  const typingTimer  = useRef(null);
  const fileInputRef = useRef(null);
  const customer     = job.customer || {};

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Load messages ───────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await chatAPI.getMessages(job._id);
        if (!cancelled) setMessages(res.data.data);
      } catch (error) {
        console.error('Failed to load chat messages:', error);
      }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [job._id]);

  // ── Join Socket.io conversation room ────────────────────────────────────
  useEffect(() => {
    joinConversation(job._id);
    const socket = getSocket();
    if (!socket) return;

    const onMessage = (msg) => {
      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      setIsTyping(false);
    };
    const onTyping     = () => setIsTyping(true);
    const onStopTyping = () => setIsTyping(false);

    socket.on("chat:message",    onMessage);
    socket.on("chat:typing",     onTyping);
    socket.on("chat:stop_typing",onStopTyping);

    return () => {
      socket.off("chat:message",    onMessage);
      socket.off("chat:typing",     onTyping);
      socket.off("chat:stop_typing",onStopTyping);
    };
  }, [job._id]);

  // ── Auto-scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Send message ────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if ((!trimmed && !image) || sending) return;
    
    setText("");
    const imgToSend = image;
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    
    setSending(true);
    // Optimistic insert
    const temp = {
      _id: "temp_" + Date.now(),
      text: trimmed,
      imageUrl: imgToSend,
      senderRole: "technician",
      senderName: user.name,
      sender: { _id: user._id, name: user.name },
      readBy: [user._id],
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, temp]);
    try {
      const res = await chatAPI.sendMessage(job._id, { text: trimmed, imageUrl: imgToSend });
      // Replace temp with server message
      setMessages(prev => prev.map(m => m._id === temp._id ? res.data.data : m));
    } catch {
      // Revert on error
      setMessages(prev => prev.filter(m => m._id !== temp._id));
      setText(trimmed);
      setImage(imgToSend);
    } finally { setSending(false); }
  }, [text, image, sending, job._id, user]);

  // ── Typing emit ─────────────────────────────────────────────────────────
  const handleTyping = (val) => {
    setText(val);
    emitTyping(job._id);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitStopTyping(job._id), 1500);
  };

  // ── Group messages by date ───────────────────────────────────────────────
  const grouped = [];
  let lastDate  = null;
  messages.forEach(m => {
    const d = new Date(m.createdAt || m.timestamp).toDateString();
    if (d !== lastDate) { grouped.push({ type: "date", date: m.createdAt || m.timestamp }); lastDate = d; }
    grouped.push({ type: "msg", msg: m });
  });

  return (
    <div className="flex flex-col h-full">

      {/* ── Chat Header ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-black/[0.35] backdrop-blur-xl border-b border-white/10 flex-shrink-0">
        <button onClick={onBack} className="bg-transparent border-none text-white/70 cursor-pointer flex hover:text-white transition-colors">
          <IcArrowLeft size={22}/>
        </button>
        <Avatar user={customer} size="sm"/>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-[15px] truncate">{customer.name}</p>
          <p className="text-[11px] text-white/45 flex items-center gap-1">
            <IcPin size={10}/> {job.location?.ward}, {job.location?.city}
          </p>
        </div>
        {customer.phone && (
          <button
            onClick={() => setInCall(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-semibold rounded-xl cursor-pointer hover:bg-green-500/30 transition-colors"
          >
            <IcPhone size={14}/> Call
          </button>
        )}
      </div>
      
      {/* ── Job Info Banner ───────────────────────────────────────────── */}
      <div className="px-4 py-2.5 bg-orange/10 border-b border-orange/20 flex items-center gap-2">
        <span className="text-[11px] text-orange/80 font-semibold">📋 {job.type} Job</span>
        <span className="text-white/20 text-[11px]">•</span>
        <span className="text-[11px] text-white/40 truncate">{job.location?.address}</span>
      </div>

      {/* ── Messages ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3,4].map(i=>(
              <div key={i} className={`flex items-end gap-2 ${i%2===0?"flex-row-reverse":""}`}>
                <div className="w-7 h-7 rounded-full bg-white/10 animate-pulse flex-shrink-0"/>
                <div className={`h-10 rounded-2xl animate-pulse bg-white/10 ${i%2===0?"w-40":"w-52"}`}/>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-white/50 text-sm font-semibold">No messages yet</p>
            <p className="text-white/30 text-xs mt-1">Start the conversation with {customer.name}</p>
          </div>
        ) : (
          grouped.map((item, i) =>
            item.type === "date"
              ? <DateDivider key={`d_${i}`} date={item.date}/>
              : <MessageBubble
                  key={item.msg._id}
                  msg={item.msg}
                  isMine={
                    item.msg.senderRole === "technician" ||
                    String(item.msg.sender?._id) === String(user._id)
                  }
                />
          )
        )}
        {isTyping && <TypingIndicator/>}
        <div ref={bottomRef}/>
      </div>

      {/* ── Input Bar ─────────────────────────────────────────────────── */}
      <div className="px-4 py-3 bg-black/[0.3] backdrop-blur-xl border-t border-white/10 flex flex-col gap-2 flex-shrink-0">
        
        {image && (
          <div className="relative w-fit">
            <img src={image} alt="preview" className="h-24 rounded-xl border border-white/20 object-cover"/>
            <button 
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white border border-white/20 cursor-pointer hover:bg-red-600 transition-colors"
            >
              <IcClose size={12}/>
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 w-full">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*" 
            className="hidden" 
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 cursor-pointer border border-white/10 hover:bg-white/10 transition-colors text-white/60"
            title="Attach Image"
          >
            <IcImage size={20}/>
          </button>

          <textarea
            rows={1}
            value={text}
            onChange={e => handleTyping(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`Message ${customer.name}…`}
            className="flex-1 bg-white/[0.09] border border-white/[0.16] rounded-2xl px-4 py-3 text-white text-sm resize-none max-h-28 overflow-y-auto font-jakarta placeholder:text-white/30 focus:border-orange/60"
            style={{ outline: "none" }}
          />
          <button
            onClick={handleSend}
            disabled={(!text.trim() && !image) || sending}
            className="w-11 h-11 rounded-full bg-btn-orange flex items-center justify-center flex-shrink-0 cursor-pointer border-none disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all text-white"
          >
            {sending ? <IcLoader size={16}/> : <IcSend size={16}/>}
          </button>
        </div>
      </div>

      {inCall && <CallModal user={customer} onClose={() => setInCall(false)} />}
    </div>
  );
}
