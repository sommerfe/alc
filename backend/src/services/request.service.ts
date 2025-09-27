import { PrismaClient } from '@prisma/client'
import { resolveCommodityGroupId } from './commodity-group.service'
const prisma = new PrismaClient()

function pickRequestFields(src: any) {
  return {
    requestorName: src.requestorName,
    title: src.title,
    vendorName: src.vendorName,
    vatId: src.vatId,
    department: src.department,
    totalCost: src.totalCost,
    extras: src.extras, // <-- include extras
    status: src.status,
  }
}

function toNum(v: any): number {
  if (v == null) return 0
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const s = v
      .replace(/[^\d.,+-]/g, '')
      .replace(/\.(?=.*\.)/g, '')
      .replace(',', '.')
    const n = Number(s)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function parseDiscount(src: any): {
  type: 'percent' | 'absolute' | null
  value: number | null
} {
  // Normalize to a positive reduction magnitude (never add)
  const d = src?.discount
  if (typeof d === 'string') {
    const s = d.trim()
    if (/%$/.test(s)) {
      const v = Math.abs(toNum(s.slice(0, -1)))
      return Number.isFinite(v) && v > 0
        ? { type: 'percent', value: v }
        : { type: null, value: null }
    }
    const v = Math.abs(toNum(s))
    return Number.isFinite(v) && v > 0
      ? { type: 'absolute', value: v }
      : { type: null, value: null }
  }
  if (typeof d === 'number') {
    const v = Math.abs(d)
    return Number.isFinite(v) && v > 0
      ? { type: 'absolute', value: v }
      : { type: null, value: null }
  }
  // Fallback: legacy fields -> normalize to positive magnitude
  const t = src?.discountType
  const v = Math.abs(toNum(src?.discountValue))
  if ((t === 'percent' || t === 'absolute') && Number.isFinite(v) && v > 0)
    return { type: t, value: v }
  return { type: null, value: null }
}

function sanitizeOrderLine(src: any) {
  const unitPrice = toNum(src.unitPrice)
  const amount = toNum(src.amount)
  const base = unitPrice * amount

  const { type: discountType, value: discountValue } = parseDiscount(src)

  let total = base
  if (discountType === 'percent' && discountValue != null) {
    total = base * (1 - discountValue / 100) // subtract only
  } else if (discountType === 'absolute' && discountValue != null) {
    total = base - discountValue // subtract only
  }
  if (!Number.isFinite(total) || total < 0) total = 0
  total = Math.round(total * 100) / 100

  return {
    positionDescription: String(src.positionDescription ?? ''),
    unitPrice,
    amount,
    unit: String(src.unit ?? ''),
    discountType: discountType ?? undefined,
    discountValue: discountValue ?? undefined,
    totalPrice: total,
  }
}

export async function createRequest(data: any) {
  const cgId =
    data.commodityGroupId ??
    (await resolveCommodityGroupId(data.commodityGroup))
  if (!cgId) throw new Error('Invalid commodity group')

  const created = await prisma.request.create({
    data: {
      ...pickRequestFields(data),
      commodityGroupId: cgId,
      orderLines: data.orderLines?.length
        ? { create: data.orderLines.map(sanitizeOrderLine) }
        : undefined,
    },
    include: { orderLines: true, commodityGroup: true },
  })
  return created
}

export async function listRequests() {
  return prisma.request.findMany({
    include: { orderLines: true, commodityGroup: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getRequest(id: string) {
  return prisma.request.findUnique({
    where: { id },
    include: { orderLines: true, commodityGroup: true },
  })
}

export async function updateRequest(id: string, data: any) {
  const cgId =
    data.commodityGroupId ??
    (await resolveCommodityGroupId(data.commodityGroup))

  const ops: any = { ...pickRequestFields(data) }
  if (cgId) ops.commodityGroupId = cgId

  if (Array.isArray(data.orderLines)) {
    await prisma.orderLine.deleteMany({ where: { requestId: id } })
    ops.orderLines = { create: data.orderLines.map(sanitizeOrderLine) }
  }

  return prisma.request.update({
    where: { id },
    data: ops,
    include: { orderLines: true, commodityGroup: true },
  })
}

export async function changeStatus(id: string, status: any) {
  return prisma.request.update({
    where: { id },
    data: { status },
    include: { orderLines: true, commodityGroup: true },
  })
}

export async function deleteRequest(id: string) {
  await prisma.orderLine.deleteMany({ where: { requestId: id } })
  return prisma.request.delete({ where: { id } })
}
