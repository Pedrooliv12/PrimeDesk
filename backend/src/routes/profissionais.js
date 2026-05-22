const { Router } = require('express');
const { cadastroProfissional, listarProfissionais, editarProfissional, deletarProfissional } = require('../controllers/profissionaisController');
const { autenticarEmpresa } = require('../middlewares/auth');

const router = Router();

router.get('/', autenticarEmpresa, listarProfissionais);
router.post('/', autenticarEmpresa, cadastroProfissional);
router.put('/:id', autenticarEmpresa, editarProfissional);
router.delete('/:id', autenticarEmpresa, deletarProfissional);

module.exports = router;
