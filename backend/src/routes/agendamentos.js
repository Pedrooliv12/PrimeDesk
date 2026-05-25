const express = require('express');
const router = express.Router();
const { criarAgendamento, listarAgendamentos, marcarComoLido } = require('../controllers/agendamentosController');
const { autenticarEmpresa, exigirAssinaturaAtiva } = require('../middlewares/auth');

router.post('/', criarAgendamento);
router.get('/', autenticarEmpresa, exigirAssinaturaAtiva, listarAgendamentos);
router.patch('/:id/lido', autenticarEmpresa, exigirAssinaturaAtiva, marcarComoLido);

module.exports = router;
