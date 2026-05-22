const { Router } = require('express');
const {
  cadastroEmpresa,
  loginEmpresa,
  listarPerguntas,
  obterPerguntaSeguranca,
  redefinirSenha,
} = require('../controllers/authController');

const router = Router();

router.post('/register', cadastroEmpresa);
router.post('/login', loginEmpresa);
router.get('/perguntas', listarPerguntas);
router.post('/recuperar/pergunta', obterPerguntaSeguranca);
router.post('/recuperar/redefinir', redefinirSenha);

module.exports = router;
