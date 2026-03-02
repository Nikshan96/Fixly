import { IcBell, IcClose } from "./Icons";
import { timeAgo } from "../utils/helpers";

const DOT = { success:"bg-green-500", info:"bg-blue-500", warning:"bg-yellow-500", error:"bg-red-500" };

export default function NotificationPanel({ notifications, loading, onClose, onMarkAll, onDelete }) {
  return (
    <div className="fixed top-16 right-3 w-80 max-h-[420px] bg-notif-dark border border-white/[0.13] rounded-2xl z-[200] shadow-2xl flex flex-col overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
        <div className="flex items-center gap-2 text-[15px] font-bold text-white">
          <IcBell size={16}/> Notifications
        </div>
        <button onClick={onClose} className="bg-transparent border-none text-white/50 cursor-pointer flex hover:text-white/80 transition-colors">
          <IcClose size={18}/>
        </button>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          [1,2,3].map(i=>(
            <div key={i} className="px-4 py-3 border-b border-white/[0.06]">
              <div className="h-3 w-24 bg-white/10 rounded animate-pulse mb-2"/>
              <div className="h-2.5 w-48 bg-white/10 rounded animate-pulse"/>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <p className="p-5 text-center text-white/40 text-[13px]">No notifications</p>
        ) : notifications.map((n) => (
          <div key={n._id || n.id} className={`px-4 py-3 border-b border-white/[0.06] group relative ${!n.read?"bg-orange/[0.07]":""}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT[n.type]||"bg-gray-400"}`}/>
              <span className="text-[13px] font-bold text-white">{n.title}</span>
            </div>
            <p className="text-xs text-white/60 pl-4 mt-0.5">{n.body || n.desc}</p>
            <p className="text-[11px] text-white/35 pl-4 mt-1">{timeAgo(n.createdAt) || n.time}</p>
            {onDelete && (
              <button
                onClick={() => onDelete(n._id || n.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-white/30 hover:text-white/70 bg-transparent border-none cursor-pointer text-xs transition-opacity"
              >✕</button>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div onClick={onMarkAll} className="p-3 text-center border-t border-white/[0.08] cursor-pointer text-orange text-[13px] font-semibold hover:bg-orange/[0.08] transition-colors">
        Mark all as read
      </div>
    </div>
  );
}
