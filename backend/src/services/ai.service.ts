import OpenAI from 'openai'
import { toFile } from 'openai/uploads'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Force a safe filename with a specific extension (e.g., .pdf)
function normalizeFilename(
  original: string | undefined,
  desiredExt = '.pdf'
): string {
  const ext = desiredExt.startsWith('.')
    ? desiredExt.toLowerCase()
    : `.${desiredExt.toLowerCase()}`
  const base = (original || 'document').split(/[\\/]/).pop() || 'document'
  const cleaned = base
    .replace(/\s+$/g, '')
    .replace(/\.+$/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
  const root = cleaned.replace(/\.[^.]+$/g, '')
  return `${root}${ext}`
}

// Single, shared extraction instructions for both text and PDF
function buildExtractionInstructions() {
  return `You convert a vendor offer (text or PDF) into a strict JSON object for a procurement request.
Return ONLY JSON with this TypeScript shape (no comments, no code block markers):
{
  requestorName: string;
  title: string;
  vendorName: string;
  vatId: string;
  commodityGroup: string; // return the ID from the table below
  department: string;
  orderLines: {
    positionDescription: string;
    unitPrice: number;
    amount: number;
    unit: string;
    // Line discount ONLY (no surcharges): either a number (absolute EUR) or a string with '%' suffix (percent).
    // Normalize to a positive magnitude in the output. Examples:
    //   source "-20,00%" -> discount: "20%"; source "-5" -> discount: 5
    //   if source shows a surcharge like "+10%" or "+5", set discount to null (do not add via discount).
    discount?: number | string | null;
    totalPrice: number; // after applying discount (subtract only)
  }[];
  extras: number; // total of taxes/fees/shipping not inside orderLines (can be negative)
  totalCost: number;
  status: 'open' | 'in_progress' | 'closed';
}

Rules (follow exactly):
- Numbers: plain numbers only (no symbols or thousands separators); use dot as decimal separator for JSON numbers.
- For each order line:
  - base = unitPrice * amount.
  - If discount is present:
    - "<N>%" (string ending with %): N is the positive percent discount magnitude.
      totalPrice = base * (1 - N/100).
    - <N> (number): N is the positive absolute discount in EUR.
      totalPrice = base - N.
    - Clamp totalPrice at minimum 0; round to cents.
  - If no discount, totalPrice = base.
- linesSum = sum(orderLines.totalPrice).
- Extra costs may appear on multiple separate lines (e.g., VAT/USt./MwSt., shipping/Versand, handling/Gebühren, service charges). Sum ALL such extras:
  - extrasDetected = (sum of surcharges) - (sum of deductions like global discounts/skonto if present)
  - If a final “Total/Grand total/Amount due” exists, prefer totalCost from that value and set extras = totalCost - linesSum.
  - Otherwise, set totalCost = linesSum + extrasDetected and extras = extrasDetected.
- Always include extras, even if 0.
- status = 'open'.
- requestorName is usually the receiver; vendorName the sender.
- For commodityGroup, select the single most relevant ID from this table and return that ID:
| ID  | Category                | Commodity Group                       |
| --- | ----------------------- | ------------------------------------- |
| 001 | General Services        | Accommodation Rentals                 |
| 002 | General Services        | Membership Fees                       |
| 003 | General Services        | Workplace Safety                      |
| 004 | General Services        | Consulting                            |
| 005 | General Services        | Financial Services                    |
| 006 | General Services        | Fleet Management                      |
| 007 | General Services        | Recruitment Services                  |
| 008 | General Services        | Professional Development              |
| 009 | General Services        | Miscellaneous Services                |
| 010 | General Services        | Insurance                             |
| 011 | Facility Management     | Electrical Engineering                |
| 012 | Facility Management     | Facility Management Services          |
| 013 | Facility Management     | Security                              |
| 014 | Facility Management     | Renovations                           |
| 015 | Facility Management     | Office Equipment                      |
| 016 | Facility Management     | Energy Management                     |
| 017 | Facility Management     | Maintenance                           |
| 018 | Facility Management     | Cafeteria and Kitchenettes            |
| 019 | Facility Management     | Cleaning                              |
| 020 | Publishing Production   | Audio and Visual Production           |
| 021 | Publishing Production   | Books/Videos/CDs                      |
| 022 | Publishing Production   | Printing Costs                        |
| 023 | Publishing Production   | Software Development for Publishing   |
| 024 | Publishing Production   | Material Costs                        |
| 025 | Publishing Production   | Shipping for Production               |
| 026 | Publishing Production   | Digital Product Development           |
| 027 | Publishing Production   | Pre-production                        |
| 028 | Publishing Production   | Post-production Costs                 |
| 029 | Information Technology  | Hardware                              |
| 030 | Information Technology  | IT Services                           |
| 031 | Information Technology  | Software                              |
| 032 | Logistics               | Courier, Express, and Postal Services |
| 033 | Logistics               | Warehousing and Material Handling     |
| 034 | Logistics               | Transportation Logistics              |
| 035 | Logistics               | Delivery Services                     |
| 036 | Marketing & Advertising | Advertising                           |
| 037 | Marketing & Advertising | Outdoor Advertising                   |
| 038 | Marketing & Advertising | Marketing Agencies                    |
| 039 | Marketing & Advertising | Direct Mail                           |
| 040 | Marketing & Advertising | Customer Communication                |
| 041 | Marketing & Advertising | Online Marketing                      |
| 042 | Marketing & Advertising | Events                                |
| 043 | Marketing & Advertising | Promotional Materials                 |
| 044 | Production              | Warehouse and Operational Equipment   |
| 045 | Production              | Production Machinery                  |
| 046 | Production              | Spare Parts                           |
| 047 | Production              | Internal Transportation               |
| 048 | Production              | Production Materials                  |
| 049 | Production              | Consumables                           |
| 050 | Production              | Maintenance and Repairs               |

Examples (do not include in output):
- Lines sum 100.00, VAT 19.00, Shipping 10.00, Total 129.00 -> extras = 29.00.
- Source "-10%" -> discount "10%"; base 200 -> totalPrice 180.
- Source "-5" -> discount 5; base 150 -> totalPrice 145.`
}

export async function mapTextToRequest(text: string) {
  const instructions = buildExtractionInstructions()
  const user = `Document text:\n\n${text}\n\nReturn JSON only.`

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const resp = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: instructions },
      { role: 'user', content: user },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' as any },
  })

  const content = resp.choices[0]?.message?.content || '{}'
  return JSON.parse(content)
}

