import { useState, useEffect, useCallback } from "react";
import { jobAPI } from "../services/api";
import { openMaps, dialPhone, timeAgo } from "../utils/helpers";
import Button  from "../components/Button";
import MapBox  from "../components/MapBox";
import { IcPin, IcPhone, IcCheck, IcQR, IcChat, IcLoader } from "../components/Icons";
import AcceptedModal from "../components/modals/AcceptedModal";
import QRModal       from "../components/modals/QRModal";

function Empty({ icon, text }) {
  return (
    <div className="text-center py-14 text-white/40 text-sm">
      <div className="text-5xl mb-4">{icon}</div>{text}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="glass rounded-2xl p-5 mb-3 animate-pulse">
      <div className="h-4 w-28 bg-white/10 rounded mb-3"/>
      <div className="h-3 w-40 bg-white/10 rounded mb-2"/>
      <div className="h-3 w-24 bg-white/10 rounded mb-4"/>
      <div className="flex gap-3">
        <div className="flex-1 h-10 bg-white/10 rounded-xl"/>
        <div className="flex-1 h-10 bg-white/10 rounded-xl"/>
      </div>
    </div>
  );
}

export default function JobsPage({ onOpenChat, showToast }) {
  const [tab,        setTab]        = useState("new");
  const [newJobs,    setNewJobs]    = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [actionId,   setActionId]   = useState(null);   // job id being acted on
  const [modal,      setModal]      = useState(null);   // { type, job }

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const [avail, active] = await Promise.all([jobAPI.getAvailable(), jobAPI.getMyJobs()]);
      setNewJobs(avail.data.data);
      setActiveJobs(active.data.data);
    } catch {
      showToast("❌ Failed to load jobs");
    } finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Poll for new jobs every 30s
  useEffect(() => {
    const t = setInterval(fetchJobs, 30000);
    return () => clearInterval(t);
  }, [fetchJobs]);

  const handleAccept = async (job) => {
    setActionId(job._id);
    try {
      await jobAPI.accept(job._id);
      setNewJobs(p => p.filter(j => j._id !== job._id));
      setActiveJobs(p => [...p, { ...job, status: "accepted" }]);
      setModal({ type: "accepted", job });
      showToast(`✅ Job accepted! Navigate to ${job.customer?.name}`);
    } catch (e) {
      showToast("❌ " + (e.response?.data?.message || "Could not accept job"));
    } finally { setActionId(null); }
  };

  const handleDecline = async (job) => {
    setActionId(job._id);
    try {
      await jobAPI.decline(job._id);
      setNewJobs(p => p.filter(j => j._id !== job._id));
      showToast("Job marked as not available");
    } catch {
      showToast("❌ Could not update job");
    } finally { setActionId(null); }
  };

  const handleComplete = async (job) => {
    setActionId(job._id);
    try {
      await jobAPI.complete(job._id, { paymentAmount: 3500 });
      setActiveJobs(p => p.filter(j => j._id !== job._id));
      showToast("🎉 Job completed! Payment recorded.");
      if (activeJobs.length <= 1) setTab("new");
    } catch (e) {
      showToast("❌ " + (e.response?.data?.message || "Could not complete job"));
    } finally { setActionId(null); }
  };

  return (
    <>
      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden bg-white/[0.08] mb-4">
        {["new","active"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-bold border-none cursor-pointer font-jakarta transition-all duration-200 ${tab===t?"bg-btn-orange text-white":"bg-transparent text-white/55"}`}>
            {t === "new" ? "New Requests" : `Active Jobs${activeJobs.length > 0 ? ` (${activeJobs.length})` : ""}`}
          </button>
        ))}
      </div>

      {loading ? (
        <><Skeleton/><Skeleton/><Skeleton/></>
      ) : tab === "new" ? (
        newJobs.length === 0
          ? <Empty icon="📭" text="No new requests right now. Check back soon!"/>
          : newJobs.map(job => (
            <div key={job._id} className="glass rounded-2xl p-5 mb-3 active:scale-[0.99] transition-transform">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-[17px] font-bold text-white">{job.type}</h3>
                <span className="text-[10px] text-white/40 mt-1">{timeAgo(job.createdAt)}</span>
              </div>
              <p className="flex items-center gap-2 text-muted text-[13px] mb-1"><IcPin size={13}/> {job.location?.ward}, {job.location?.city}</p>
              {job.scheduledAt && <p className="text-faint text-xs mb-1">🕐 {new Date(job.scheduledAt).toLocaleString([], {month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</p>}
              {job.description && <p className="text-white/50 text-xs mt-1 mb-3 line-clamp-2">{job.description}</p>}
              <div className="flex gap-3 mt-3">
                <Button half variant="green" loading={actionId===job._id} onClick={()=>handleAccept(job)}>Accept</Button>
                <Button half variant="gray"  disabled={actionId===job._id} onClick={()=>handleDecline(job)}>Not Available</Button>
              </div>
            </div>
          ))
      ) : (
        activeJobs.length === 0
          ? <Empty icon="🔧" text="No active jobs. Accept a request to get started!"/>
          : activeJobs.map(job => {
            const customer = job.customer || {};
            return (
              <div key={job._id} className="rounded-2xl p-5 mb-3 bg-white/[0.09] backdrop-blur-lg border border-green-500/30">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-[17px] font-bold text-white">{job.type}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${job.status==="accepted"?"bg-blue-500/20 text-blue-300":"bg-green-500/20 text-green-300"}`}>
                    {job.status}
                  </span>
                </div>
                <p className="text-white/80 text-[14px] mb-1">Customer: <strong className="text-white">{customer.name}</strong></p>
                <p className="flex items-center gap-2 text-muted text-[13px] mb-1"><IcPhone size={13}/> {customer.phone}</p>
                <p className="flex items-center gap-2 text-muted text-[13px]"><IcPin size={13}/> {job.location?.address}</p>
                {job.description && <p className="text-white/45 text-xs mt-2 p-2 bg-white/5 rounded-lg">{job.description}</p>}
                <MapBox label={`Navigate → ${job.location?.address}`} onClick={()=>openMaps(job.location?.address)}/>
                <Button full variant="green"   className="mb-2" onClick={()=>dialPhone(customer.phone)}>
                  <IcPhone size={16}/> Call {customer.name}
                </Button>
                <Button full variant="orange"  className="mb-2" loading={actionId===job._id} onClick={()=>handleComplete(job)}>
                  <IcCheck size={16}/> Mark as Completed
                </Button>
                <Button full variant="outline" className="mb-2" onClick={()=>onOpenChat(job)}>
                  <IcChat size={16}/> Chat with Customer
                </Button>
                <Button full variant="ghost" onClick={()=>setModal({type:"qr"})}>
                  <IcQR size={15}/> Show Company QR
                </Button>
              </div>
            );
          })
      )}

      {modal?.type === "accepted" && (
        <AcceptedModal job={modal.job} onNavigate={addr=>{openMaps(addr);setModal(null);}} onClose={()=>setModal(null)}/>
      )}
      {modal?.type === "qr" && <QRModal onClose={()=>setModal(null)}/>}
    </>
  );
}
