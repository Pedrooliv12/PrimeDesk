const { Router } = require('express');
const { cadastroProfissional, listarProfissionais } = require('../controllers/profissionaisController');
const { autenticarEmpresa } = require('../middlewares/auth');

const router = Router();

router.get('/', autenticarEmpresa, listarProfissionais);
router.post('/', autenticarEmpresa, cadastroProfissional);

module.exports = router;
