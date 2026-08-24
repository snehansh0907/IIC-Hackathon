const express = require('express');
const router = express.Router();
const { getActions, completeAction } = require('./actionController');

router.get('/', getActions);
router.post('/:id/complete', completeAction);
router.put('/:id/complete', completeAction);

module.exports = router;
