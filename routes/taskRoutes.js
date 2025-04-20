const express = require('express');
const router = express.Router();
const { suggestTask } = require('../controllers/taskController');

router.post('/suggestTasks', suggestTask);

module.exports = router;