import Avatar from "./Avatar";
import { IcBell, IcLogout } from "./Icons";

export default function Header({ user, unreadCount, onNotif, onLogout, onAvatarClick }) {
  return (
    <header className="flex items-center justify-between px-5 py-3 bg-black/[0.28] backdrop-blur-xl border-b border-white/[0.13] flex-shrink-0 z-10 relative">
      <div className="flex items-center gap-3">
        <Avatar user={user} size="sm" onClick={onAvatarClick} />
        <span className="font-bold text-[15px] text-white">Hi {user?.name?.split(" ")[0]}</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onNotif} className="relative p-1.5 bg-transparent border-none cursor-pointer text-white">
          <IcBell />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-orange text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        <button onClick={onLogout} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.13] border border-white/[0.22] text-white text-[13px] font-semibold rounded-xl cursor-pointer hover:bg-white/20 transition-colors">
          <IcLogout /> Logout
        </button>
      </div>
    </header>
  );
}
