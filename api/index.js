// Vercel serverless entry-point (ES module — root package.json has "type":"module").
// Vercel calls the default export as a standard (req, res) handler.
// Node.js allows importing a CJS module (server/app.js) from an ES module.
import app from '../server/app.js'

export default app
