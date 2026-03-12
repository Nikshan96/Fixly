import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import StatsCard from '../../components/admin/dashboard/StatsCard';
import { Briefcase, Users, DollarSign, Clock } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const getLastMonthKeys = (months) => {
  const now = new Date();
  const keys = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    keys.push({
      monthKey,
      shortLabel: d.toLocaleString('en-US', { month: 'short' }),
    });
  }
  return keys;
};

const Overview = () => {
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeTechnicians: 0,
    monthlyRevenue: 0,
    pendingJobs: 0,
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [monthlyFinance, setMonthlyFinance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, jobsRes, monthlyRevenueRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getAllBookings({ limit: 5 }),
        adminAPI.getMonthlyRevenue({ months: 7 }),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      if (jobsRes.data.success) {
        setRecentJobs(jobsRes.data.data.bookings || []);
      }

      if (monthlyRevenueRes.data?.success) {
        setMonthlyFinance(monthlyRevenueRes.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const revenueSeries = (() => {
    const sourceMap = new Map(monthlyFinance.map((row) => [row.monthKey, row]));
    const slots = getLastMonthKeys(7).map(({ monthKey, shortLabel }) => {
      const row = sourceMap.get(monthKey);
      return {
        monthKey,
        shortLabel,
        amount: Number(row?.platformRevenue || 0),
        payments: Number(row?.completedPayments || 0),
      };
    });
    return slots;
  })();

  const revenueChartData = {
    labels: revenueSeries.map((item) => item.shortLabel),
    datasets: [
      {
        label: 'Platform Revenue (NPR)',
        data: revenueSeries.map((item) => Number(item.amount || 0)),
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        pointBackgroundColor: 'rgb(37, 99, 235)',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 3,
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#334155',
          font: { size: 12, weight: '600' },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `Revenue: ${formatCurrency(ctx.parsed.y || 0)}`,
          afterLabel: (ctx) => `Payments: ${revenueSeries[ctx.dataIndex]?.payments || 0}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#64748b',
          callback: (value) => formatCurrency(value),
        },
        grid: { color: 'rgba(148,163,184,0.2)' },
      },
      x: {
        ticks: { color: '#64748b' },
        grid: { display: false },
      },
    },
  };

  const getStatusBadge = (status) => {
    const styles = {
      'pending': 'bg-yellow-100 text-yellow-700',
      'accepted': 'bg-blue-100 text-blue-700',
      'in-progress': 'bg-blue-100 text-blue-700',
      'completed': 'bg-green-100 text-green-700',
      'cancelled': 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-700 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Page Title */}
      <div>
        <h1 className="admin-page-title mb-2">Dashboard Overview</h1>
        <p className="admin-page-subtitle">Track your platform's performance and metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Jobs"
          value={stats.totalJobs}
          icon={Briefcase}
          color="orange"
        />
        <StatsCard
          title="Active Techs"
          value={stats.activeTechnicians}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="Pending"
          value={stats.pendingJobs}
          icon={Clock}
          color="blue"
        />
      </div>

      {/* Revenue Trend Chart */}
      <div className="admin-card-pad">
        <h2 className="admin-section-title mb-6">Revenue Trend</h2>

        {revenueSeries.every((item) => item.amount <= 0) ? (
          <div className="h-64 flex items-center justify-center text-gray-700 text-sm">
            No completed payments yet. Revenue trend will appear after verified payments.
          </div>
        ) : (
          <div className="h-72 px-2">
            <Line data={revenueChartData} options={revenueChartOptions} />
          </div>
        )}
        
        <div className="mt-4 text-center">
          <p className="text-gray-800 text-sm font-medium">Monthly Revenue Trend (Last 7 Months)</p>
        </div>
      </div>

      {/* All Jobs Table */}
      <div className="admin-card-pad">
        <div className="flex items-center justify-between mb-6">
          <h2 className="admin-section-title">All Jobs</h2>
          {recentJobs.length > 0 && (
            <button 
              onClick={() => window.location.href = '/admin/jobs'}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All →
            </button>
          )}
        </div>

        {recentJobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-800 text-lg mb-4">No jobs found</p>
            <p className="text-gray-700 text-sm">Jobs will appear here once customers book services</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="admin-table-head text-left py-3 px-4">Customer</th>
                  <th className="admin-table-head text-left py-3 px-4">Service</th>
                  <th className="admin-table-head text-left py-3 px-4">Technician</th>
                  <th className="admin-table-head text-left py-3 px-4">Status</th>
                  <th className="admin-table-head text-left py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => (
                  <tr key={job.id} className="admin-table-row">
                    <td className="py-4 px-4">
                      <p className="text-gray-800 font-medium">{job.customer?.name || 'N/A'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-gray-700">{job.service?.name || 'N/A'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-gray-700">{job.technician?.name || 'Not Assigned'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`admin-chip capitalize ${getStatusBadge(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-gray-800 text-sm font-medium">{formatDate(job.createdAt)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview;
