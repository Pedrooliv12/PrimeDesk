const { Router } = require('express');
const { cadastro, login } = require('../controllers/authController');

const router = Router();

router.post('/cadastro', cadastro);
router.post('/login', login);

module.exports = router;
