const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const profissionaisRoutes = require('./routes/profissionais');
const horariosRoutes = require('./routes/horarios');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/profissionais', profissionaisRoutes);
app.use('/horarios', horariosRoutes);

module.exports = app;
