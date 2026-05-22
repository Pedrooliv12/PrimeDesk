const { Router } = require('express');
const { criarDisponibilidade, listarDisponibilidades, deletarDisponibilidade } = require('../controllers/disponibilidadesController');
const { autenticarEmpresa } = require('../middlewares/auth');

const router = Router();

router.get('/', autenticarEmpresa, listarDisponibilidades);
router.post('/', autenticarEmpresa, criarDisponibilidade);
router.delete('/:id', autenticarEmpresa, deletarDisponibilidade);

module.exports = router;
