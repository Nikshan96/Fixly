import { useState, useEffect } from 'react';
import { X, UserCheck } from 'lucide-react';
import { adminAPI } from '../../../services/api';

const ReassignTechnicianModal = ({ job, isOpen, onClose, onSuccess }) => {
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedTechnician('');
      setError('');
      fetchTechnicians();
    }
  }, [isOpen, job?.technician?.id]);

  const fetchTechnicians = async () => {
    try {
      const response = await adminAPI.getAllTechnicians();
      if (response.data.success) {
        // Filter active technicians
        const activeTechs = response.data.data.filter((tech) =>
          tech.is_active && Number(tech.id) !== Number(job?.technician?.id)
        );
        setTechnicians(activeTechs);
      }
    } catch (err) {
      console.error('Error fetching technicians:', err);
    }
  };

  const handleReassign = async () => {
    if (!selectedTechnician) {
      setError('Please select a technician');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update booking with new technician
      const response = await adminAPI.updateBooking(job.id, {
        technician_id: parseInt(selectedTechnician)
      });

      if (response.data.success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reassign technician');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white w-full max-w-md p-6 relative rounded-xl border border-gray-200 shadow-xl">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-blue-700 mb-2">Reassign Technician</h2>
            <p className="text-gray-700 text-sm">
              Job #{job?.id} - {job?.service?.name}
            </p>
            {job?.technician && (
              <p className="text-gray-700 text-sm mt-1">
                Current: {job.technician.name}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Technician Selection */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-3">
              Select New Technician
            </label>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {technicians.length === 0 ? (
                <p className="text-gray-700 text-sm text-center py-4 font-medium">
                  No available technicians
                </p>
              ) : (
                technicians.map((tech) => (
                  <label
                    key={tech.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTechnician === tech.id.toString()
                        ? 'border-blue-400 bg-blue-500/10'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="technician"
                      value={tech.id}
                      checked={selectedTechnician === tech.id.toString()}
                      onChange={(e) => setSelectedTechnician(e.target.value)}
                      className="w-4 h-4 text-blue-500"
                    />
                    
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {tech.name.charAt(0)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 font-medium">{tech.name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tech.services?.map((service) => (
                          <span 
                            key={service.id}
                            className="text-xs text-blue-700"
                          >
                            {service.name}
                          </span>
                        )) || <span className="text-gray-700 text-sm">No services</span>}
                      </div>
                      <div className="flex gap-3 mt-1 text-sm text-gray-700">
                        <span>{tech.total_jobs || 0} jobs</span>
                        <span>★ {tech.rating || '0.0'}</span>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReassign}
              disabled={loading || !selectedTechnician}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                'Reassigning...'
              ) : (
                <>
                  <UserCheck size={18} />
                  Reassign
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReassignTechnicianModal;