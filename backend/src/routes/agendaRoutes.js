const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Lista de agendas' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Agenda criada com sucesso' });
});

module.exports = router;