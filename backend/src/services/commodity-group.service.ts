import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const GROUPS = [
  { id: '001', category: 'General Services', group: 'Accommodation Rentals' },
  { id: '002', category: 'General Services', group: 'Membership Fees' },
  { id: '003', category: 'General Services', group: 'Workplace Safety' },
  { id: '004', category: 'General Services', group: 'Consulting' },
  { id: '005', category: 'General Services', group: 'Financial Services' },
  { id: '006', category: 'General Services', group: 'Fleet Management' },
  { id: '007', category: 'General Services', group: 'Recruitment Services' },
  {
    id: '008',
    category: 'General Services',
    group: 'Professional Development',
  },
  { id: '009', category: 'General Services', group: 'Miscellaneous Services' },
  { id: '010', category: 'General Services', group: 'Insurance' },
  {
    id: '011',
    category: 'Facility Management',
    group: 'Electrical Engineering',
  },
  {
    id: '012',
    category: 'Facility Management',
    group: 'Facility Management Services',
  },
  { id: '013', category: 'Facility Management', group: 'Security' },
  { id: '014', category: 'Facility Management', group: 'Renovations' },
  { id: '015', category: 'Facility Management', group: 'Office Equipment' },
  { id: '016', category: 'Facility Management', group: 'Energy Management' },
  { id: '017', category: 'Facility Management', group: 'Maintenance' },
  {
    id: '018',
    category: 'Facility Management',
    group: 'Cafeteria and Kitchenettes',
  },
  { id: '019', category: 'Facility Management', group: 'Cleaning' },
  {
    id: '020',
    category: 'Publishing Production',
    group: 'Audio and Visual Production',
  },
  { id: '021', category: 'Publishing Production', group: 'Books/Videos/CDs' },
  { id: '022', category: 'Publishing Production', group: 'Printing Costs' },
  {
    id: '023',
    category: 'Publishing Production',
    group: 'Software Development for Publishing',
  },
  { id: '024', category: 'Publishing Production', group: 'Material Costs' },
  {
    id: '025',
    category: 'Publishing Production',
    group: 'Shipping for Production',
  },
  {
    id: '026',
    category: 'Publishing Production',
    group: 'Digital Product Development',
  },
  { id: '027', category: 'Publishing Production', group: 'Pre-production' },
  {
    id: '028',
    category: 'Publishing Production',
    group: 'Post-production Costs',
  },
  { id: '029', category: 'Information Technology', group: 'Hardware' },
  { id: '030', category: 'Information Technology', group: 'IT Services' },
  { id: '031', category: 'Information Technology', group: 'Software' },
  {
    id: '032',
    category: 'Logistics',
    group: 'Courier, Express, and Postal Services',
  },
  {
    id: '033',
    category: 'Logistics',
    group: 'Warehousing and Material Handling',
  },
  { id: '034', category: 'Logistics', group: 'Transportation Logistics' },
  { id: '035', category: 'Logistics', group: 'Delivery Services' },
  { id: '036', category: 'Marketing & Advertising', group: 'Advertising' },
  {
    id: '037',
    category: 'Marketing & Advertising',
    group: 'Outdoor Advertising',
  },
  {
    id: '038',
    category: 'Marketing & Advertising',
    group: 'Marketing Agencies',
  },
  { id: '039', category: 'Marketing & Advertising', group: 'Direct Mail' },
  {
    id: '040',
    category: 'Marketing & Advertising',
    group: 'Customer Communication',
  },
  { id: '041', category: 'Marketing & Advertising', group: 'Online Marketing' },
  { id: '042', category: 'Marketing & Advertising', group: 'Events' },
  {
    id: '043',
    category: 'Marketing & Advertising',
    group: 'Promotional Materials',
  },
  {
    id: '044',
    category: 'Production',
    group: 'Warehouse and Operational Equipment',
  },
  { id: '045', category: 'Production', group: 'Production Machinery' },
  { id: '046', category: 'Production', group: 'Spare Parts' },
  { id: '047', category: 'Production', group: 'Internal Transportation' },
  { id: '048', category: 'Production', group: 'Production Materials' },
  { id: '049', category: 'Production', group: 'Consumables' },
  { id: '050', category: 'Production', group: 'Maintenance and Repairs' },
]

export async function ensureCommodityGroupsSeeded() {
  const count = await prisma.commodityGroup.count()
  if (count > 0) return
  await prisma.commodityGroup.createMany({ data: GROUPS })
}

export async function listCommodityGroups() {
  return prisma.commodityGroup.findMany({ orderBy: { id: 'asc' } })
}

export async function resolveCommodityGroupId(input?: string) {
  if (!input) return null
  const byId = await prisma.commodityGroup.findUnique({ where: { id: input } })
  if (byId) return byId.id
  const byName = await prisma.commodityGroup.findFirst({
    where: { group: input },
  })
  return byName?.id ?? null
}

export async function getCommodityGroupById(id: string) {
  const prisma = new PrismaClient()
  return prisma.commodityGroup.findUnique({ where: { id } })
}
