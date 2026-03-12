import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';

const formatAmount = (value) => `NPR ${Number(value || 0).toLocaleString()}`;

const Payments = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPayments = async (status = '') => {
    try {
      setLoading(true);
      const response = await adminAPI.getPaymentHistory({ status, limit: 50 });
      if (response.data?.success) {
        setPayments(response.data.data?.payments || []);
      }
    } catch (error) {
      console.error('Failed to load admin payment history:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(statusFilter);
  }, [statusFilter]);

  return (
    <div className="admin-page">
      <div>
        <h1 className="admin-page-title mb-2">Payment History</h1>
        <p className="admin-page-subtitle">Monitor all gateway transactions and payout splits</p>
      </div>

      <div className="admin-card-pad">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="admin-section-title">All Payments</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {loading ? (
          <div className="text-gray-600">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="text-gray-600">No payments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 text-gray-600">
                  <th className="py-3 pr-4">Booking</th>
                  <th className="py-3 pr-4">Customer</th>
                  <th className="py-3 pr-4">Technician</th>
                  <th className="py-3 pr-4">Method</th>
                  <th className="py-3 pr-4">Amount</th>
                  <th className="py-3 pr-4">Platform (5%)</th>
                  <th className="py-3 pr-4">Technician (95%)</th>
                  <th className="py-3 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const booking = payment.booking || {};
                  const customer = booking.customer || {};
                  const technician = booking.technician || {};
                  const statusClass = payment.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : payment.status === 'failed'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700';

                  return (
                    <tr key={payment.id} className="border-b border-gray-100 text-gray-800">
                      <td className="py-3 pr-4 font-semibold">#{booking.id}</td>
                      <td className="py-3 pr-4">{customer.name || '-'}</td>
                      <td className="py-3 pr-4">{technician.name || '-'}</td>
                      <td className="py-3 pr-4">{payment.payment_method || '-'}</td>
                      <td className="py-3 pr-4">{formatAmount(payment.amount)}</td>
                      <td className="py-3 pr-4">{formatAmount(payment.platform_fee)}</td>
                      <td className="py-3 pr-4">{formatAmount(payment.technician_amount)}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                          {String(payment.status || 'pending').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
