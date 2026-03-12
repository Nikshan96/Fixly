import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../../services/api';

// Import images directly from assets
import plumberImg from '../../assets/plumber.jpg';
import electricalImg from '../../assets/Electrical.jpg';
import carpenterImg from '../../assets/Carpenter.jpg';
import painterImg from '../../assets/panting.jpg';
import acImg from '../../assets/AC.jpg';
import cleaningImg from '../../assets/cleaning.jpg';
import servicesImg from '../../assets/services.jpg';

import { 
  Wrench, 
  Zap, 
  Hammer, 
  Fan, 
  PaintRoller, 
  Settings, 
} from 'lucide-react';

const Services = ({ onServiceClick }) => {
  const navigate = useNavigate();
  
  // Mapping service names to imported images
  const serviceImages = {
    'Plumber': plumberImg,
    'Electrician': electricalImg,
    'Carpenter': carpenterImg,
    'Painter': painterImg,
    'AC Repair': acImg,
    'Cleaning': cleaningImg,
  };

  const [services, setServices] = useState([
    {
      id: 1,
      name: "Plumber",
      description: "Fix leaks and pipe issues",
      base_price: 500,
      image: serviceImages['Plumber']
    },
    {
      id: 2,
      name: "Electrician",
      description: "Electrical repairs & installation",
      base_price: 600,
      image: serviceImages['Electrician']
    },
    {
      id: 3,
      name: "Carpenter",
      description: "Furniture repair and assembly",
      base_price: 700,
      image: serviceImages['Carpenter']
    },
    {
      id: 4,
      name: "Painter",
      description: "House painting services",
      base_price: 1500,
      image: serviceImages['Painter']
    },
    {
      id: 5,
      name: "AC Repair",
      description: "Air conditioner servicing",
      base_price: 1000,
      image: serviceImages['AC Repair']
    },
    {
      id: 6,
      name: "Cleaning",
      description: "Home cleaning services",
      base_price: 800,
      image: serviceImages['Cleaning']
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* 
  // Commenting out real API call for now to ensure services show up 
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await customerAPI.getServices();
        if (response.data?.success) {
          // Map API data to include local images if needed
          const apiServices = response.data.data.map(service => ({
            ...service,
            image: serviceImages[service.name] || servicesImg // Fallback
          }));
          setServices(apiServices);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);
  */

  const handleBookNow = (service) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    // If not logged in, redirect to login
    if (!token || !user) {
      navigate('/login');
      return;
    }

    if (onServiceClick) {
      onServiceClick(service);
    } else {
        console.warn('onServiceClick prop missing');
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-gray-50 pb-12">
      {/* Hero Section */}
      <div className="container mx-auto px-4 max-w-6xl mb-12">
        <div 
          className="bg-cover bg-center h-80 w-full rounded-2xl shadow-xl relative overflow-hidden flex flex-col justify-center items-center text-center"
          style={{ backgroundImage: `url(${servicesImg})` }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative z-10 p-6">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-lg">
              Our Services
            </h1>
            <p className="text-xl md:text-2xl font-medium text-white/90 drop-shadow-md max-w-2xl mx-auto">
              Professional services for all your home needs
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-4">Available Services</h2>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-20 bg-white rounded-lg shadow p-8">
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-white bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Services Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group border border-gray-100"
              >
                {/* Service Image */}
                <div className="h-48 overflow-hidden relative">
                  <div 
                    className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ 
                      backgroundImage: `url(${service.image || servicesImg})` 
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                    <span className="text-white font-medium p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      Book {service.name} Now
                    </span>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {service.name}
                    </h3>
                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                      ₹{service.base_price}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-6 flex-grow leading-relaxed">
                    {service.description}
                  </p>
                  
                  <button
                    onClick={() => handleBookNow(service)}
                    className="w-full bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-600 hover:text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 transform active:scale-95 shadow-sm hover:shadow-md"
                  >
                    Select Service
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;
