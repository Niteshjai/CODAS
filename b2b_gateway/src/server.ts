import 'dotenv/config'
import Fastify from 'fastify'
import { b2bRoutes } from './routes/b2b.js'
import { pool } from './db/connection.js'
import './b2b/webhooks/webhookWorker.js'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'

const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required')
}

// MOCK_MODE bypasses auth and grants admin — never allow it in production
if (process.env.NODE_ENV === 'production' && process.env.MOCK_MODE === 'true') {
  throw new Error('MOCK_MODE must not be enabled in production')
}

// Number of reverse-proxy hops to trust for request.ip (0 = use the socket address)
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 0)

const app = Fastify({
  logger: true,
  trustProxy: Number.isInteger(trustProxyHops) && trustProxyHops > 0 ? trustProxyHops : false
})

// Partners only ever see a generic envelope; internal details stay in our logs
app.setErrorHandler((err: { statusCode?: number; validation?: unknown }, request, reply) => {
  request.log.error(err)
  const statusCode = err.statusCode ?? 500
  if (err.validation) {
    return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request' } })
  }
  if (statusCode === 404) {
    return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Resource not found' } })
  }
  if (statusCode < 500) {
    return reply.status(statusCode).send({ success: false, error: { code: 'BAD_REQUEST', message: 'Request could not be processed' } })
  }
  return reply.status(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An internal error occurred' } })
})

app.register(fastifyCookie)
app.register(fastifyJwt, {
  secret: jwtSecret,
})

app.decorate('pg', pool)

app.register(b2bRoutes)

app.listen({ port: 3001, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`B2B Gateway listening at ${address}`)
})
