const path = require('path');
const dotenv = require('dotenv');

const ENV_PATH = process.env.ENV_PATH
  ? path.resolve(process.cwd(), process.env.ENV_PATH)
  : null;

dotenv.config(ENV_PATH ? { path: ENV_PATH } : undefined);

const toInteger = (value, fallback) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const removeEmpty = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return {};
  }
  return Object.entries(payload).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === '') {
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {});
};

const config = {
  apiToken: process.env.TRIBOPAY_API_TOKEN || '',
  baseUrl: process.env.TRIBOPAY_BASE_URL || 'https://api.tribopay.com.br/api/public/v1',
  offerHash: process.env.TRIBOPAY_IOF_OFFER_HASH || '',
  productHash: process.env.TRIBOPAY_IOF_PRODUCT_HASH || '',
  amount: toInteger(process.env.TRIBOPAY_IOF_AMOUNT, 2063),
  transactionTitle:
    process.env.TRIBOPAY_IOF_TITLE || 'IOF - Imposto sobre Operações Financeiras',
  postbackUrl: process.env.TRIBOPAY_POSTBACK_URL || '',
  defaultCustomer: removeEmpty({
    name: process.env.TRIBOPAY_CUSTOMER_NAME || 'Rafaela Almeida',
    email: process.env.TRIBOPAY_CUSTOMER_EMAIL || 'rafaela.almeida414@hotmail.com',
    phone_number: process.env.TRIBOPAY_CUSTOMER_PHONE || '11999999999',
    document: process.env.TRIBOPAY_CUSTOMER_DOCUMENT || '09115751031',
    street_name: process.env.TRIBOPAY_CUSTOMER_STREET || 'Rua das Flores',
    number: process.env.TRIBOPAY_CUSTOMER_NUMBER || '123',
    complement: process.env.TRIBOPAY_CUSTOMER_COMPLEMENT,
    neighborhood: process.env.TRIBOPAY_CUSTOMER_NEIGHBORHOOD || 'Centro',
    city: process.env.TRIBOPAY_CUSTOMER_CITY || 'Rio de Janeiro',
    state: process.env.TRIBOPAY_CUSTOMER_STATE || 'RJ',
    zip_code: process.env.TRIBOPAY_CUSTOMER_ZIP || '20040020',
  }),
};

const requiredKeys = ['apiToken', 'offerHash', 'productHash'];

const missingRequiredConfig = () =>
  requiredKeys.filter((key) => !config[key] || !config[key].trim());

module.exports = {
  config,
  missingRequiredConfig,
  toInteger,
};
