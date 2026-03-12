import { useState, useEffect } from "react";
import { jobAPI } from "../services/api";
import { fmtNPR } from "../utils/helpers";

function Skeleton() {
  return (
    <div className="glass-dark rounded-2xl overflow-hidden animate-pulse">
      {[1,2,3].map(i=>(
        <div key={i} className="flex justify-between px-5 py-4 border-b border-white/[0.07]">
          <div className="h-3.5 w-20 bg-white/10 rounded"/>
          <div className="h-3.5 w-24 bg-white/10 rounded"/>
        </div>
      ))}
    </div>
  );
}

export default function EarningsPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await jobAPI.getEarnings();
        setData(res.data.data);
      } catch { setError("Failed to load earnings"); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <>
      <h2 className="text-lg font-bold text-white mb-4">Monthly Earnings</h2>

      {error && (
        <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm mb-4">{error}</div>
      )}

      {loading ? <Skeleton/> : !data || data.earnings.length === 0 ? (
        <div className="text-center py-14 text-white/40 text-sm">
          <div className="text-5xl mb-4">💰</div>
          No earnings yet. Complete your first job to get started!
        </div>
      ) : (
        <>
          <div className="glass-dark rounded-2xl overflow-hidden mb-4">
            {data.earnings.map((e, i) => (
              <div key={i} className={`flex justify-between items-center px-5 py-4 ${i < data.earnings.length-1 ? "border-b border-white/[0.07]" : ""}`}>
                <span className="text-white/80 text-sm font-medium">{e.month} {e.year}</span>
                <span className="text-orange font-bold text-sm">NPR {fmtNPR(e.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center px-5 py-4 bg-orange/[0.12] font-bold text-white text-[15px]">
              <span>Total Earnings</span>
              <span>NPR {fmtNPR(data.total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="glass rounded-2xl p-4 text-center">
              <p className="text-2xl font-extrabold text-orange mb-1">NPR {fmtNPR(data.thisMonth)}</p>
              <p className="text-xs text-white/50">This Month</p>
            </div>
            <div className="glass rounded-2xl p-4 text-center">
              <p className="text-2xl font-extrabold text-white mb-1">{data.earnings.length}</p>
              <p className="text-xs text-white/50">Active Months</p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
