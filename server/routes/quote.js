const express = require('express')
const router = express.Router()
const { generateQuote } = require('../controllers/quoteController')

router.post('/generate', generateQuote)

module.exports = router
