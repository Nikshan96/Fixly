import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Wrench } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-fixly flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-8 text-center space-y-6">
        {/* 404 Icon */}
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg">
          <Wrench className="w-12 h-12 text-white" />
        </div>

        {/* Error Message */}
        <div>
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-white mb-2">Page Not Found</h2>
          <p className="text-white/70">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Home size={20} />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;