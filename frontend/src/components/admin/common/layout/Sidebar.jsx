import { Link, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  DollarSign, 
  UserPlus,
  MessageCircle,
  Settings
} from 'lucide-react';

const Sidebar = () => {
  const navigation = [
    {
      name: 'Overview',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'All Jobs',
      path: '/admin/jobs',
      icon: Briefcase,
    },
    {
      name: 'All Technicians',
      path: '/admin/technicians',
      icon: Users,
    },
    {
      name: 'Revenue',
      path: '/admin/revenue',
      icon: DollarSign,
    },
    {
      name: 'Payments',
      path: '/admin/payments',
      icon: DollarSign,
    },
    {
      name: 'Hire New Technician',
      path: '/admin/hire',
      icon: UserPlus,
    },
    {
      name: 'Messages',
      path: '/admin/messages',
      icon: MessageCircle,
    },
    {
      name: 'Settings',
      path: '/admin/settings',
      icon: Settings,
    },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link to="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200">
            <img src="/fixly-logo.jpeg" alt="Fixly" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-gray-800 font-bold text-xl">Fixly</h1>
            <p className="text-gray-700 text-sm font-medium">Admin Dashboard</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all border-l-4 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-blue-600'
                    : 'text-gray-700 border-transparent hover:bg-blue-100 hover:text-gray-900'
                }`
              }
            >
              <Icon size={20} />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-gray-700 text-sm text-center">
          <p>© 2026 Fixly</p>
          <p>Admin Panel v1.0</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;