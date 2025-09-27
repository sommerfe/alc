import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import requestsRouter from './routes/requests'
import {
  ensureCommodityGroupsSeeded,
  listCommodityGroups,
} from './services/commodity-group.service'

const app = express()
app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(morgan('dev'))

// seed once at startup
ensureCommodityGroupsSeeded().catch(console.error)

app.get('/api/commodity-groups', async (_req, res) => {
  try {
    const groups = await listCommodityGroups()
    res.json(groups)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/api/requests', requestsRouter)

// Error handler
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err)
    res
      .status(err.status || 500)
      .json({ error: err.message || 'Internal Server Error' })
  }
)

const port = Number(process.env.PORT || 3000)
app.listen(port, () =>
  console.log(`Backend listening on http://localhost:${port}`)
)
