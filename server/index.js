const express = require('express')
const cors = require('cors')
const quoteRouter = require('./routes/quote')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/quote', quoteRouter)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`)
})
