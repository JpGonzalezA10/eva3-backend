const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());

const PORT = process.env.PORT || 4000;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend', timestamp: new Date().toISOString() });
});

app.get('/api/data', (req, res) => {
  res.json({ message: 'Hola desde el backend', proyecto: 'Evaluacion ISY1101' });
});

app.listen(PORT, () => console.log(`Backend escuchando en puerto ${PORT}`));
