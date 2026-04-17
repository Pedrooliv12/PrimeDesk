const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json([
    { id: 1, nome: 'Mensal', preco: 99.90 },
    { id: 2, nome: 'Trimestral', preco: 269.90 },
    { id: 3, nome: 'Anual', preco: 899.90 }
  ]);
});

router.post('/assinar', (req, res) => {
  res.json({ message: 'Assinatura recebida com sucesso' });
});

module.exports = router;