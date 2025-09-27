export type RequestStatus = 'open' | 'in_progress' | 'closed'

export const STATUS_OPTIONS = [
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Closed', value: 'closed' },
]

export type CommodityGroup = {
  id: string
  category: string
  group: string
}

export type OrderLine = {
  id?: string
  positionDescription: string
  unitPrice: number | null
  amount: number | null
  unit: string
  // UI input (optional): absolute number like 5 or percent string like "10%"
  discount?: number | string | null
  // Backend-normalized (optional)
  discountType?: 'percent' | 'absolute' | null
  discountValue?: number | null
  totalPrice: number
}

export type RequestForm = {
  id?: string
  requestorName: string
  title: string
  vendorName: string
  vatId: string
  department: string
  commodityGroupId: string
  commodityGroup?: CommodityGroup
  orderLines: OrderLine[]
  totalCost: number
  status: RequestStatus
  extras?: number | null // other costs (taxes/fees not in order lines)
}
