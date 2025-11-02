const express = require('express');
const { config, missingRequiredConfig, toInteger } = require('../config/tribopay');
const { sanitizeCustomer } = require('../utils/normalizers');
const { createPixTransaction } = require('../services/tribopayClient');

const router = express.Router();

const cleanObject = (input) =>
  Object.entries(input || {}).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === '') {
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {});

const resolveAmount = (amount) => {
  const parsed = toInteger(amount, config.amount);
  return parsed > 0 ? parsed : config.amount;
};

const buildCartItem = (overrides = {}, amount) => {
  const productHash =
    overrides.product_hash || overrides.productHash || config.productHash;

  return {
    product_hash: productHash,
    title: overrides.title || config.transactionTitle,
    cover: overrides.cover ?? null,
    price: amount,
    quantity: overrides.quantity || 1,
    operation_type: overrides.operation_type || overrides.operationType || 1,
    tangible: overrides.tangible ?? false,
  };
};

const buildTracking = (body) => {
  const tracking = cleanObject({
    pix_key: body.pixKey || body.pix_key,
    reference: body.reference || body.referenceId,
  });

  if (body.tracking && typeof body.tracking === 'object') {
    return cleanObject({ ...body.tracking, ...tracking });
  }

  return tracking;
};

const buildPayload = (body = {}) => {
  const amount = resolveAmount(body.amount);
  const offerHash = body.offer_hash || body.offerHash || config.offerHash;
  const cartOverrides =
    Array.isArray(body.cart) && body.cart.length > 0 ? body.cart[0] : {};

  const customer = sanitizeCustomer({
    ...config.defaultCustomer,
    ...(body.customer || {}),
  });

  const payload = {
    amount,
    offer_hash: offerHash,
    payment_method: 'pix',
    customer,
    cart: [buildCartItem(cartOverrides, amount)],
    installments: 1,
    expire_in_days: body.expire_in_days || body.expireInDays || 1,
    transaction_origin: body.transaction_origin || body.transactionOrigin || 'api',
  };

  const tracking = buildTracking(body);
  if (Object.keys(tracking).length > 0) {
    payload.tracking = tracking;
  }

  const postbackUrl = body.postback_url || body.postbackUrl || config.postbackUrl;
  if (postbackUrl) {
    payload.postback_url = postbackUrl;
  }

  return payload;
};

const extractPixData = (transaction) => {
  if (!transaction) {
    return {};
  }

  const pixPayload = transaction.pix || transaction.pix_data || {};

  const copyPaste =
    pixPayload.copy_paste ||
    pixPayload.copy_paste_code ||
    pixPayload.code ||
    pixPayload.emv ||
    // Alguns provedores usam pix_url / pix_qr_code como campo com o EMV ou string do payload
    pixPayload.pix_url ||
    pixPayload.pix_qr_code ||
    transaction.copy_paste ||
    transaction.copy_paste_code ||
    transaction.code ||
    // também considerar campos top-level que alguns provedores retornam
    transaction.pix_url ||
    transaction.pix_qr_code ||
    pixPayload.payload ||
    transaction.payload;

  const qrCodeImage =
    pixPayload.qr_code_base64 ||
    pixPayload.qrcode_base64 ||
    pixPayload.qr_code_image ||
    pixPayload.qrcode_image ||
    pixPayload.qrCodeImage ||
    pixPayload.qr_code ||
    pixPayload.qrcode ||
    pixPayload.image ||
    pixPayload.image_base64 ||
    pixPayload.qr_code_url ||
    pixPayload.qrcode_url ||
    pixPayload.url ||
    pixPayload.image_url ||
    transaction.qr_code ||
    transaction.qr_code_base64 ||
    transaction.qrcode ||
    transaction.qr_code_image ||
    transaction.qrcode_image ||
    transaction.qrCodeImage ||
    transaction.qr_code_url ||
    transaction.qrcode_url ||
    transaction.image_base64 ||
    transaction.image_url;

  const expiresAt =
    pixPayload.expires_at ||
    pixPayload.expire_at ||
    transaction.expires_at ||
    transaction.expire_at;

  return cleanObject({
    copyPaste,
    qrCodeImage,
    expiresAt,
  });
};

router.post('/iof', async (req, res) => {
  const missingConfig = missingRequiredConfig();
  if (missingConfig.length > 0) {
    return res.status(500).json({
      success: false,
      message: 'Configuração TriboPay incompleta.',
      missing: missingConfig,
    });
  }

  try {
    const payload = buildPayload(req.body);
    if (!payload.offer_hash) {
      return res.status(400).json({
        success: false,
        message: 'O hash da oferta (offer_hash) é obrigatório.',
      });
    }
    const cartItem = payload.cart?.[0];
    if (!cartItem?.product_hash) {
      return res.status(400).json({
        success: false,
        message: 'O hash do produto (product_hash) é obrigatório.',
      });
    }

    const { data, status } = await createPixTransaction(payload);
    const pixData = extractPixData(data);

    return res.status(status || 201).json({
      success: true,
      payload,
      transaction: data,
      pix: pixData,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const apiMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Falha ao criar a transação PIX.';

    return res.status(status).json({
      success: false,
      message: apiMessage,
      errors: error.response?.data || null,
    });
  }
});

module.exports = router;
