const express = require('express');
const router = express.Router();

router.post('/register-step1', (req, res) => {
  res.json({ message: 'Primeira etapa de registro recebida' });
});

router.post('/register-complete', (req, res) => {
  res.json({ message: 'Cadastro completo recebido' });
});

router.post('/login', (req, res) => {
  res.json({ message: 'Login recebido' });
});

module.exports = router;