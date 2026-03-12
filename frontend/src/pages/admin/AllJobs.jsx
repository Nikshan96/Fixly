import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { MessageCircle, MapPin, Phone, UserCheck, UserPlus } from 'lucide-react';
import ReassignTechnicianModal from '../../components/admin/common/ReassignTechnicianModal';

const AllJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showReassignModal, setShowReassignModal] = useState(false);

  const fetchJobs = async (currentFilter) => {
    setLoading(true);
    setError('');
    try {
      const params = currentFilter !== 'all' ? { status: currentFilter } : {};
      const response = await adminAPI.getAllBookings(params);
      if (response.data.success) {
        const payload = response.data?.data?.bookings ?? response.data?.data ?? [];
        setJobs(Array.isArray(payload) ? payload : []);
      } else {
        setJobs([]);
        setError(response.data?.message || 'Failed to fetch jobs.');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setJobs([]);
      setError(err.response?.data?.message || 'Unable to load jobs right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(filter);
  }, [filter]);

  const getStatusProgress = (status) => {
    const map = { pending: 25, accepted: 50, 'in-progress': 75, completed: 100 };
    return map[status] || 0;
  };

  const getStatusColor = (status) => {
    const map = {
      completed: 'bg-green-100 text-green-700',
      'in-progress': 'bg-blue-100 text-blue-700',
      accepted: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700',
      pending: 'bg-yellow-100 text-yellow-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const formatStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      accepted: 'Accepted',
      'in-progress': 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      all: 'All',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-700 text-xl">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="admin-page-title mb-2">All Jobs</h1>
          <p className="admin-page-subtitle">Manage and track all service bookings</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'accepted', 'in-progress', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {formatStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="admin-card border border-red-200 p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="admin-card p-12 text-center">
          <p className="text-gray-800 text-lg">No jobs found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const hasTechnician = Boolean(job.technician);
            const isClosedStatus = ['completed', 'cancelled'].includes(job.status);

            return (
              <div key={job.id} className="admin-card-pad hover:shadow-lg">
                <div className="flex items-start justify-between mb-4 gap-4">
                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {job.service?.icon} {job.service?.name || 'Service'}
                      </h3>
                      <span className="text-gray-700 text-sm font-medium">#{job.id}</span>
                      <span className={`admin-chip ${getStatusColor(job.status)}`}>
                        {formatStatusLabel(job.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                      <div>
                        <p className="mb-1">
                          <strong className="text-gray-800">Customer:</strong> {job.customer?.name || '—'}
                        </p>
                        <p className="mb-1">
                          <strong className="text-gray-800">Technician:</strong>{' '}
                          {hasTechnician
                            ? <span className="text-green-700">{job.technician.name}</span>
                            : <span className="text-amber-700">Not assigned</span>
                          }
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 flex items-center gap-2">
                          <Phone size={13} className="flex-shrink-0" />
                          <span><strong className="text-gray-800">Contact Number:</strong> {job.customer?.phone || '—'}</span>
                        </p>
                        <p className="mb-1 flex items-center gap-2">
                          <MapPin size={13} className="flex-shrink-0" />
                          <span className="truncate"><strong className="text-gray-800">Location:</strong> {job.location || '—'}</span>
                        </p>
                      </div>
                    </div>

                    {job.description && (
                      <p className="text-gray-700 text-sm font-medium mt-1 truncate">
                        Note: {job.description}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {/* Assign / Reassign button — hidden for completed/cancelled */}
                    {!isClosedStatus && (
                      <button
                        onClick={() => {
                          setSelectedJob(job);
                          setShowReassignModal(true);
                        }}
                        className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition font-medium ${
                          hasTechnician
                            ? 'bg-amber-500 hover:bg-amber-600 text-white border border-amber-500'
                            : 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600'
                        }`}
                      >
                        {hasTechnician
                          ? <><UserCheck size={15} /> Reassign</>
                          : <><UserPlus size={15} /> Assign Technician</>
                        }
                      </button>
                    )}

                    <button className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                      <MessageCircle size={15} />
                      Chat
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Progress</span>
                    <span className="text-gray-800 font-medium">{getStatusProgress(job.status)}%</span>
                  </div>
                  <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                        job.status === 'completed'
                          ? 'bg-gradient-to-r from-green-500 to-green-400'
                          : job.status === 'cancelled'
                          ? 'bg-gradient-to-r from-red-500 to-red-400'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                      }`}
                      style={{ width: `${getStatusProgress(job.status)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-700 font-medium">
                    {['pending', 'accepted', 'in-progress', 'completed'].map((s) => (
                      <span
                        key={s}
                        className={
                          job.status === s
                            ? s === 'completed' ? 'text-green-700 font-semibold' : 'text-blue-700 font-semibold'
                            : ''
                        }
                      >
                        {formatStatusLabel(s)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ReassignTechnicianModal
        job={selectedJob}
        isOpen={showReassignModal}
        onClose={() => {
          setShowReassignModal(false);
          setSelectedJob(null);
        }}
        onSuccess={() => fetchJobs(filter)}
      />
    </div>
  );
};

export default AllJobs;
