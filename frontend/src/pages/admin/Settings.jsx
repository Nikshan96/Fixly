import { useMemo, useState } from 'react';
import { Upload, Check, AlertCircle, Lock, User as UserIcon, Mail, Phone, KeyRound } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { getImageUrl } from '../../utils/imageHelper';

const Settings = () => {
  const adminData = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);

  const [profileData, setProfileData] = useState({
    name: adminData.name || '',
    email: adminData.email || '',
    phone: adminData.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    adminData.profile_image ? getImageUrl(adminData.profile_image) : null
  );
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB.');
      return;
    }

    setError('');
    setProfileImage(file);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileLoading(true);
    setError('');
    setSuccess('');

    try {
      const submitData = new FormData();
      submitData.append('name', profileData.name);
      submitData.append('email', profileData.email);
      submitData.append('phone', profileData.phone);

      if (profileImage) {
        submitData.append('profile_image', profileImage);
      }

      const response = await adminAPI.updateProfile(submitData);
      if (response.data?.success) {
        const updatedUser = response.data.data;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        // Don't show success toast - notification will appear in dropdown instead
        setProfileImage(null);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordLoading(true);
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New password and confirm password do not match.');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      setPasswordLoading(false);
      return;
    }

    try {
      const response = await adminAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.data?.success) {
        // Don't show success toast - notification will appear in dropdown instead
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl admin-page">
      <div className="admin-card px-6 py-5">
        <h1 className="admin-page-title">Settings</h1>
        <p className="admin-page-subtitle mt-1 text-sm">Manage your profile information and account security.</p>
      </div>

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-3">
          <Check className="text-green-600" size={20} />
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <section id="profile" className="admin-card-pad">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/20 p-2">
            <UserIcon size={20} className="text-blue-700" />
          </div>
          <div>
            <h2 className="admin-section-title">Profile</h2>
            <p className="text-sm text-gray-800">Update your name, contact details, and profile image.</p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center overflow-hidden">
              {imagePreview ? (
                <img src={imagePreview} alt="Admin profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">{(profileData.name || 'A').charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors">
                <Upload size={16} />
                Upload picture
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
              <p className="mt-2 text-sm text-gray-700">PNG, JPG, GIF up to 5MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <UserIcon size={14} className="text-blue-600" />
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail size={14} className="text-blue-600" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Phone size={14} className="text-blue-600" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={profileData.phone}
                onChange={handleProfileChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={profileLoading}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {profileLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </section>

      <section className="admin-card-pad">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-amber-500/20 p-2">
            <Lock size={20} className="text-amber-700" />
          </div>
          <div>
            <h2 className="admin-section-title">Change Password</h2>
            <p className="text-sm text-gray-800">Use a strong password with at least 6 characters.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-2xl">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <KeyRound size={14} className="text-blue-600" />
              Current Password
            </label>
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <KeyRound size={14} className="text-blue-600" />
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              minLength={6}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <KeyRound size={14} className="text-blue-600" />
              Confirm New Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              minLength={6}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {passwordLoading ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default Settings;

