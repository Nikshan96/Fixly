import { useState, useEffect, useRef } from 'react';
import { User, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationsDropdown from '../NotificationsDropdown';
import { getImageUrl } from '../../../../utils/imageHelper';

const Navbar = () => {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const adminData = JSON.parse(localStorage.getItem('user') || '{}');
  const adminName = adminData.name || 'Admin User';
  const adminPhoto = adminData.profile_image || null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-changed'));
    window.location.replace('/');
  };

  const getCurrentDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  // Auto-close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-[100]">
      <div className="flex items-center justify-between">
        {/* Welcome Section */}
        <div>
          <h2 className="text-blue-700 text-lg font-semibold">Welcome, {adminName}</h2>
          <p className="text-gray-700 text-sm font-medium">{getCurrentDate()}</p>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4 relative z-[101]">
          {/* Notifications */}
          <NotificationsDropdown />

          {/* Admin Profile */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-gray-700 text-sm font-medium hidden md:block">{adminName}</span>
              
              {/* Profile Picture */}
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden">
                {adminPhoto ? (
                  <img 
                    src={getImageUrl(adminPhoto)} 
                    alt={adminName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={20} className="text-white" />
                )}
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999]">
                <div className="p-2">
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      navigate('/admin/settings');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                  >
                    <Settings size={18} />
                    <span>Settings</span>
                  </button>

                  <div className="border-t border-gray-200 my-2" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/20 transition-colors text-red-400"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
