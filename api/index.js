// Vercel serverless entry-point.
// Vercel calls this module's export as a standard (req, res) handler.
const app = require('../server/app')

module.exports = app
