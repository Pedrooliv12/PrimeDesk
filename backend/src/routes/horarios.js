const { Router } = require('express');
const { criarHorario, listarHorarios, deletarHorario } = require('../controllers/horariosController');
const { autenticarEmpresa, exigirAssinaturaAtiva } = require('../middlewares/auth');

const router = Router();

router.get('/', autenticarEmpresa, exigirAssinaturaAtiva, listarHorarios);
router.post('/', autenticarEmpresa, exigirAssinaturaAtiva, criarHorario);
router.delete('/:id', autenticarEmpresa, exigirAssinaturaAtiva, deletarHorario);

module.exports = router;
