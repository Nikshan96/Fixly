import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../../services/api';
import { X, MapPin, Calendar, Clock, FileText, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';

const BookingModal = ({ isOpen, service, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    booking_date: '',
    booking_time: '',
    location: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (jpg, png, etc).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo size must be 5MB or less.');
      return;
    }

    setPhotoFile(file);
    setError('');
  };

  if (!isOpen) return null;

  // Get today's date in YYYY-MM-DD for min date
  const today = new Date().toISOString().split('T')[0];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validate = () => {
    if (!formData.booking_date) return 'Please select a booking date.';
    if (!formData.booking_time) return 'Please select a booking time.';
    if (!formData.location.trim()) return 'Please enter your location/address.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check auth
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user) {
      onClose();
      navigate('/login');
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      let payload;
      if (photoFile) {
        payload = new FormData();
        payload.append('service_id', service.id);
        payload.append('booking_date', formData.booking_date);
        payload.append('booking_time', formData.booking_time);
        payload.append('location', formData.location.trim());
        if (formData.description.trim()) {
          payload.append('description', formData.description.trim());
        }
        payload.append('photo', photoFile);
      } else {
        payload = {
          service_id: service.id,
          booking_date: formData.booking_date,
          booking_time: formData.booking_time,
          location: formData.location.trim(),
          description: formData.description.trim() || undefined,
        };
      }

      const response = await customerAPI.createBooking(payload);

      if (response.data.success) {
        // Reset form
        setFormData({
          booking_date: '',
          booking_time: '',
          location: '',
          description: '',
        });
        setPhotoFile(null);
        onClose();
        // Notify parent to refresh if needed
        if (onSuccess) onSuccess(response.data.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to create booking. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-blue-700">
              Book {service?.name || 'Service'}
            </h2>
            {service?.base_price && (
              <p className="text-gray-500 text-sm mt-1">
                Starting from NPR {service.base_price.toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                <span className="flex items-center gap-1">
                  <Calendar size={15} />
                  Booking Date *
                </span>
              </label>
              <input
                type="date"
                name="booking_date"
                value={formData.booking_date}
                onChange={handleChange}
                min={today}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-gray-800"
                required
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                <span className="flex items-center gap-1">
                  <Clock size={15} />
                  Preferred Time *
                </span>
              </label>
              <input
                type="time"
                name="booking_time"
                value={formData.booking_time}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-gray-800"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              <span className="flex items-center gap-1">
                <MapPin size={15} />
                Your Address / Location *
              </span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Lazimpat, Kathmandu"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-gray-800"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              <span className="flex items-center gap-1">
                <FileText size={15} />
                Problem Description (Optional)
              </span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Describe your issue in detail..."
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-gray-800 resize-none"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Problem Photo (Optional)
            </label>
            <label className="block border border-dashed border-blue-300 bg-blue-50/50 rounded-xl p-4 cursor-pointer hover:bg-blue-50 transition">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-white border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                    {photoFile ? <ImageIcon size={18} /> : <Upload size={18} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {photoFile ? photoFile.name : 'Upload a problem photo'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {photoFile ? `${Math.round(photoFile.size / 1024)} KB selected` : 'PNG, JPG, WEBP up to 5MB'}
                    </p>
                  </div>
                </div>

                {photoFile && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setPhotoFile(null);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Note */}
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-blue-700 text-xs">
              💡 A technician will be assigned to your booking and will contact you before arrival.
              Booking status can be tracked in <strong>My Bookings</strong>.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-lg font-bold transition"
            >
              {loading ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;