import Button from "../Button";
import { useAuth } from "../../context/AuthContext";
import { LogOut, ShieldCheck, X } from 'lucide-react';

export default function LogoutModal({ onClose }) {
  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
            <LogOut size={18} />
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
            <X size={16} />
          </button>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Log Out?</h2>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to log out of your account?
        </p>
        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs font-medium text-blue-700 inline-flex items-center gap-1.5">
          <ShieldCheck size={14} />
          You can log back in anytime with your email and password.
        </div>
        <div className="flex gap-3">
          <Button full variant="ghost" onClick={onClose}>Cancel</Button>
          <Button full variant="danger" onClick={handleLogout}>Log Out</Button>
        </div>
      </div>
    </div>
  );
}
