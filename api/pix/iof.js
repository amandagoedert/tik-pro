// Vercel Serverless Function: /api/pix/iof
// Esta função implementa a lógica mínima para criar a transação PIX na TriboPay
// e normalizar a resposta para o frontend.

const toInteger = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const cleanObject = (input) =>
  Object.entries(input || {}).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === '') return acc;
    acc[key] = value;
    return acc;
  }, {});

const extractPixData = (transaction) => {
  if (!transaction) return {};
  const pixPayload = transaction.pix || transaction.pix_data || {};

  const copyPaste =
    pixPayload.copy_paste ||
    pixPayload.copy_paste_code ||
    pixPayload.code ||
    pixPayload.emv ||
    pixPayload.pix_url ||
    pixPayload.pix_qr_code ||
    transaction.copy_paste ||
    transaction.copy_paste_code ||
    transaction.code ||
    transaction.pix_url ||
    transaction.pix_qr_code;

  const qrCodeImage =
    pixPayload.qr_code_base64 ||
    pixPayload.qrcode_base64 ||
    pixPayload.qr_code ||
    pixPayload.qrcode ||
    pixPayload.image ||
    pixPayload.image_base64 ||
    transaction.qr_code ||
    transaction.qr_code_base64 ||
    transaction.qrcode;

  const expiresAt =
    pixPayload.expires_at || pixPayload.expire_at || transaction.expires_at || transaction.expire_at;

  return cleanObject({ copyPaste, qrCodeImage, expiresAt });
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const TRIBO_BASE = process.env.TRIBOPAY_BASE_URL || 'https://api.tribopay.com.br/api/public/v1';
  const TOKEN = process.env.TRIBOPAY_API_TOKEN || '';
  const OFFER_HASH = process.env.TRIBOPAY_IOF_OFFER_HASH || '';
  const PRODUCT_HASH = process.env.TRIBOPAY_IOF_PRODUCT_HASH || '';
  const AMOUNT = toInteger(process.env.TRIBOPAY_IOF_AMOUNT, 2063);

  const missing = [];
  if (!TOKEN) missing.push('TRIBOPAY_API_TOKEN');
  if (!OFFER_HASH) missing.push('TRIBOPAY_IOF_OFFER_HASH');
  if (!PRODUCT_HASH) missing.push('TRIBOPAY_IOF_PRODUCT_HASH');

  if (missing.length > 0) {
    return res.status(500).json({ success: false, message: 'Configuração TriboPay incompleta.', missing });
  }

  try {
    const body = req.body || {};

    const payload = {
      amount: body.amount ? toInteger(body.amount, AMOUNT) : AMOUNT,
      offer_hash: body.offer_hash || body.offerHash || OFFER_HASH,
      payment_method: 'pix',
      customer: cleanObject({
        name: body.customer?.name || process.env.TRIBOPAY_CUSTOMER_NAME || 'Rafaela Almeida',
        email: body.customer?.email || process.env.TRIBOPAY_CUSTOMER_EMAIL || 'rafaela.almeida414@hotmail.com',
        phone_number: body.customer?.phone_number || process.env.TRIBOPAY_CUSTOMER_PHONE || '11999999999',
        document: body.customer?.document || process.env.TRIBOPAY_CUSTOMER_DOCUMENT || '09115751031',
        street_name: body.customer?.street_name || process.env.TRIBOPAY_CUSTOMER_STREET || 'Rua das Flores',
        number: body.customer?.number || process.env.TRIBOPAY_CUSTOMER_NUMBER || '123',
        neighborhood: body.customer?.neighborhood || process.env.TRIBOPAY_CUSTOMER_NEIGHBORHOOD || 'Centro',
        city: body.customer?.city || process.env.TRIBOPAY_CUSTOMER_CITY || 'Rio de Janeiro',
        state: body.customer?.state || process.env.TRIBOPAY_CUSTOMER_STATE || 'RJ',
        zip_code: body.customer?.zip_code || process.env.TRIBOPAY_CUSTOMER_ZIP || '20040020',
      }),
      cart: [
        {
          product_hash: body.product_hash || body.productHash || PRODUCT_HASH,
          title: body.title || 'IOF - Imposto sobre Operações Financeiras',
          price: body.amount ? toInteger(body.amount, AMOUNT) : AMOUNT,
          quantity: 1,
        },
      ],
      installments: 1,
      expire_in_days: body.expire_in_days || body.expireInDays || 1,
      transaction_origin: body.transaction_origin || body.transactionOrigin || 'api',
    };

    if (body.tracking && typeof body.tracking === 'object') {
      payload.tracking = cleanObject(body.tracking);
    }

    // Chama TriboPay (mesma rota que o servidor original)
    const url = `${TRIBO_BASE.replace(/\/$/, '')}/transactions?api_token=${encodeURIComponent(TOKEN)}`;

    const fetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    };

    const r = await fetch(url, fetchOptions);
    const status = r.status;
    const data = await r.json().catch(() => null);

    if (!r.ok) {
      return res.status(status).json({ success: false, message: data?.message || data || `TriboPay error (status ${status})`, errors: data });
    }

    const transaction = data;
    const pix = extractPixData(transaction);

    return res.status(status || 201).json({ success: true, payload, transaction, pix });
  } catch (err) {
    console.error('Serverless /api/pix/iof error:', err);
    const message = err?.message || 'Erro interno ao criar transação PIX.';
    return res.status(500).json({ success: false, message });
  }
};
