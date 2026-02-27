const V = {
  green:   "bg-green-500 hover:bg-green-600 text-white",
  orange:  "bg-btn-orange hover:opacity-90 text-white",
  outline: "bg-white/10 border border-white/20 text-white/80 hover:bg-white/15",
  gray:    "bg-white/[0.16] text-white/75 hover:bg-white/20",
  ghost:   "bg-white/[0.12] text-white/70 hover:bg-white/20",
  danger:  "bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30",
};
export default function Button({ children, onClick, variant="orange", full=false, half=false, className="", disabled=false, loading=false }) {
  return (
    <button onClick={onClick} disabled={disabled||loading}
      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-150 font-jakarta ${full?"w-full":""} ${half?"flex-1":""} ${(disabled||loading)?"opacity-50 cursor-not-allowed":""} ${V[variant]} ${className}`}>
      {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : children}
    </button>
  );
}
