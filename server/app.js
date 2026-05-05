'use strict'

const express = require('express')
const cors = require('cors')
const quoteRouter = require('./routes/quote')

const app = express()

// Allow localhost (dev) and any *.vercel.app deployment; also supports a
// custom FRONTEND_URL env var for production custom domains.
const allowedPatterns = [
  /^http:\/\/localhost:\d+$/,
  /^https:\/\/[\w-]+\.vercel\.app$/,
]

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true)

    const customUrl = process.env.FRONTEND_URL
    if (customUrl && origin === customUrl) return callback(null, true)

    const ok = allowedPatterns.some(p => p.test(origin))
    if (ok) return callback(null, true)

    return callback(new Error('Not allowed by CORS'))
  },
}))

app.use(express.json())

app.use('/api/quote', quoteRouter)
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

module.exports = app
