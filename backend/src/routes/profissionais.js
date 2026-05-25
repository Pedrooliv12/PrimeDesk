const { Router } = require('express');
const { cadastroProfissional, listarProfissionais, editarProfissional, deletarProfissional } = require('../controllers/profissionaisController');
const { autenticarEmpresa, exigirAssinaturaAtiva } = require('../middlewares/auth');

const router = Router();

router.get('/', autenticarEmpresa, exigirAssinaturaAtiva, listarProfissionais);
router.post('/', autenticarEmpresa, exigirAssinaturaAtiva, cadastroProfissional);
router.put('/:id', autenticarEmpresa, exigirAssinaturaAtiva, editarProfissional);
router.delete('/:id', autenticarEmpresa, exigirAssinaturaAtiva, deletarProfissional);

module.exports = router;
