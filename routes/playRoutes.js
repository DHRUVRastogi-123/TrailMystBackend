const express = require('express');
const router = express.Router();
const { addHuntToUser, solveClue } = require('../controllers/playController');

router.post('/addHuntToUser', addHuntToUser);
router.post('/solveClue', solveClue);

module.exports = router;
