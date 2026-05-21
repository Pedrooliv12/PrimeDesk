const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const profissionaisRoutes = require('./routes/profissionais');
const horariosRoutes = require('./routes/horarios');
const disponibilidadesRoutes = require('./routes/disponibilidades');
const agendaRoutes = require('./routes/agenda');
const agendamentosRoutes = require('./routes/agendamentos');

const app = express();

app.use(cors());
app.use(express.json());

const frontendPath = process.env.FRONTEND_PATH || path.resolve(__dirname, '../../frontend');
app.use(express.static(frontendPath));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/profissionais', profissionaisRoutes);
app.use('/horarios', horariosRoutes);
app.use('/disponibilidades', disponibilidadesRoutes);
app.use('/agenda', agendaRoutes);
app.use('/agendamentos', agendamentosRoutes);

module.exports = app;
