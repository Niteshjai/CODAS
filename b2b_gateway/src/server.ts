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

const app = Fastify({ logger: true })

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
