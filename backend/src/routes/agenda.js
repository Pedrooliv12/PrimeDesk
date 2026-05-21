const express = require('express');
const router = express.Router();
const { listarAgendaPublica } = require('../controllers/agendaController');

router.get('/:slug', listarAgendaPublica);

module.exports = router;
