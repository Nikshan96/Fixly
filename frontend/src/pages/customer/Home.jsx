import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../../services/api';
// Keeps existing image imports if needed for About/Stats sections
import aboutFixlyImg from '../../assets/about_fixly.jpg';
import { 
  Wrench, 
  Zap, 
  Hammer, 
  Fan, 
  PaintRoller, 
  Settings, 
  Award, 
  Clock, 
  DollarSign 
} from 'lucide-react';

const Home = ({ onServiceClick }) => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // Hardcoded services if API fails or for initial render (matching Landing.jsx icons)
  const defaultServices = [
    { id: 101, name: 'Plumber', icon: <Wrench className="w-12 h-12 text-blue-500" />, description: 'Fix leaks and pipe issues', base_price: 500 },
    { id: 102, name: 'Electrician', icon: <Zap className="w-12 h-12 text-yellow-500" />, description: 'Electrical repairs & installation', base_price: 600 },
    { id: 103, name: 'Carpenter', icon: <Hammer className="w-12 h-12 text-orange-500" />, description: 'Wood work & repairs', base_price: 700 },
    { id: 104, name: 'AC Repair', icon: <Fan className="w-12 h-12 text-cyan-500" />, description: 'AC maintenance & repair', base_price: 1200 },
    { id: 105, name: 'Painter', icon: <PaintRoller className="w-12 h-12 text-pink-500" />, description: 'Interior & exterior painting', base_price: 1500 },
    { id: 106, name: 'General Repair', icon: <Settings className="w-12 h-12 text-gray-500" />, description: 'All general repairs', base_price: 800 },
  ];

  // Helper to get icon based on service name with colorful background
  const getServiceIcon = (name) => {
    const lowerName = name?.toLowerCase() || '';
    let Icon = Settings;
    let colorClass = "bg-gray-100";

    if (lowerName.includes('plumb')) { Icon = Wrench; colorClass = "bg-blue-100"; }
    else if (lowerName.includes('electr')) { Icon = Zap; colorClass = "bg-yellow-100"; }
    else if (lowerName.includes('carpen') || lowerName.includes('wood')) { Icon = Hammer; colorClass = "bg-orange-100"; }
    else if (lowerName.includes('paint')) { Icon = PaintRoller; colorClass = "bg-pink-100"; }
    else if (lowerName.includes('ac') || lowerName.includes('air') || lowerName.includes('cool')) { Icon = Fan; colorClass = "bg-cyan-100"; }

    return (
      <div className={`p-4 rounded-full ${colorClass} inline-block`}>
        <Icon className="w-8 h-8 text-black" />
      </div>
    );
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await customerAPI.getServices();
        if (response.data.success && response.data.data.length > 0) {
           // We might want to map icons here if backend doesn't send React nodes
           setServices(response.data.data);
        } else {
           setServices(defaultServices);
        }
      } catch (err) {
        console.error('Failed to fetch services:', err);
        setServices(defaultServices);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  const handleBookNow = (service) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user || user.role !== 'customer') {
      navigate('/login');
      return;
    }

    onServiceClick({
      id: service.id,
      name: service.name,
      icon: service.icon,
      base_price: service.base_price,
      description: service.description,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section - From Landing.jsx */}
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-extrabold text-gray-800 mb-6 leading-tight">
            Welcome to <span className="text-blue-600">Fixly</span>
          </h1>
          <p className="text-2xl md:text-3xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            Your one-stop solution for all home repair and maintenance services.
            We connect you with skilled professionals who deliver quality work at your doorstep.
          </p>
          <div className="flex justify-center gap-4 flex-wrap mt-8">
             <button
            onClick={() => navigate('/services')}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors duration-300 shadow-lg"
          >
            Book a Service
          </button>
             <button
            onClick={() => navigate('/contact')}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-50 transition-colors duration-300 shadow-lg border border-blue-100"
          >
            Contact Us
          </button>
          </div>
        </div>
      </div>

      {/* Why Choose Fixly Section - From Landing.jsx */}
      <div className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-16">Why Choose Fixly?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center p-8 bg-gray-50 rounded-2xl hover:shadow-lg transition-all duration-300">
              <Award className="w-20 h-20 mx-auto mb-6 text-yellow-500" />
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Quality Assurance</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                All our technicians are verified professionals with years of experience.
                We ensure top-quality service for every job.
              </p>
            </div>
            <div className="text-center p-8 bg-gray-50 rounded-2xl hover:shadow-lg transition-all duration-300">
              <Clock className="w-20 h-20 mx-auto mb-6 text-blue-500" />
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Quick Response</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Emergency repairs? No problem. Our team responds quickly to get your
                home back to normal as soon as possible.
              </p>
            </div>
            <div className="text-center p-8 bg-gray-50 rounded-2xl hover:shadow-lg transition-all duration-300">
              <DollarSign className="w-20 h-20 mx-auto mb-6 text-green-500" />
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Affordable Pricing</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Transparent pricing with no hidden fees. Get the best value for your
                money with our competitive rates.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="bg-gray-50 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-4">Our Services</h2>
          <p className="text-center text-gray-600 mb-16 text-xl">Book professional help right at your doorstep</p>

          {loadingServices ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {services.map((service, index) => (
                <div
                  key={service.id || index}
                  className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center text-center group"
                >
                  <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    {/* Render Icon logic: Use helper to get consistent Lucide icons */}
                    {getServiceIcon(service.name)}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">{service.name}</h3>
                  <p className="text-gray-600 mb-6 flex-grow">{service.description}</p>
                  
                  <div className="w-full">
                     <p className="text-blue-600 font-bold mb-4 text-lg">
                      From NPR {service.base_price?.toLocaleString()}
                    </p>
                    <button
                      onClick={() => handleBookNow(service)}
                      className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition font-semibold text-lg"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* About Fixly Section (From Home.jsx) */}
      <div className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-16">About Fixly</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
             <div
                className="rounded-3xl shadow-2xl h-96 bg-cover bg-center transform hover:rotate-2 transition-transform duration-500"
                style={{ backgroundImage: `url(${aboutFixlyImg})` }}
              />
            <div className="bg-blue-50 rounded-3xl p-10 shadow-lg">
              <p className="text-gray-700 text-xl leading-relaxed mb-8">
                Fixly is Nepal's premier home service platform, connecting you with
                verified and trained professionals. We ensure quality service with
                free redo guarantee and secure payment options.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                  <p className="text-4xl font-bold text-blue-600 mb-2">1000+</p>
                  <p className="text-gray-600 font-medium">Services Done</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                  <p className="text-4xl font-bold text-blue-600 mb-2">500+</p>
                  <p className="text-gray-600 font-medium">Verified Staff</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;