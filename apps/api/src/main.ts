import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
// Optional CORS if you ever hit the API directly from the browser
import cors from '@fastify/cors'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  )

  // Everything under /api (keeps things consistent dev/prod)
  app.setGlobalPrefix('api')

  // Optional: only needed if you *don’t* use the proxy and hit 3000 directly
  await app.register(cors, {
    origin: ['http://localhost:5173'],
    credentials: true,
  })

  await app.listen(3000, '0.0.0.0')
}
bootstrap()
