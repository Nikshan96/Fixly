export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[rgba(20,12,50,0.97)] border border-white/20 text-white px-6 py-3 rounded-xl text-sm font-semibold z-[300] shadow-2xl flex items-center gap-2 max-w-[90vw] text-center pointer-events-none animate-toast">
      {message}
    </div>
  );
}
