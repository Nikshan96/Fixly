import React from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import contactImg from '../../assets/contact.jpg';

const Contact = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you! We will contact you soon.');
  };

  return (
    <div className="pt-20 min-h-screen bg-gray-50 py-12">
      {/* Hero Section */}
      <div
        className="
          bg-cover 
          bg-center 
          h-72 
          w-full
          mb-12
          flex 
          flex-col 
          justify-center 
          items-center 
          text-center
          px-4
          rounded-lg
          shadow-lg
          max-w-6xl
          mx-auto
        "
        style={{ backgroundImage: `url(${contactImg})` }}
      >
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-lg">Get In Touch</h1>
        <p className="text-lg font-semibold text-white drop-shadow-md">We're here to help with any questions</p>
      </div>

      <div className="container mx-auto max-w-6xl px-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          
          {/* Contact Info */}
          <div>
            <h1 className="text-4xl font-bold text-blue-700 mb-8">Get In Touch</h1>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center gap-3 mb-2">
                  <Phone className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-blue-600">Phone</h3>
                </div>
                <p className="text-gray-700">+977 1 4567890</p>
                <p className="text-gray-600 text-sm">Available 24/7</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-blue-600">Email</h3>
                </div>
                <p className="text-gray-700">info@fixly.com</p>
                <p className="text-gray-700">support@fixly.com</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-blue-600">Location</h3>
                </div>
                <p className="text-gray-700">Kathmandu, Nepal</p>
                <p className="text-gray-600 text-sm">Serving all of Nepal</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                 <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-blue-600">Hours</h3>
                </div>
                <p className="text-gray-700">Open 24/7</p>
                <p className="text-gray-600 text-sm">Emergency services always available</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-blue-700 mb-6">Send us a Message</h2>
            
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg space-y-4">
              
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Phone</label>
                <input
                  type="tel"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="+977 98..."
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Message</label>
                <textarea
                  rows="5"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Your message..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Send Message
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Contact;
