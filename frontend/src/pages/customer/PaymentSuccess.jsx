import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentAPI } from '../../services/api';

const decodeEsewaData = (rawData) => {
  if (!rawData) return {};
  try {
    let normalized = String(rawData).replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/');
    const remainder = normalized.length % 4;
    if (remainder > 0) {
      normalized = normalized.padEnd(normalized.length + (4 - remainder), '=');
    }
    const decoded = atob(normalized);
    return JSON.parse(decoded);
  } catch {
    return {};
  }
};

const extractBookingId = (candidate) => {
  const parsed = Number.parseInt(String(candidate || '').split('?')[0], 10);
  return Number.isInteger(parsed) && parsed > 0 ? String(parsed) : '';
};

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState({ loading: true, success: false, message: 'Verifying payment...' });

  const payload = useMemo(() => {
    const rawProvider = (searchParams.get('provider') || '').toLowerCase();
    const rawBookingId = searchParams.get('bookingId');
    const data = searchParams.get('data');
    const pidx = searchParams.get('pidx');
    const decodedEsewa = decodeEsewaData(data);

    const provider = rawProvider || (data ? 'esewa' : (pidx ? 'khalti' : ''));
    const bookingId = extractBookingId(rawBookingId) || extractBookingId(decodedEsewa.transaction_uuid?.match(/^bk-(\d+)-/)?.[1]);
    const transactionUuid = searchParams.get('transaction_uuid') || decodedEsewa.transaction_uuid;
    const totalAmount = searchParams.get('total_amount') || decodedEsewa.total_amount;

    return {
      provider,
      bookingId,
      data,
      pidx,
      transaction_uuid: transactionUuid,
      total_amount: totalAmount,
    };
  }, [searchParams]);

  useEffect(() => {
    const verify = async () => {
      try {
        if (!payload.bookingId || !payload.provider) {
          setState({ loading: false, success: false, message: 'Missing payment callback data' });
          return;
        }

        if (payload.provider === 'esewa') {
          await paymentAPI.verifyEsewa({
            bookingId: payload.bookingId,
            data: payload.data,
            transaction_uuid: payload.transaction_uuid,
            total_amount: payload.total_amount,
          });
          setState({ loading: false, success: true, message: 'eSewa payment verified successfully.' });
          return;
        }

        if (payload.provider === 'khalti') {
          await paymentAPI.verifyKhalti({
            bookingId: payload.bookingId,
            pidx: payload.pidx,
          });
          setState({ loading: false, success: true, message: 'Khalti payment verified successfully.' });
          return;
        }

        setState({ loading: false, success: false, message: 'Unsupported payment provider.' });
      } catch (error) {
        setState({
          loading: false,
          success: false,
          message: error.response?.data?.message || 'Payment verification failed. Please try again from My Bookings.',
        });
      }
    };

    verify();
  }, [payload]);

  return (
    <div className="pt-28 sm:pt-32 min-h-screen bg-gray-50 pb-8 sm:pb-12">
      <div className="container mx-auto max-w-xl px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8 text-center">
          {state.loading ? (
            <>
              <div className="mx-auto h-12 w-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
              <h1 className="mt-4 text-2xl font-bold text-blue-700">Verifying Payment</h1>
              <p className="text-gray-600 mt-2">Please wait while we confirm the transaction.</p>
            </>
          ) : state.success ? (
            <>
              <div className="mx-auto h-14 w-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl font-bold">✓</div>
              <h1 className="mt-4 text-2xl font-bold text-blue-700">Payment Successful</h1>
              <p className="text-gray-600 mt-2">{state.message}</p>
            </>
          ) : (
            <>
              <div className="mx-auto h-14 w-14 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-2xl font-bold">!</div>
              <h1 className="mt-4 text-2xl font-bold text-blue-700">Verification Failed</h1>
              <p className="text-gray-600 mt-2">{state.message}</p>
            </>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => navigate('/my-bookings')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition"
            >
              Go to My Bookings
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

export default PaymentSuccess;
