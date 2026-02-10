const crypto = require('crypto');
const { Booking, Payment, Notification } = require('../models');

const appendQueryParams = (baseUrl, params) => {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  return url.toString();
};

const computeSplit = (amount) => {
  const numericAmount = Number(amount || 0);
  const platformFee = Number((numericAmount * 0.05).toFixed(2));
  const technicianAmount = Number((numericAmount - platformFee).toFixed(2));
  return { numericAmount, platformFee, technicianAmount };
};

const readJsonOrText = async (response) => {
  const rawText = await response.text();
  try {
    return {
      parsed: JSON.parse(rawText),
      rawText,
    };
  } catch (_) {
    return {
      parsed: null,
      rawText,
    };
  }
};

const getOwnedCompletedBooking = async (bookingId, customerId) => {
  const parsedBookingId = Number.parseInt(String(bookingId || '').split('?')[0], 10);
  if (!Number.isInteger(parsedBookingId) || parsedBookingId <= 0) {
    return { error: { code: 400, message: 'Invalid bookingId' } };
  }

  const booking = await Booking.findOne({
    where: {
      id: parsedBookingId,
      customer_id: customerId,
    },
  });

  if (!booking) {
    return { error: { code: 404, message: 'Booking not found' } };
  }

  if (!['completed', 'in-progress'].includes(booking.status)) {
    return { error: { code: 409, message: 'Payment is allowed only after work is marked done' } };
  }

  return { booking };
};

const ensurePaymentForBooking = async (booking) => {
  let payment = await Payment.findOne({ where: { booking_id: booking.id } });

  if (!payment) {
    const { numericAmount, platformFee, technicianAmount } = computeSplit(booking.total_amount);
    payment = await Payment.create({
      booking_id: booking.id,
      amount: numericAmount,
      status: 'pending',
      payment_method: 'cash',
      platform_fee: platformFee,
      technician_amount: technicianAmount,
    });
  }

  return payment;
};

const syncBookingWithCompletedPayment = async (payment) => {
  if (String(payment?.status || '').toLowerCase() !== 'completed') {
    return null;
  }

  const booking = await Booking.findByPk(payment.booking_id);
  if (booking && booking.status !== 'completed') {
    await booking.update({ status: 'completed' });
  }

  return booking;
};

const getPaymentForBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const owned = await getOwnedCompletedBooking(bookingId, req.user.id);
    if (owned.error) {
      return res.status(owned.error.code).json({ success: false, message: owned.error.message });
    }

    const payment = await ensurePaymentForBooking(owned.booking);
    await syncBookingWithCompletedPayment(payment);

    return res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Get payment for booking error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const preparePaymentForBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const owned = await getOwnedCompletedBooking(bookingId, req.user.id);
    if (owned.error) {
      return res.status(owned.error.code).json({ success: false, message: owned.error.message });
    }

    const payment = await ensurePaymentForBooking(owned.booking);
    await syncBookingWithCompletedPayment(payment);

    return res.json({
      success: true,
      message: 'Payment record ready',
      data: payment,
    });
  } catch (error) {
    console.error('Prepare payment for booking error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const markPaymentCompleted = async ({ payment, paymentMethod, transactionId, req }) => {
  await payment.update({
    status: 'completed',
    payment_method: paymentMethod,
    transaction_id: transactionId || payment.transaction_id,
  });

  const booking = await Booking.findByPk(payment.booking_id);
  if (booking) {
    if (booking.status !== 'completed') {
      await booking.update({ status: 'completed' });
    }

    try {
      await Notification.create({
        user_id: booking.customer_id,
        type: 'payment_received',
        title: 'Payment Successful',
        message: `Payment for booking #${booking.id} was completed successfully.`,
        icon: 'dollar-sign',
        color: 'green',
        is_read: false,
      });

      if (booking.technician_id) {
        await Notification.create({
          user_id: booking.technician_id,
          type: 'payment_received',
          title: 'Payment Released',
          message: `Payment for booking #${booking.id} was completed by customer.`,
          icon: 'dollar-sign',
          color: 'green',
          is_read: false,
        });
      }
    } catch (notificationError) {
      // Do not fail payment verification if notification persistence has issues.
      console.error('Payment notification create error:', notificationError.message);
    }

    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${booking.customer_id}`).emit('notification:new', {
          type: 'payment_received',
          title: 'Payment Successful',
          message: `Payment for booking #${booking.id} was completed successfully.`,
        });
        if (booking.technician_id) {
          io.to(`user_${booking.technician_id}`).emit('notification:new', {
            type: 'payment_received',
            title: 'Payment Released',
            message: `Payment for booking #${booking.id} was completed by customer.`,
          });
        }
        io.to('role_admin').emit('notification:new', {
          type: 'payment_received',
          title: 'Payment Completed',
          message: `Customer paid booking #${booking.id}.`,
        });
      }
    } catch (socketError) {
      console.error('Payment notification socket emit error:', socketError.message);
    }
  }
};

