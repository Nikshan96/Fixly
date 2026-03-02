import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="text-3xl font-bold text-blue-500 hover:text-blue-400 transition block mb-2">
              Fixly
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Nepal's trusted home service platform connecting you with verified professionals for all your household needs.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-white border-b border-gray-700 pb-2 inline-block">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-400 hover:text-blue-500 transition hover:translate-x-1 inline-block duration-300">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-400 hover:text-blue-500 transition hover:translate-x-1 inline-block duration-300">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="text-gray-400 hover:text-blue-500 transition hover:translate-x-1 inline-block duration-300">
                  My Bookings
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-blue-500 transition hover:translate-x-1 inline-block duration-300">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-white border-b border-gray-700 pb-2 inline-block">Popular Services</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/services" state={{ category: 'Plumbing' }} className="text-gray-400 hover:text-blue-500 transition hover:translate-x-1 inline-block duration-300">
                  Plumbing
                </Link>
              </li>
              <li>
                <Link to="/services" state={{ category: 'Electrical' }} className="text-gray-400 hover:text-blue-500 transition hover:translate-x-1 inline-block duration-300">
                  Electrical
                </Link>
              </li>
              <li>
                <Link to="/services" state={{ category: 'Carpentry' }} className="text-gray-400 hover:text-blue-500 transition hover:translate-x-1 inline-block duration-300">
                  Carpentry
                </Link>
              </li>
              <li>
                <Link to="/services" state={{ category: 'AC Repair' }} className="text-gray-400 hover:text-blue-500 transition hover:translate-x-1 inline-block duration-300">
                  AC Repair
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-white border-b border-gray-700 pb-2 inline-block">Get In Touch</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-400 group">
                <div className="bg-gray-800 p-2 rounded-full group-hover:bg-blue-900 transition-colors">
                  <Mail className="w-4 h-4 text-blue-500" />
                </div>
                <span>
                  <a href="mailto:Fixlyservices@gmail.com" className="hover:text-blue-400 transition">fixlyservices@gmail.com</a>
                </span>
              </li>
              <li className="flex items-center gap-3 text-gray-400 group">
                 <div className="bg-gray-800 p-2 rounded-full group-hover:bg-blue-900 transition-colors">
                  <Phone className="w-4 h-4 text-blue-500" />
                </div>
                <a href="tel:+97714567890" className="hover:text-blue-400 transition">+977 1 4567890</a>
              </li>
              <li className="flex items-start gap-3 text-gray-400 group">
                 <div className="bg-gray-800 p-2 rounded-full group-hover:bg-blue-900 transition-colors">
                  <MapPin className="w-4 h-4 text-blue-500" />
                </div>
                <span>Kathmandu, Nepal<br/><span className="text-xs text-gray-500">Serving all major cities</span></span>
              </li>
              <li className="flex items-center gap-3 text-gray-400 group">
                 <div className="bg-gray-800 p-2 rounded-full group-hover:bg-blue-900 transition-colors">
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                <span>Available 24/7</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-8"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p className="mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Fixly. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link to="#" className="hover:text-blue-500 transition">Privacy Policy</Link>
            <Link to="#" className="hover:text-blue-500 transition">Terms of Service</Link>
            <Link to="#" className="hover:text-blue-500 transition">Cookie Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
