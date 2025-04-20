const express = require('express');
const router = express.Router();
const { generateHunts, getHuntById } = require('../controllers/riddleController');

router.post('/generate-hunts', generateHunts);
router.post('/getHuntById', getHuntById);

module.exports = router;