const ensureProviderOwnership = ({ payment, provider, transactionId }) => {
  const activeMethod = String(payment.payment_method || '').toLowerCase();
  const activeTransaction = String(payment.transaction_id || '');

  // If another provider attempt is currently active, reject stale callback verification.
  if (activeMethod && activeMethod !== 'cash' && activeMethod !== provider) {
    return {
      error: {
        code: 409,
        message: `Another payment attempt is active via ${activeMethod}. Please retry with ${activeMethod} or re-initiate ${provider}.`,
      },
    };
  }

  // If a transaction id is known and does not match, this callback is stale.
  if (activeTransaction && transactionId && activeTransaction !== String(transactionId)) {
    return {
      error: {
        code: 409,
        message: 'Payment attempt mismatch. This callback does not match the active payment attempt.',
      },
    };
  }

  return { ok: true };
};

const initiateEsewaPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    const owned = await getOwnedCompletedBooking(bookingId, req.user.id);
    if (owned.error) {
      return res.status(owned.error.code).json({ success: false, message: owned.error.message });
    }

    const payment = await ensurePaymentForBooking(owned.booking);
    if (payment.status === 'completed') {
      return res.status(409).json({ success: false, message: 'Payment already completed for this booking' });
    }

    const productCode = process.env.ESEWA_PRODUCT_CODE;
    const secretKey = process.env.ESEWA_SECRET_KEY;
    const baseUrl = process.env.ESEWA_BASE_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
    const successBaseUrl = process.env.ESEWA_SUCCESS_URL;
    const failureBaseUrl = process.env.ESEWA_FAILURE_URL;

    if (!productCode || !secretKey || !successBaseUrl || !failureBaseUrl) {
      return res.status(500).json({
        success: false,
        message: 'Missing eSewa env config. Set ESEWA_PRODUCT_CODE, ESEWA_SECRET_KEY, ESEWA_SUCCESS_URL, ESEWA_FAILURE_URL',
      });
    }

    const transactionUuid = `bk-${owned.booking.id}-${Date.now()}`;
    const totalAmount = Number(payment.amount).toFixed(2);
    const signedFieldNames = 'total_amount,transaction_uuid,product_code';
    const signaturePayload = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(signaturePayload)
      .digest('base64');

    // eSewa appends callback query params itself. Keep return URLs clean to avoid malformed nested query values.
    const successUrl = successBaseUrl;
    const failureUrl = failureBaseUrl;

    await payment.update({
      status: 'pending',
      payment_method: 'esewa',
      transaction_id: transactionUuid,
    });

    return res.json({
      success: true,
      data: {
        provider: 'esewa',
        paymentUrl: baseUrl,
        payload: {
          amount: totalAmount,
          tax_amount: '0',
          total_amount: totalAmount,
          transaction_uuid: transactionUuid,
          product_code: productCode,
          product_service_charge: '0',
          product_delivery_charge: '0',
          success_url: successUrl,
          failure_url: failureUrl,
          signed_field_names: signedFieldNames,
          signature,
        },
      },
    });
  } catch (error) {
    console.error('Initiate eSewa payment error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const verifyEsewaPayment = async (req, res) => {
  try {
    const { bookingId, data } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    const owned = await getOwnedCompletedBooking(bookingId, req.user.id);
    if (owned.error) {
      return res.status(owned.error.code).json({ success: false, message: owned.error.message });
    }

    const payment = await ensurePaymentForBooking(owned.booking);
    if (payment.status === 'completed') {
      await syncBookingWithCompletedPayment(payment);
      return res.json({ success: true, message: 'Payment already verified', data: payment });
    }

    const productCode = process.env.ESEWA_PRODUCT_CODE;
    const statusUrl = process.env.ESEWA_STATUS_URL || 'https://rc-epay.esewa.com.np/api/epay/transaction/status/';

    if (!productCode) {
      return res.status(500).json({ success: false, message: 'Missing ESEWA_PRODUCT_CODE in env' });
    }

    let decodedPayload = {};
    if (data) {
      try {
        // URL query parsing can transform '+' to spaces, which breaks base64 decoding.
        let normalizedData = String(data).replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/');
        const remainder = normalizedData.length % 4;
        if (remainder > 0) {
          normalizedData = normalizedData.padEnd(normalizedData.length + (4 - remainder), '=');
        }
        decodedPayload = JSON.parse(Buffer.from(normalizedData, 'base64').toString('utf8'));
      } catch (decodeError) {
        decodedPayload = {};
      }
    }

    const transactionUuid = req.body.transaction_uuid || decodedPayload.transaction_uuid ||
      (String(payment.payment_method || '').toLowerCase() === 'esewa' ? payment.transaction_id : null);
    const totalAmount = Number(req.body.total_amount || decodedPayload.total_amount || payment.amount).toFixed(2);

    if (!transactionUuid) {
      return res.status(400).json({ success: false, message: 'transaction_uuid is required for eSewa verification' });
    }

    const providerOwnership = ensureProviderOwnership({
      payment,
      provider: 'esewa',
      transactionId: transactionUuid,
    });
    if (providerOwnership.error) {
      return res.status(providerOwnership.error.code).json({ success: false, message: providerOwnership.error.message });
    }

    // Fast-path fallback for callback payloads that already confirm completion.
    const callbackStatus = String(decodedPayload.status || req.body.status || '').toUpperCase();
    if (callbackStatus === 'COMPLETE' && String(decodedPayload.transaction_uuid || transactionUuid) === String(transactionUuid)) {
      await markPaymentCompleted({
        payment,
        paymentMethod: 'esewa',
        transactionId: decodedPayload.transaction_code || transactionUuid,
        req,
      });

      return res.json({
        success: true,
        message: 'eSewa payment verified successfully (callback)',
        data: decodedPayload,
      });
    }

    const lookupUrl = `${statusUrl}?product_code=${encodeURIComponent(productCode)}&total_amount=${encodeURIComponent(totalAmount)}&transaction_uuid=${encodeURIComponent(transactionUuid)}`;
    const lookupRes = await fetch(lookupUrl, { method: 'GET' });
    const { parsed: lookupData, rawText } = await readJsonOrText(lookupRes);

    if (!lookupRes.ok) {
      return res.status(400).json({
        success: false,
        message: 'eSewa verification request failed',
        data: lookupData || { raw: rawText },
      });
    }

    if (lookupData && String(lookupData.status || '').toUpperCase() === 'COMPLETE') {
      await markPaymentCompleted({
        payment,
        paymentMethod: 'esewa',
        transactionId: lookupData.ref_id || transactionUuid,
        req,
      });

      return res.json({
        success: true,
        message: 'eSewa payment verified successfully',
        data: lookupData,
      });
    }

    // Fallback: trust callback payload status when status endpoint is unavailable or non-JSON.
    if (String(decodedPayload.status || '').toUpperCase() === 'COMPLETE') {
      await markPaymentCompleted({
        payment,
        paymentMethod: 'esewa',
        transactionId: decodedPayload.transaction_code || transactionUuid,
        req,
      });

      return res.json({
        success: true,
        message: 'eSewa payment verified successfully (callback fallback)',
        data: decodedPayload,
      });
    }

    await payment.update({ status: 'failed', payment_method: 'esewa', transaction_id: transactionUuid });
    return res.status(400).json({
      success: false,
      message: 'eSewa payment verification failed',
      data: lookupData || decodedPayload || { raw: rawText },
    });
  } catch (error) {
    console.error('Verify eSewa payment error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const initiateKhaltiPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    const owned = await getOwnedCompletedBooking(bookingId, req.user.id);
    if (owned.error) {
      return res.status(owned.error.code).json({ success: false, message: owned.error.message });
    }

    const payment = await ensurePaymentForBooking(owned.booking);
    if (payment.status === 'completed') {
      return res.status(409).json({ success: false, message: 'Payment already completed for this booking' });
    }

    const secretKey = process.env.KHALTI_SECRET_KEY;
    const initiateUrl = process.env.KHALTI_INITIATE_URL || 'https://dev.khalti.com/api/v2/epayment/initiate/';
    const websiteUrl = process.env.KHALTI_WEBSITE_URL || process.env.CLIENT_URL || 'http://localhost:5173';
    const successBaseUrl = process.env.KHALTI_SUCCESS_URL;
    const failureBaseUrl = process.env.KHALTI_FAILURE_URL;

    if (!secretKey || !successBaseUrl || !failureBaseUrl) {
      return res.status(500).json({
        success: false,
        message: 'Missing Khalti env config. Set KHALTI_SECRET_KEY, KHALTI_SUCCESS_URL, KHALTI_FAILURE_URL',
      });
    }

    const purchaseOrderId = `bk-${owned.booking.id}-${Date.now()}`;
    const amountInPaisa = Math.round(Number(payment.amount || 0) * 100);

    const returnUrl = appendQueryParams(successBaseUrl, {
      provider: 'khalti',
      bookingId: owned.booking.id,
    });
    const failureUrl = appendQueryParams(failureBaseUrl, {
      provider: 'khalti',
      bookingId: owned.booking.id,
    });

    const khaltiPayload = {
      return_url: returnUrl,
      website_url: websiteUrl,
      amount: amountInPaisa,
      purchase_order_id: purchaseOrderId,
      purchase_order_name: `Fixly Booking #${owned.booking.id}`,
      customer_info: {
        name: req.user.name || 'Fixly Customer',
        email: req.user.email || 'customer@fixly.local',
        phone: req.user.phone || '9800000000',
      },
      amount_breakdown: [
        {
          label: 'Service Charge',
          amount: amountInPaisa,
        },
      ],
      product_details: [
        {
          identity: String(owned.booking.id),
          name: 'Fixly Service Payment',
          total_price: amountInPaisa,
          quantity: 1,
          unit_price: amountInPaisa,
        },
      ],
      merchant_username: 'fixly',
      merchant_extra: `booking-${owned.booking.id}`,
    };

    const khaltiRes = await fetch(initiateUrl, {
      method: 'POST',
      headers: {
        Authorization: `Key ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(khaltiPayload),
    });

    const khaltiData = await khaltiRes.json();
    if (!khaltiRes.ok) {
      return res.status(400).json({
        success: false,
        message: 'Khalti initiate request failed',
        data: khaltiData,
      });
    }

    await payment.update({
      status: 'pending',
      payment_method: 'khalti',
      transaction_id: khaltiData.pidx || purchaseOrderId,
    });

    return res.json({
      success: true,
      data: {
        provider: 'khalti',
        pidx: khaltiData.pidx,
        paymentUrl: khaltiData.payment_url,
        expiresAt: khaltiData.expires_at,
        expiresIn: khaltiData.expires_in,
        failureUrl,
      },
    });
  } catch (error) {
    console.error('Initiate Khalti payment error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const verifyKhaltiPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    const owned = await getOwnedCompletedBooking(bookingId, req.user.id);
    if (owned.error) {
      return res.status(owned.error.code).json({ success: false, message: owned.error.message });
    }

    const payment = await ensurePaymentForBooking(owned.booking);
    if (payment.status === 'completed') {
      await syncBookingWithCompletedPayment(payment);
      return res.json({ success: true, message: 'Payment already verified', data: payment });
    }

    const secretKey = process.env.KHALTI_SECRET_KEY;
    const lookupUrl = process.env.KHALTI_LOOKUP_URL || 'https://dev.khalti.com/api/v2/epayment/lookup/';

    if (!secretKey) {
      return res.status(500).json({ success: false, message: 'Missing KHALTI_SECRET_KEY in env' });
    }

    const pidx = req.body.pidx || req.query.pidx ||
      (String(payment.payment_method || '').toLowerCase() === 'khalti' ? payment.transaction_id : null);
    if (!pidx) {
      return res.status(400).json({ success: false, message: 'pidx is required for Khalti verification' });
    }

    const providerOwnership = ensureProviderOwnership({
      payment,
      provider: 'khalti',
      transactionId: pidx,
    });
    if (providerOwnership.error) {
      return res.status(providerOwnership.error.code).json({ success: false, message: providerOwnership.error.message });
    }

    const lookupRes = await fetch(lookupUrl, {
      method: 'POST',
      headers: {
        Authorization: `Key ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pidx }),
    });
    const { parsed: lookupData, rawText } = await readJsonOrText(lookupRes);

    if (!lookupRes.ok) {
      return res.status(400).json({
        success: false,
        message: 'Khalti verification request failed',
        data: lookupData || { raw: rawText },
      });
    }

    const khaltiStatus = String(lookupData?.status || '').toUpperCase();
    if (khaltiStatus === 'COMPLETED') {
      await markPaymentCompleted({
        payment,
        paymentMethod: 'khalti',
        transactionId: pidx,
        req,
      });

      return res.json({
        success: true,
        message: 'Khalti payment verified successfully',
        data: lookupData,
      });
    }

    await payment.update({ status: 'failed', payment_method: 'khalti', transaction_id: pidx });
    return res.status(400).json({
      success: false,
      message: 'Khalti payment verification failed',
      data: lookupData,
    });
  } catch (error) {
    console.error('Verify Khalti payment error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getPaymentForBooking,
  preparePaymentForBooking,
  ensurePaymentForBooking,
  getOwnedCompletedBooking,
  markPaymentCompleted,
  initiateEsewaPayment,
  verifyEsewaPayment,
  initiateKhaltiPayment,
  verifyKhaltiPayment,
};
