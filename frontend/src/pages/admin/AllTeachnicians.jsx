import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { MessageCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../../utils/imageHelper';

const AllTechnicians = () => {
  const navigate = useNavigate();
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      const response = await adminAPI.getAllTechnicians();
      
      if (response.data.success) {
        setTechnicians(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching technicians:', error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceTabs = () => {
    const servicesMap = new Map();
    
    technicians.forEach(tech => {
      if (tech.services && Array.isArray(tech.services)) {
        tech.services.forEach(service => {
          if (!servicesMap.has(service.name)) {
            servicesMap.set(service.name, service.icon || '🔧');
          }
        });
      }
    });
    
    return Array.from(servicesMap.entries()).map(([name, icon]) => ({ name, icon }));
  };

  const serviceTabs = getServiceTabs();

  const filterByService = (techs) => {
    if (activeFilter === 'all') return techs;
    
    return techs.filter(tech => 
      tech.services && tech.services.some(service => 
        service.name.toLowerCase() === activeFilter.toLowerCase()
      )
    );
  };

  const filterBySearch = (techs) => {
    if (!searchQuery.trim()) return techs;
    
    const query = searchQuery.toLowerCase();
    return techs.filter(tech => 
      tech.name?.toLowerCase().includes(query) ||
      tech.email?.toLowerCase().includes(query) ||
      tech.phone?.includes(query)
    );
  };

  const filteredTechnicians = filterBySearch(filterByService(technicians));

  const calculateEarnings = (tech) => {
    return (tech.completed_jobs || 0) * 1000;
  };

  const handleContactTechnician = (tech) => {
    navigate('/admin/messages', { 
      state: { 
        openSupportTicket: true,
        technicianId: tech.id,
        technicianName: tech.name 
      } 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-700 text-xl">Loading technicians...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Header with Search */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-page-title mb-2">All Technicians</h1>
          <p className="admin-page-subtitle">Manage your service providers</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search technicians..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Service Category Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-4">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-6 py-2 rounded-t-lg text-sm font-medium transition-all ${
            activeFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:text-gray-900 hover:bg-blue-50'
          }`}
        >
          All
        </button>
        {serviceTabs.map((service, index) => (
          <button
            key={index}
            onClick={() => setActiveFilter(service.name)}
            className={`px-6 py-2 rounded-t-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeFilter === service.name
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:text-gray-900 hover:bg-blue-50'
            }`}
          >
            <span>{service.icon}</span>
            {service.name}
          </button>
        ))}
      </div>

      {/* Technicians Grid */}
      {filteredTechnicians.length === 0 ? (
        <div className="admin-card p-12 text-center">
          <p className="text-gray-800 text-lg">No technicians found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTechnicians.map((tech) => {
            const earnings = calculateEarnings(tech);
            const isActive = tech.is_active && tech.completed_jobs > 0;
            const status = isActive ? 'Active' : 'Available';
            
            return (
              <div key={tech.id} className="admin-card-pad hover:shadow-lg">
                {/* Header with Status Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{tech.name}</h3>
                    
                    {/* Profession Badge */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {tech.services && tech.services.length > 0 ? (
                        tech.services.map((service) => (
                          <span 
                            key={service.id}
                            className="admin-chip bg-blue-100 text-blue-700 text-sm"
                          >
                            {service.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-700 text-sm italic">No service assigned</span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <span className={`inline-block admin-chip ${
                      isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {status}
                    </span>
                  </div>

                  {/* Profile Picture */}
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    {(tech.profile_image || tech.profileImage) ? (
                      <img 
                        src={getImageUrl(tech.profile_image || tech.profileImage)}
                        alt={tech.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-2xl">
                        {tech.name ? tech.name.charAt(0).toUpperCase() : '?'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-gray-700 text-sm font-semibold mb-1">Total Jobs</p>
                    <p className="text-gray-800 text-xl font-bold">{tech.total_jobs || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-gray-700 text-sm font-semibold mb-1">Completed</p>
                    <p className="text-gray-800 text-xl font-bold">{tech.completed_jobs || 0}</p>
                  </div>
                </div>

                {/* Contact & Earnings */}
                <div className="space-y-2 mb-4">
                  <p className="text-gray-700 text-sm"><strong>Phone:</strong> {tech.phone || 'N/A'}</p>
                  <p className="text-blue-700 text-lg font-bold">
                    NPR {earnings.toLocaleString()}
                  </p>
                </div>

                {/* Contact Button */}
                <button 
                  onClick={() => handleContactTechnician(tech)}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2"
                >
                  <MessageCircle size={16} />
                  Contact
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AllTechnicians;
