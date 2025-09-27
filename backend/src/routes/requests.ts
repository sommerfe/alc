import { Router } from 'express'
import multer from 'multer'
import {
  createRequest,
  listRequests,
  getRequest,
  updateRequest,
  changeStatus,
  deleteRequest,
} from '../services/request.service'
import {
  mapPdfToRequestFromBuffer,
  mapTextToRequest,
} from '../services/ai.service'
import {
  resolveCommodityGroupId,
  getCommodityGroupById,
} from '../services/commodity-group.service'

const upload = multer()
const router = Router()

async function enrichFields(fields: any) {
  // Normalize numeric fields
  const toNum = (v: any) =>
    typeof v === 'string'
      ? Number(v.replace(/[^\d.,-]/g, '').replace(',', '.'))
      : Number(v ?? 0)

  if (Array.isArray(fields.orderLines)) {
    fields.orderLines = fields.orderLines.map((l: any) => {
      const discount =
        typeof l.discount === 'string' || typeof l.discount === 'number'
          ? l.discount
          : l.discountType && l.discountValue != null
            ? l.discountType === 'percent'
              ? `${Number(l.discountValue)}%`
              : Number(l.discountValue)
            : null

      return {
        positionDescription: l.positionDescription ?? '',
        unitPrice: toNum(l.unitPrice),
        amount: toNum(l.amount),
        unit: l.unit ?? '',
        // keep discount in the payload sent to the frontend
        discount,
        // also forward normalized backend fields when present
        discountType:
          l.discountType === 'percent' || l.discountType === 'absolute'
            ? l.discountType
            : undefined,
        discountValue:
          l.discountValue != null ? toNum(l.discountValue) : undefined,
        totalPrice: toNum(l.totalPrice),
      }
    })
  }
  if (fields.totalCost != null) fields.totalCost = toNum(fields.totalCost)

  // Resolve commodity group from id or name
  const cgInput = fields.commodityGroupId || fields.commodityGroup
  const cgId = await resolveCommodityGroupId(cgInput)
  fields.commodityGroupId = cgId || ''
  if (cgId) {
    const cg = await getCommodityGroupById(cgId)
    if (cg) fields.commodityGroup = cg // replace string with full object
  } else {
    // Keep the original text (if any) under a different prop to not break the form
    if (typeof fields.commodityGroup === 'string') {
      fields.commodityGroupText = fields.commodityGroup
    }
    delete fields.commodityGroup
  }
  return fields
}

router.get('/', async (_req, res) => {
  const rows = await listRequests()
  res.json(rows) // includes commodityGroup
})

router.get('/:id', async (req, res) => {
  const row = await getRequest(req.params.id)
  if (!row) return res.status(404).end()
  res.json(row) // includes commodityGroup
})

router.post('/', async (req, res) => {
  const created = await createRequest(req.body)
  res.status(201).json(created) // includes commodityGroup
})

router.patch('/:id', async (req, res) => {
  const updated = await updateRequest(req.params.id, req.body)
  res.json(updated) // includes commodityGroup
})

router.delete('/:id', async (req, res) => {
  await deleteRequest(req.params.id)
  res.status(204).end()
})

router.post('/extract', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file required' })
    const fields = await mapPdfToRequestFromBuffer(
      req.file.buffer,
      req.file.originalname
    )
    const enriched = await enrichFields(fields)
    res.json({ fields: enriched })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/extract-text', async (req, res) => {
  try {
    const fields = await mapTextToRequest(req.body?.text || '')
    const enriched = await enrichFields(fields)
    res.json({ fields: enriched })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/:id/status', async (req, res) => {
  const updated = await changeStatus(req.params.id, req.body?.status)
  res.json(updated) // includes commodityGroup
})

export { router as requestsRouter } // optional named export
export default router // required default export
