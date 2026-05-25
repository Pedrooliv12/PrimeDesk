const { Router } = require('express');
const { criarDisponibilidade, listarDisponibilidades, deletarDisponibilidade } = require('../controllers/disponibilidadesController');
const { autenticarEmpresa, exigirAssinaturaAtiva } = require('../middlewares/auth');

const router = Router();

router.get('/', autenticarEmpresa, exigirAssinaturaAtiva, listarDisponibilidades);
router.post('/', autenticarEmpresa, exigirAssinaturaAtiva, criarDisponibilidade);
router.delete('/:id', autenticarEmpresa, exigirAssinaturaAtiva, deletarDisponibilidade);

module.exports = router;
