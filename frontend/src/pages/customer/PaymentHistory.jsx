import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../../services/api';

const formatAmount = (value) => `NPR ${Number(value || 0).toLocaleString()}`;

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await customerAPI.getMyPaymentHistory();
        if (response.data?.success) {
          setPayments(response.data.data || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load payment history');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="pt-28 sm:pt-32 min-h-screen bg-gray-50 pb-8 sm:pb-12">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-blue-700">Payment History</h1>
            <p className="text-gray-500 mt-1">Track all your completed and pending service payments</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/my-bookings')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Back to My Bookings
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-md p-10 text-center text-gray-600">Loading payments...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</div>
        ) : payments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-10 text-center text-gray-600">No payment records found yet.</div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => {
              const booking = payment.booking || {};
              const statusClass = payment.status === 'completed'
                ? 'bg-green-100 text-green-700 border-green-200'
                : payment.status === 'failed'
                ? 'bg-red-100 text-red-700 border-red-200'
                : 'bg-yellow-100 text-yellow-700 border-yellow-200';

              return (
                <div key={payment.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-gray-800">{booking.service?.name || 'Service Payment'}</p>
                      <p className="text-sm text-gray-500">Booking #{booking.id} • {booking.booking_date || 'N/A'}</p>
                    </div>
                    <span className={`inline-flex px-3 py-1 rounded-full border text-sm font-semibold ${statusClass}`}>
                      {String(payment.status || 'pending').toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 text-sm">
                    <div>
                      <p className="text-gray-500">Amount</p>
                      <p className="font-semibold text-gray-800">{formatAmount(payment.amount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Method</p>
                      <p className="font-semibold text-gray-800">{payment.payment_method || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Platform Fee</p>
                      <p className="font-semibold text-gray-800">{formatAmount(payment.platform_fee)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Technician Share</p>
                      <p className="font-semibold text-gray-800">{formatAmount(payment.technician_amount)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
