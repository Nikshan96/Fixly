import { useState, useRef } from "react";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import LogoutModal from "../components/modals/LogoutModal";
import { IcCheck, IcLogout, IcArrowLeft } from "../components/Icons";
import { getInitials } from "../utils/helpers";

function Field({ label, value, type="text", placeholder, onChange, disabled }) {
  return (
    <div>
      <label className="text-subtle text-xs font-semibold block mb-1.5">{label}</label>
      <input
        type={type} value={value} placeholder={placeholder} disabled={disabled}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-white/[0.09] border border-white/[0.16] text-white text-sm mb-4 font-jakarta disabled:opacity-50"
      />
    </div>
  );
}

export default function ProfilePage({ showToast }) {
  const { user, updateUser, logout } = useAuth();
  const [form,    setForm]    = useState({ 
    phone: user?.phone||"", 
    address: user?.address||"", 
    avatar: user?.avatar||null,
    email: user?.email||""
  });
  const [pwForm,  setPwForm]  = useState({ currentPassword:"", newPassword:"", confirm:"" });
  const [saving,  setSaving]  = useState(false);
  const [savingPw,setSavingPw]= useState(false);
  const [pwError, setPwError] = useState("");
  const [showLogout, setShowLogout] = useState(false);
  const fileRef = useRef();

  const handleAvatar = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("❌ Image must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, avatar: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    // if (!form.name.trim()) { showToast("❌ Name is required"); return; } // Name is readonly now
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({ 
          phone: form.phone, 
          address: form.address, 
          avatar: form.avatar,
          email: form.email 
      });
      updateUser(res.data.data.user);
      showToast("✅ Profile updated successfully!");
    } catch (e) {
      showToast("❌ " + (e.response?.data?.message || "Update failed"));
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    setPwError("");
    if (!pwForm.currentPassword || !pwForm.newPassword) { setPwError("All fields are required"); return; }
    if (pwForm.newPassword.length < 6) { setPwError("New password must be at least 6 characters"); return; }
    if (pwForm.newPassword !== pwForm.confirm) { setPwError("Passwords do not match"); return; }
    setSavingPw(true);
    try {
      const res = await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      if (res.data.success) {
        setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
        updateUser(res.data.data.user);
        showToast("✅ Password changed successfully!");
      }
    } catch (e) {
      setPwError(e.response?.data?.message || "Failed to change password");
    } finally { setSavingPw(false); }
  };

  return (
    <>
      <h2 className="text-lg font-bold text-white mb-4">My Profile</h2>

      {/* Profile Card */}
      <div className="glass-dark rounded-2xl p-6 mb-4">
        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div onClick={() => fileRef.current.click()}
            className="w-20 h-20 rounded-full bg-btn-orange flex items-center justify-center text-white font-extrabold text-2xl border-[3px] border-orange/50 cursor-pointer overflow-hidden relative group">
            {form.avatar
              ? <img src={form.avatar} alt="avatar" className="w-full h-full object-cover"/>
              : getInitials(form.name)
            }
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[11px] font-semibold">
              Change
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar}/>
        </div>

        <div className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/40 text-sm mb-4">
          <label className="text-subtle text-xs font-semibold block mb-1.5">Name</label>
          <div className="font-medium text-white/70">{user?.name}</div>
        </div>

        <Field label="Phone Number" value={form.phone}   placeholder="+977 98XXXXXXXX"    onChange={v=>setForm(f=>({...f,phone:v}))} type="tel"/>
        
        <label className="text-subtle text-xs font-semibold block mb-1.5">Email</label>
        {/* Email is typically read-only or requires email verification to change. Assuming user wants it editable based on prompt "update their email" */}
        <input 
            type="email" 
            value={form.email} 
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.09] border border-white/[0.16] text-white text-sm mb-4 font-jakarta"
        />

        <Field label="Address"      value={form.address} placeholder="City, District"     onChange={v=>setForm(f=>({...f,address:v}))}/>

        <Button full variant="orange" loading={saving} onClick={handleSaveProfile}>
          <IcCheck size={16}/> Save Profile
        </Button>
      </div>

      {/* Change Password Card */}
      <div className="glass-dark rounded-2xl p-6">
        <h3 className="text-[15px] font-bold text-white mb-4">Change Password</h3>
        {pwError && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-2.5 text-red-300 text-xs mb-4">{pwError}</div>
        )}
        <label className="text-subtle text-xs font-semibold block mb-1.5">Current Password</label>
        <input type="password" value={pwForm.currentPassword} placeholder="••••••••"
          onChange={e=>setPwForm(p=>({...p,currentPassword:e.target.value}))}
          className="w-full px-4 py-3 rounded-xl bg-white/[0.09] border border-white/[0.16] text-white text-sm mb-4 font-jakarta"/>
        <label className="text-subtle text-xs font-semibold block mb-1.5">New Password</label>
        <input type="password" value={pwForm.newPassword} placeholder="Min 6 characters"
          onChange={e=>setPwForm(p=>({...p,newPassword:e.target.value}))}
          className="w-full px-4 py-3 rounded-xl bg-white/[0.09] border border-white/[0.16] text-white text-sm mb-4 font-jakarta"/>
        <label className="text-subtle text-xs font-semibold block mb-1.5">Confirm New Password</label>
        <input type="password" value={pwForm.confirm} placeholder="Re-enter new password"
          onChange={e=>setPwForm(p=>({...p,confirm:e.target.value}))}
          className="w-full px-4 py-3 rounded-xl bg-white/[0.09] border border-white/[0.16] text-white text-sm mb-4 font-jakarta"/>
        
        <Button full variant="outline" loading={savingPw} onClick={handleChangePassword}>
          Update Password
        </Button>
      </div>

      <div className="mt-8 mb-4">
        <Button full variant="danger" onClick={() => setShowLogout(true)}>
            <IcLogout size={16}/> Log Out
        </Button>
      </div>

      {showLogout && <LogoutModal onClose={() => setShowLogout(false)} />}
    </>
  );
}