export async function mapPdfToRequestFromBuffer(
  pdf: Buffer,
  filename = 'document.pdf'
) {
  const safeName = normalizeFilename(filename, '.pdf')

  // Upload PDF to OpenAI Files with safe filename and correct content-type
  const file = await client.files.create({
    file: await toFile(pdf, safeName, { type: 'application/pdf' }),
    purpose: 'assistants',
  })

  // Create a vector store and index the uploaded file so file_search can access it
  const vectorStore = await (client as any).vectorStores.create({
    name: `offer-${Date.now()}`,
  })
  await (client as any).vectorStores.files.create(vectorStore.id, {
    file_id: file.id,
  })

  const instructions = buildExtractionInstructions()
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const user = 'Return JSON only.'

  // Use Responses API to read the PDF and extract JSON
  const resp = await client.responses.create({
    model,
    input: [
      { role: 'system', content: instructions },
      {
        role: 'user',
        content: [
          { type: 'input_text', text: user },
          { type: 'input_file', file_id: file.id },
        ],
      },
    ],
    tools: [{ type: 'file_search', vector_store_ids: [vectorStore.id] } as any],
    temperature: 0.2,
  } as any)

  let jsonText: string | undefined
  // @ts-ignore prefer helper when available
  if (typeof resp.output_text === 'string') {
    // @ts-ignore
    jsonText = resp.output_text
  }
  if (!jsonText) {
    try {
      const output = (resp as any).output || []
      const joined = output
        .flatMap((o: any) => o.content || [])
        .map((c: any) => c?.text?.value || c?.content?.[0]?.text?.value)
        .filter(Boolean)
        .join('\n')
      jsonText = joined
    } catch {
      jsonText = ''
    }
  }
  if (!jsonText) throw new Error('Empty response from model')
  console.log('Model output:', JSON.parse(jsonText))
  return JSON.parse(jsonText)
}
