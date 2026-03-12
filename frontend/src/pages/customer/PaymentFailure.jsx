import { useNavigate, useSearchParams } from 'react-router-dom';

const PaymentFailure = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message') || 'Payment could not be completed. You can try again from My Bookings.';

  return (
    <div className="pt-28 sm:pt-32 min-h-screen bg-gray-50 pb-8 sm:pb-12">
      <div className="container mx-auto max-w-xl px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-2xl font-bold">✕</div>
          <h1 className="mt-4 text-2xl font-bold text-blue-700">Payment Failed</h1>
          <p className="text-gray-600 mt-2">{message}</p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => navigate('/my-bookings')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition"
            >
              Retry from My Bookings
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg font-semibold transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;
