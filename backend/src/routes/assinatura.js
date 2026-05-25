const { Router } = require('express');
const { obterStatusAssinatura, assinarPlano } = require('../controllers/assinaturaController');
const { autenticarEmpresa } = require('../middlewares/auth');

const router = Router();

router.get('/status', autenticarEmpresa, obterStatusAssinatura);
router.post('/assinar', autenticarEmpresa, assinarPlano);

module.exports = router;
