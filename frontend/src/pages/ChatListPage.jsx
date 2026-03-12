import { useState, useEffect } from "react";
import { jobAPI, chatAPI } from "../services/api";
import { timeAgo } from "../utils/helpers";
import Avatar from "../components/Avatar";
import { IcPin, IcChat } from "../components/Icons";

export default function ChatListPage({ onOpenChat }) {
  const [activeJobs, setActiveJobs] = useState([]);
  const [previews,   setPreviews]   = useState({});
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await jobAPI.getMyJobs();
        const jobs = res.data.data;
        setActiveJobs(jobs);
        // Fetch last message preview for each job
        const previewMap = {};
        await Promise.all(jobs.map(async (j) => {
          try {
            const r = await chatAPI.getMessages(j._id);
            const msgs = r.data.data;
            previewMap[j._id] = msgs[msgs.length - 1] || null;
          } catch (error) {
            console.error('Failed to load chat preview:', error);
            previewMap[j._id] = null;
          }
        }));
        setPreviews(previewMap);
      } catch (error) {
        console.error('Failed to load chat list:', error);
        setActiveJobs([]);
        setPreviews({});
      }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i=>(
        <div key={i} className="glass rounded-2xl p-4 animate-pulse flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/10 flex-shrink-0"/>
          <div className="flex-1"><div className="h-3.5 w-28 bg-white/10 rounded mb-2"/><div className="h-2.5 w-44 bg-white/10 rounded"/></div>
        </div>
      ))}
    </div>
  );

  if (activeJobs.length === 0) return (
    <div className="text-center py-14 text-white/40 text-sm">
      <div className="text-5xl mb-4">💬</div>
      No active jobs — accept a job to start chatting with customers.
    </div>
  );

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Customer Messages</h2>
      <div className="space-y-3">
        {activeJobs.map(job => {
          const customer    = job.customer || {};
          const lastMsg     = previews[job._id];
          const hasUnread   = lastMsg && lastMsg.senderRole === "customer" && lastMsg.readBy?.length <= 1;
          return (
            <div
              key={job._id}
              onClick={() => onOpenChat(job)}
              className="glass rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:bg-white/[0.13] active:scale-[0.98] transition-all"
            >
              <div className="relative">
                <Avatar user={customer} size="md"/>
                {hasUnread && (
                  <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-orange rounded-full border-2 border-[#3b1fa8]"/>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className={`text-[15px] font-bold truncate ${hasUnread?"text-white":"text-white/85"}`}>
                    {customer.name}
                  </p>
                  {lastMsg && (
                    <span className="text-[10px] text-white/35 flex-shrink-0 ml-2">
                      {timeAgo(lastMsg.createdAt)}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-white/40 flex items-center gap-1 truncate mb-0.5">
                  <IcPin size={10}/> {job.type} · {job.location?.ward}
                </p>
                {lastMsg ? (
                  <p className={`text-xs truncate ${hasUnread?"text-white/70 font-semibold":"text-white/35"}`}>
                    {lastMsg.senderRole === "technician" ? "You: " : ""}{lastMsg.text}
                  </p>
                ) : (
                  <p className="text-xs text-white/25 flex items-center gap-1">
                    <IcChat size={11}/> Tap to start conversation
                  </p>
                )}
              </div>
              {hasUnread && (
                <div className="w-5 h-5 bg-orange rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                  1
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
