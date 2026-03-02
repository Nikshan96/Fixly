import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronDown, Menu, X, BookOpen, Settings, DollarSign } from 'lucide-react';
import NotificationsDropdown from '../../pages/customer/NotificationsDropdown';
import { getImageUrl } from '../../utils/imageHelper';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); }
      catch { setUser(null); }
    } else {
      setUser(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowDropdown(false);
    navigate('/');
  };

  const isActive = (path) =>
    location.pathname === path
      ? 'text-blue-600 font-bold border-b-2 border-blue-600'
      : 'text-gray-700 hover:text-blue-600';

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/services', label: 'Services' },
    { to: '/my-bookings', label: 'My Bookings' },
    ...(user?.role === 'customer' ? [{ to: '/messages', label: 'Messages' }] : []),
    ...(user?.role === 'customer' ? [{ to: '/payment-history', label: 'Payments' }] : []),
    { to: '/contact', label: 'Contact' },
  ];

  const logoTarget = user?.role === 'customer' ? '/home' : '/';

  return (
    <nav className="bg-white shadow-md fixed w-full top-0 left-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to={logoTarget} className="flex items-center gap-2">
          <img src="/fixly-logo.jpeg" alt="Fixly" className="w-9 h-9 object-contain rounded-lg" />
          <span className="text-2xl font-bold text-blue-600">Fixly</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`transition font-medium text-sm pb-1 ${isActive(link.to)}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              {/* Notifications Bell */}
              <NotificationsDropdown />

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-full transition ml-1"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                    {user.profile_image ? (
                      <img
                        src={getImageUrl(user.profile_image)}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{user.name?.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                  </div>
                  <span className="text-gray-800 font-semibold text-sm max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown size={14} className="text-gray-500" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-[9999]">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-gray-800 font-bold text-sm truncate">{user.name}</p>
                      <p className="text-gray-500 text-xs truncate">{user.email}</p>
                    </div>

                    {/* My Bookings */}
                    <Link
                      to="/my-bookings"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition text-sm"
                    >
                      <BookOpen size={16} />
                      My Bookings
                    </Link>

                    {/* My Profile */}
                    <Link
                      to="/messages"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition text-sm"
                    >
                      <BookOpen size={16} />
                      Messages
                    </Link>

                    <Link
                      to="/payment-history"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition text-sm"
                    >
                      <DollarSign size={16} />
                      Payment History
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition text-sm"
                    >
                      <Settings size={16} />
                      My Profile
                    </Link>

                    <div className="border-t border-gray-100 my-1" />

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50 transition text-sm"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-blue-600 font-semibold hover:underline text-sm"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition font-semibold text-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-gray-700 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`block py-2 font-medium transition ${isActive(link.to)}`}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 pt-3">
            {user ? (
              <>
                <p className="text-gray-600 text-sm mb-3">
                  Logged in as <strong>{user.name}</strong>
                </p>
                <Link
                  to="/messages"
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-gray-700 font-medium"
                >
                  Messages
                </Link>
                <Link
                  to="/payment-history"
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-gray-700 font-medium"
                >
                  Payment History
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-gray-700 font-medium"
                >
                  My Profile
                </Link>
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="w-full text-left text-red-500 font-semibold py-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-3">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center border border-blue-600 text-blue-600 py-2 rounded-lg font-semibold"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center bg-blue-600 text-white py-2 rounded-lg font-semibold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;