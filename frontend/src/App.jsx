import { useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter, Navigate, Outlet, Route, Routes,
  useLocation,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Home from './pages/customer/Home.jsx';
import Services from './pages/customer/Services.jsx';
import MyBookings from './pages/customer/MyBookings.jsx';
import CustomerMessages from './pages/customer/Messages.jsx';
import Contact from './pages/customer/Contact.jsx';
import Profile from './pages/customer/Profile.jsx';
import PaymentSuccess from './pages/customer/PaymentSuccess.jsx';
import PaymentFailure from './pages/customer/PaymentFailure.jsx';
import PaymentHistory from './pages/customer/PaymentHistory.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

import AdminLayout from './components/admin/common/layout/AdminLayout.jsx';
import Overview from './pages/admin/Overview.jsx';
import AllJobs from './pages/admin/AllJobs.jsx';
import AllTechnicians from './pages/admin/AllTeachnicians.jsx';
import HireTechnician from './pages/admin/HireTechnician.jsx';
import Messages from './pages/admin/Messages.jsx';
import Revenue from './pages/admin/Revenue.jsx';
import Payments from './pages/admin/Payments.jsx';
import Settings from './pages/admin/Settings.jsx';
import TechnicianDashboard from './pages/technician/Dashboard.jsx';

import Navbar from './components/customer/Navbar.jsx';
import Footer from './components/customer/Footer.jsx';
import BookingModal from './components/customer/BookingModal.jsx';
import { connectSocket, disconnectSocket } from './services/socket';

const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); }
  catch { return null; }
};

const getRoleHome = (role) => {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'technician') return '/technician/dashboard';
  return '/';
};

const useAuth = () => {
  const readAuth = () => {
    const token = localStorage.getItem('token');
    const user = getStoredUser();
    return { token, user, isLoggedIn: Boolean(token && user) };
  };
  const [auth, setAuth] = useState(readAuth);

  useEffect(() => {
    const sessionKey = 'fixly_session_active';
    if (!sessionStorage.getItem(sessionKey)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.setItem(sessionKey, '1');
      setAuth({ token: null, user: null, isLoggedIn: false });
    }
    const syncAuth = () => setAuth(readAuth());
    window.addEventListener('storage', syncAuth);
    window.addEventListener('focus', syncAuth);
    window.addEventListener('auth-changed', syncAuth);
    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('focus', syncAuth);
      window.removeEventListener('auth-changed', syncAuth);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth({ token: null, user: null, isLoggedIn: false });
  };

  return { ...auth, logout, refreshAuth: () => setAuth(readAuth()) };
};

const CustomerOrPublicRoute = ({ children, auth }) => {
  const liveUser = getStoredUser() || auth?.user;
  if (liveUser?.role && liveUser.role !== 'customer')
    return <Navigate to={getRoleHome(liveUser.role)} replace />;
  return children;
};

const ProtectedRoute = ({ allowedRoles, children, auth }) => {
  const location = useLocation();
  const liveToken = localStorage.getItem('token') || auth?.token;
  const liveUser = getStoredUser() || auth?.user;
  if (!liveToken || !liveUser) return <Navigate to="/login" replace state={{ from: location }} />;
  if (allowedRoles && !allowedRoles.includes(liveUser.role))
    return <Navigate to={getRoleHome(liveUser.role)} replace />;
  return children;
};

const CustomerProtectedRoute = ({ children, auth }) => {
  const location = useLocation();
  const liveToken = localStorage.getItem('token') || auth?.token;
  const liveUser = getStoredUser() || auth?.user;
  if (!liveToken || !liveUser) return <Navigate to="/login" replace state={{ from: location }} />;
  if (liveUser.role !== 'customer') return <Navigate to={getRoleHome(liveUser.role)} replace />;
  return children;
};

// With Navbar + Footer
const PublicLayout = ({ onServiceClick }) => (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <Navbar />
    <main className="flex-1"><Outlet context={{ onServiceClick }} /></main>
    <Footer />
  </div>
);

function App() {
  const auth = useAuth();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setIsBookingModalOpen(true);
  };

  const modalService = useMemo(() => selectedService || null, [selectedService]);

  useEffect(() => {
    if (auth?.token) {
      connectSocket(auth.token);
    } else {
      disconnectSocket();
    }
    return () => disconnectSocket();
  }, [auth?.token]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect /home to / */}
        <Route path="/home" element={<Navigate to="/" replace />} />

        {/* Customer pages — with Navbar + Footer */}
        <Route element={<PublicLayout onServiceClick={handleServiceClick} />}>
          <Route path="/" element={
            <CustomerOrPublicRoute auth={auth}>
              <Home onServiceClick={handleServiceClick} />
            </CustomerOrPublicRoute>
          } />
          <Route path="/services" element={
            <CustomerOrPublicRoute auth={auth}>
              <Services onServiceClick={handleServiceClick} />
            </CustomerOrPublicRoute>
          } />
          <Route path="/contact" element={
            <CustomerOrPublicRoute auth={auth}>
              <Contact />
            </CustomerOrPublicRoute>
          } />
          <Route path="/my-bookings" element={
            <CustomerProtectedRoute auth={auth}>
              <MyBookings />
            </CustomerProtectedRoute>
          } />
          <Route path="/messages" element={
            <CustomerProtectedRoute auth={auth}>
              <CustomerMessages />
            </CustomerProtectedRoute>
          } />
          <Route path="/profile" element={
            <CustomerProtectedRoute auth={auth}>
              <Profile />
            </CustomerProtectedRoute>
          } />
          <Route path="/payment-history" element={
            <CustomerProtectedRoute auth={auth}>
              <PaymentHistory />
            </CustomerProtectedRoute>
          } />
          <Route path="/payment/success" element={
            <CustomerProtectedRoute auth={auth}>
              <PaymentSuccess />
            </CustomerProtectedRoute>
          } />
          <Route path="/payment/failure" element={
            <CustomerProtectedRoute auth={auth}>
              <PaymentFailure />
            </CustomerProtectedRoute>
          } />
        </Route>

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']} auth={auth}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Overview />} />
          <Route path="jobs" element={<AllJobs />} />
          <Route path="technicians" element={<AllTechnicians />} />
          <Route path="hire" element={<HireTechnician />} />
          <Route path="messages" element={<Messages />} />
          <Route path="revenue" element={<Revenue />} />
          <Route path="payments" element={<Payments />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Technician */}
        <Route path="/technician/dashboard" element={
          <ProtectedRoute allowedRoles={['technician']} auth={auth}>
            <TechnicianDashboard />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <BookingModal
        isOpen={isBookingModalOpen}
        service={modalService}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={() => {}}
      />

      <Toaster position="top-right" toastOptions={{ duration: 2500 }} />
    </BrowserRouter>
  );
}

export default App;
