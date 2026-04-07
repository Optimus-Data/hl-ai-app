const { createApp } = require('./app.js');

const app = createApp();
const PORT = process.env.PORT || 8000;
const LOOPBACK = process.env.LOOPBACK || '127.0.0.1';

app.listen(PORT, LOOPBACK, () => {
  console.log(`Servidor rodando em http://${LOOPBACK}:${PORT}`);
});
