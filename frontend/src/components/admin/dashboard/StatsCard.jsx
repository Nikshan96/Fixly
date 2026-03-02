const StatsCard = ({ title, value, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    orange: 'from-blue-500 to-blue-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-amber-500',
  };

  return (
    <div className="admin-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-800 text-sm font-medium mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${colorClasses[color] || colorClasses.blue} flex items-center justify-center`}>
          <Icon size={28} className="text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;