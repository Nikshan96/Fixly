import Button  from "../Button";
import QRCode  from "../QRCode";
import { useAuth } from "../../context/AuthContext";
import { QrCode, X } from 'lucide-react';

export default function QRModal({ onClose }) {
  const { user } = useAuth();
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4" onClick={onClose}>
      <div className="w-full max-w-xs rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <QrCode size={15} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Company QR Code</h2>
              <p className="text-[11px] text-gray-500">{user?.name}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
            <X size={14} />
          </button>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-center mb-3">
          <QRCode size={160} color="#1e1540"/>
        </div>
        <Button full variant="orange" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}
