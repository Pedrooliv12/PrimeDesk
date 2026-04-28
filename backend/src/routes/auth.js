const { Router } = require('express');
const { cadastroEmpresa, loginEmpresa } = require('../controllers/authController');

const router = Router();

router.post('/cadastro', cadastroEmpresa);
router.post('/login', loginEmpresa);

module.exports = router;
