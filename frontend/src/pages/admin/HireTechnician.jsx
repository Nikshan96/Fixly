import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { AlertCircle, Upload, X } from 'lucide-react';

const HireTechnician = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    services: [],
    bank_name: '',
    account_number: '',
    account_holder_name: '',
  });
  
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await adminAPI.getAllServices();
      if (response.data.success) {
        setServices(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(id => id !== serviceId)
        : [...prev.services, serviceId]
    }));
    setError('');
    setSuccess('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.phone) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.services.length === 0) {
      setError('Please select at least one service');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('address', formData.address);
      submitData.append('services', JSON.stringify(formData.services));
      submitData.append('bank_name', formData.bank_name);
      submitData.append('account_number', formData.account_number);
      submitData.append('account_holder_name', formData.account_holder_name);
      
      if (profileImage) {
        submitData.append('profile_image', profileImage);
      }

      const response = await adminAPI.createTechnician(submitData);

      if (response.data.success) {
        setSuccess('Technician added successfully. Notification sent to admin panel.');

        // Don't show success toast - notification will appear in dropdown instead

        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          services: [],
          bank_name: '',
          account_number: '',
          account_holder_name: '',
        });
        setProfileImage(null);
        setImagePreview(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create technician');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto admin-page">
      {/* Header */}
      <div>
        <h1 className="admin-page-title mb-2">Hire New Technician</h1>
        <p className="admin-page-subtitle">Add a new service provider to your platform</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={24} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-green-600" size={24} />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="admin-card p-6 space-y-6">
        {/* Profile Picture Upload */}
        <div>
          <h2 className="admin-section-title mb-4">Profile Picture (Optional)</h2>
          <div className="flex items-center gap-6">
            {/* Preview */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span>{formData.name ? formData.name.charAt(0).toUpperCase() : '?'}</span>
              )}
            </div>

            {/* Upload Button */}
            <div className="flex-1">
              {!imagePreview ? (
                <label className="btn-secondary-light cursor-pointer inline-flex items-center gap-2">
                  <Upload size={18} />
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <button
                  type="button"
                  onClick={removeImage}
                  className="btn-secondary-light inline-flex items-center gap-2"
                >
                  <X size={18} />
                  Remove Photo
                </button>
              )}
              <p className="text-gray-700 text-sm font-medium mt-2">
                Upload JPG, PNG, or GIF (max 5MB).
              </p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div>
          <h2 className="admin-section-title mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter technician name"
                className="admin-input"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Contact Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+977 98XXXXXXXX"
                className="admin-input"
                required
              />
              <p className="text-gray-700 text-sm mt-1">Example: 9876543210</p>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className="admin-input"
                required
              />
              <p className="text-gray-700 text-sm mt-1">Default technician password: Technician@123</p>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter address"
                className="admin-input"
              />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div>
          <h2 className="admin-section-title mb-4">Bank Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Bank Name
              </label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
                placeholder="e.g., Nepal Bank Limited"
                className="admin-input"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Account Number
              </label>
              <input
                type="text"
                name="account_number"
                value={formData.account_number}
                onChange={handleChange}
                placeholder="Enter account number"
                className="admin-input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Account Holder Name
              </label>
              <input
                type="text"
                name="account_holder_name"
                value={formData.account_holder_name}
                onChange={handleChange}
                placeholder="Name as per bank account"
                className="admin-input"
              />
            </div>
          </div>
          <p className="text-gray-700 text-sm mt-2">
            Bank details are used for monthly payout transfers.
          </p>
        </div>

        {/* Services */}
        <div>
          <h2 className="admin-section-title mb-4">Services / Specializations *</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => handleServiceToggle(service.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  formData.services.includes(service.id)
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 bg-white hover:border-blue-300'
                }`}
              >
                <div className="text-2xl mb-2">{service.icon}</div>
                <div className="text-gray-800 font-medium">{service.name}</div>
              </button>
            ))}
          </div>
          {formData.services.length === 0 && (
            <p className="text-red-400 text-sm mt-2">Please select at least one service</p>
          )}
        </div>

        {/* Password Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-700 font-semibold mb-2">Auto-generated Password</h3>
          <p className="text-gray-800 text-sm">
            Password will be generated upon submission: <strong>Technician@123</strong>
          </p>
          <p className="text-gray-700 text-sm mt-1">
            Technician can change this password after first login
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Hiring Technician...' : 'Hire Technician'}
        </button>
      </form>
    </div>
  );
};

export default HireTechnician;