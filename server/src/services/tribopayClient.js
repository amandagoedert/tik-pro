const axios = require('axios');
const { config } = require('../config/tribopay');

const triboPay = axios.create({
  baseURL: config.baseUrl,
  timeout: Number.parseInt(process.env.TRIBOPAY_TIMEOUT_MS || '15000', 10),
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const createPixTransaction = async (payload) => {
  return triboPay.post('/transactions', payload, {
    params: { api_token: config.apiToken },
  });
};

module.exports = {
  createPixTransaction,
};
