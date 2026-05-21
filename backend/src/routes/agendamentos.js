const express = require('express');
const router = express.Router();
const { criarAgendamento, listarAgendamentos, marcarComoLido } = require('../controllers/agendamentosController');
const { autenticarEmpresa } = require('../middlewares/auth');

router.post('/', criarAgendamento);
router.get('/', autenticarEmpresa, listarAgendamentos);
router.patch('/:id/lido', autenticarEmpresa, marcarComoLido);

module.exports = router;
