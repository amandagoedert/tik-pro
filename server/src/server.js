const express = require('express');
const cors = require('cors');
const { config, missingRequiredConfig } = require('./config/tribopay');
const pixRouter = require('./routes/pix');

const app = express();

const allowedOrigins = process.env.APP_CORS_ORIGINS
  ? process.env.APP_CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : ['*'];
const allowAllOrigins = allowedOrigins.includes('*');

app.use(
  cors({
    origin: allowAllOrigins ? true : allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
  })
);

app.use(express.json());

app.get('/health', (req, res) => {
  const missingConfig = missingRequiredConfig();
  res.json({
    status: 'ok',
    configReady: missingConfig.length === 0,
    missingConfig,
  });
});

app.use('/api/pix', pixRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Erro interno no servidor.' });
});

const port = Number.parseInt(process.env.PORT || '3000', 10);

app.listen(port, () => {
  const missingConfig = missingRequiredConfig();
  if (missingConfig.length > 0) {
    console.warn(
      `[TriboPay] Configuração incompleta. Campos ausentes: ${missingConfig.join(', ')}`
    );
  }
  console.log(
    `[TriboPay] API PIX em execução na porta ${port} (base: ${config.baseUrl}).`
  );
});
