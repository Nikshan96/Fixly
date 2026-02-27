import { IcJobs, IcEarnings, IcProfile, IcChat } from "./Icons";

export default function BottomNav({ active, onChange, chatUnread = 0 }) {
  const items = [
    { id: "jobs",     label: "Jobs",     Icon: IcJobs },
    { id: "chat",     label: "Messages", Icon: IcChat,     badge: chatUnread },
    { id: "earnings", label: "Earnings", Icon: IcEarnings },
    { id: "profile",  label: "Profile",  Icon: IcProfile },
  ];
  return (
    <nav className="flex h-16 flex-shrink-0 bg-[rgba(15,8,42,0.95)] backdrop-blur-xl border-t border-white/10">
      {items.map(({ id, label, Icon, badge }) => {
        const on = active === id;
        return (
          <button key={id} onClick={() => onChange(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 border-none bg-transparent cursor-pointer text-[10px] font-semibold font-jakarta transition-colors duration-200 relative ${on ? "text-orange" : "text-white/40"}`}>
            <span className="relative">
              <Icon size={20} />
              {badge > 0 && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-orange text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </span>
            {label}
          </button>
        );
      })}
    </nav>
  );
}
