import { fmtNPR } from "../utils/helpers";

export default function MonthCard({ amount, loading }) {
  return (
    <div className="glass-strong rounded-2xl px-6 py-5 flex justify-between items-center mb-5">
      <div>
        <p className="text-xs text-white/70 mb-1">This Month</p>
        {loading
          ? <div className="h-8 w-36 bg-white/10 rounded-lg animate-pulse" />
          : <p className="text-3xl font-extrabold text-white tracking-tight">NPR {fmtNPR(amount)}</p>
        }
      </div>
      <div className="text-right">
        <span className="text-3xl font-black text-orange block leading-none">$</span>
      </div>
    </div>
  );
}
