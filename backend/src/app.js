const express = require('express');
const cors = require('cors');
require('dotenv').config();

const companyRoutes = require('./routes/companyRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'API PrimeDesk funcionando' });
});

app.use('/api/empresas', companyRoutes);
app.use('/api/auth', authRoutes);

module.exports = app;