const { Router } = require('express');
const { criarHorario, listarHorarios, deletarHorario } = require('../controllers/horariosController');
const { autenticarEmpresa } = require('../middlewares/auth');

const router = Router();

router.get('/', autenticarEmpresa, listarHorarios);
router.post('/', autenticarEmpresa, criarHorario);
router.delete('/:id', autenticarEmpresa, deletarHorario);

module.exports = router;
