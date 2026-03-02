import { IcMapPin } from "./Icons";

export default function MapBox({ label = "Tap to navigate", onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white/[0.06] border border-white/10 rounded-xl h-28 flex flex-col items-center justify-center gap-2 cursor-pointer my-4 hover:bg-white/10 active:scale-[0.98] transition-all"
    >
      <IcMapPin />
      <span className="text-xs text-white/50 text-center px-4">{label}</span>
    </div>
  );
}
