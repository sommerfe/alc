<script setup lang="ts">
import { reactive, watch, computed, nextTick, onMounted, ref } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { listCommodityGroups } from '../api'
import type {
  CommodityGroup,
  OrderLine,
  RequestForm as RequestFormType,
} from '../types'
import { STATUS_OPTIONS } from '../types'

const props = defineProps<{
  modelValue: RequestFormType
  submitLabel?: string
  busy?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: RequestFormType): void
  (e: 'submit', value: RequestFormType): void
}>()

function withLineIds(model: RequestFormType): RequestFormType {
  return {
    ...model,
    orderLines: (model.orderLines || []).map((l) => {
      const id =
        l.id ?? crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)
      let discount: any = l.discount ?? null
      if (discount == null && l.discountType && l.discountValue != null) {
        discount =
          l.discountType === 'percent'
            ? `${Number(l.discountValue)}` + '%'
            : Number(l.discountValue)
      }
      return { id, ...l, discount }
    }),
  }
}

const form = reactive<RequestFormType>(withLineIds({ ...props.modelValue }))

let internalUpdate = false
let applyingFromParent = false

watch(
  () => props.modelValue,
  async (v) => {
    if (internalUpdate) return
    applyingFromParent = true
    Object.assign(form, withLineIds({ ...v }))

    await nextTick()

    applyingFromParent = false
  },
  { deep: true }
)

watch(
  form,
  async (v) => {
    if (applyingFromParent) return
    internalUpdate = true
    emit('update:modelValue', { ...v })

    await nextTick()

    internalUpdate = false
  },
  { deep: true }
)

const statusOptions = STATUS_OPTIONS

const groups = ref<CommodityGroup[]>([])

onMounted(async () => {
  try {
    groups.value = await listCommodityGroups()
  } catch (e) {
    // fallback: keep empty, validation will show error
  }
})

const errors = computed<Record<string, string>>(() => {
  const e: Record<string, string> = {}
  if (!form.requestorName?.trim())
    e.requestorName = 'Requestor name is required'
  if (!form.title?.trim()) e.title = 'Title is required'
  if (!form.vendorName?.trim()) e.vendorName = 'Vendor name is required'
  if (!form.vatId?.trim()) e.vatId = 'VAT ID is required'
  if (!form.commodityGroupId?.trim())
    e.commodityGroupId = 'Commodity group is required'
  if (!form.department?.trim()) e.department = 'Department is required'
  if (!form.orderLines?.length)
    e.orderLines = 'At least one order line is required'

  // Per-line validations
  if (
    form.orderLines?.length &&
    form.orderLines.some((l) => !l.positionDescription?.trim())
  ) {
    e.orderLinesPositionDescription =
      'Each order line must have a position description'
  }
  if (
    form.orderLines?.length &&
    form.orderLines.some(
      (l) =>
        l.unitPrice === null ||
        l.unitPrice === undefined ||
        Number.isNaN(Number(l.unitPrice))
    )
  ) {
    e.orderLinesUnitPrice = 'Each order line must have a unit price'
  }
  if (
    form.orderLines?.length &&
    form.orderLines.some(
      (l) =>
        l.amount === null ||
        l.amount === undefined ||
        Number.isNaN(Number(l.amount))
    )
  ) {
    e.orderLinesAmount = 'Each order line must have an amount'
  }
  if (form.orderLines?.length && form.orderLines.some((l) => !l.unit?.trim())) {
    e.orderLinesUnit = 'Each order line must have a unit'
  }

  if (form.totalCost == null || form.totalCost < 0)
    e.totalCost = 'Total cost must be >= 0'
  return e
})

const isValid = computed(() => Object.keys(errors.value).length === 0)

// Update recalc to apply discount
function recalc() {
  form.orderLines.forEach((l) => {
    const unitPrice = Number(l.unitPrice) || 0
    const amount = Number(l.amount) || 0
    const base = unitPrice * amount

    let total = base
    const d = l.discount
    if (typeof d === 'string' && d.trim()) {
      const s = d.trim()
      if (/%$/.test(s)) {
        const v = Math.abs(Number(s.slice(0, -1).replace(',', '.'))) // percent magnitude
        if (Number.isFinite(v) && v > 0) total = base * (1 - v / 100)
      } else {
        const v = Math.abs(Number(s.replace(',', '.'))) // absolute magnitude
        if (Number.isFinite(v) && v > 0) total = base - v
      }
    } else if (typeof d === 'number') {
      const v = Math.abs(Number(d)) // absolute magnitude
      if (Number.isFinite(v) && v > 0) total = base - v
    } else if (l.discountType && l.discountValue != null) {
      const v = Math.abs(Number(l.discountValue))
      if (l.discountType === 'percent' && Number.isFinite(v) && v > 0)
        total = base * (1 - v / 100)
      if (l.discountType === 'absolute' && Number.isFinite(v) && v > 0)
        total = base - v
    }

    if (!Number.isFinite(total) || total < 0) total = 0
    l.totalPrice = Math.round(total * 100) / 100
  })
  const linesSum = form.orderLines.reduce(
    (s, l) => s + (Number(l.totalPrice) || 0),
    0
  )
  const extras = Number((form as any).extras) || 0
  form.totalCost = linesSum + extras
}

// Ensure new lines have no defaults (discount optional)
function addLine() {
  if (!form.orderLines) form.orderLines = []
  const line: OrderLine = {
    id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
    positionDescription: '',
    unitPrice: null as unknown as number,
    amount: null as unknown as number,
    unit: '',
    discount: null, // single input
    totalPrice: 0,
  }
  form.orderLines.push(line)
}

function onSubmit() {
  if (!isValid.value) return
  emit('submit', { ...form })
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label class="text-sm">Requestor Name</label>
      <InputText
        v-model.trim="form.requestorName"
        :invalid="!!errors.requestorName"
        class="w-full"
        placeholder="John Doe"
      />
      <div class="h-4 mt-1">
        <small v-if="errors.requestorName" class="text-red-500 text-xs">
          {{ errors.requestorName }}
        </small>
      </div>
    </div>

    <div>
      <label class="text-sm">Title / Short Description</label>
      <InputText
        v-model.trim="form.title"
        :invalid="!!errors.title"
        class="w-full"
        placeholder="Adobe Creative Cloud Subscription"
      />
      <div class="h-4 mt-1">
        <small v-if="errors.title" class="text-red-500 text-xs">
          {{ errors.title }}
        </small>
      </div>
    </div>

    <div>
      <label class="text-sm">Vendor Name</label>
      <InputText
        v-model.trim="form.vendorName"
        :invalid="!!errors.vendorName"
        class="w-full"
        placeholder="Adobe Systems"
      />
      <div class="h-4 mt-1">
        <small v-if="errors.vendorName" class="text-red-500 text-xs">
          {{ errors.vendorName }}
        </small>
      </div>
    </div>

    <div>
      <label class="text-sm">VAT ID</label>
      <InputText
        v-model.trim="form.vatId"
        :invalid="!!errors.vatId"
        class="w-full"
        placeholder="DE123456789"
      />
      <div class="h-4 mt-1">
        <small v-if="errors.vatId" class="text-red-500 text-xs">
          {{ errors.vatId }}
        </small>
      </div>
    </div>

    <div>
      <label class="block mb-1 text-sm">Commodity Group</label>
      <Dropdown
        v-model="form.commodityGroupId"
        :options="groups"
        optionLabel="group"
        optionValue="id"
        :filter="true"
        class="w-full"
        :invalid="!!errors.commodityGroupId"
        :item-content="(opt:any) => `${opt.id} • ${opt.category} • ${opt.group}`"
        showClear
      />
      <div class="h-4 mt-1">
        <small v-if="errors.commodityGroupId" class="text-red-500 text-xs">
          {{ errors.commodityGroupId }}
        </small>
      </div>
    </div>

    <div>
      <label class="text-sm">Department</label>
      <InputText
        v-model.trim="form.department"
        :invalid="!!errors.department"
        class="w-full"
        placeholder="HR"
      />
      <div class="h-4 mt-1">
        <small v-if="errors.department" class="text-red-500 text-xs">
          {{ errors.department }}
        </small>
      </div>
    </div>

    <div>
      <label class="text-sm">Status</label>
      <Dropdown
        v-model="form.status"
        :options="statusOptions"
        optionLabel="label"
        optionValue="value"
        class="w-full"
        placeholder="Select status"
      />
    </div>
  </div>

  <div class="mt-6">
    <div class="flex items-center justify-between mb-2">
      <h3 class="font-semibold">Order Lines</h3>
      <Button
        label="Add Line"
        icon="pi pi-plus"
        size="small"
        @click="addLine"
      />
    </div>
    <DataTable :value="form.orderLines" dataKey="id">
      <Column header="#" style="width: 4rem">
        <template #body="slotProps">{{ slotProps.index + 1 }}</template>
      </Column>

      <Column header="Position Description">
        <template #body="slotProps">
          <InputText
            v-model="slotProps.data.positionDescription"
            class="w-full"
            :invalid="!slotProps.data.positionDescription?.trim()"
            placeholder="Adobe Photoshop License"
          />
          <div class="h-4 mt-1">
            <small
              v-if="!slotProps.data.positionDescription?.trim()"
              class="text-red-500 text-xs"
            >
              Position description is required
            </small>
          </div>
        </template>
      </Column>

      <Column header="Unit Price" style="width: 12rem">
        <template #body="slotProps">
          <InputNumber
            v-model="slotProps.data.unitPrice"
            mode="currency"
            currency="EUR"
            locale="de-DE"
            class="w-full"
            :invalid="
              slotProps.data.unitPrice === null ||
              slotProps.data.unitPrice === undefined ||
              Number.isNaN(Number(slotProps.data.unitPrice))
            "
            placeholder="0,00"
            @update:modelValue="recalc"
          />
          <div class="h-4 mt-1">
            <small
              v-if="
                slotProps.data.unitPrice === null ||
                slotProps.data.unitPrice === undefined ||
                Number.isNaN(Number(slotProps.data.unitPrice))
              "
              class="text-red-500 text-xs"
            >
              Unit price is required
            </small>
          </div>
        </template>
      </Column>

      <Column header="Amount" style="width: 10rem">
        <template #body="slotProps">
          <InputNumber
            v-model="slotProps.data.amount"
            mode="decimal"
            :useGrouping="false"
            :step="0.1"
            :minFractionDigits="0"
            :maxFractionDigits="3"
            class="w-full"
            :invalid="
              slotProps.data.amount === null ||
              slotProps.data.amount === undefined ||
              Number.isNaN(Number(slotProps.data.amount))
            "
            placeholder="5"
            @update:modelValue="recalc"
          />
          <div class="h-4 mt-1">
            <small
              v-if="
                slotProps.data.amount === null ||
                slotProps.data.amount === undefined ||
                Number.isNaN(Number(slotProps.data.amount))
              "
              class="text-red-500 text-xs"
            >
              Amount is required
            </small>
          </div>
        </template>
      </Column>

      <Column header="Unit" style="width: 10rem">
        <template #body="slotProps">
          <InputText
            v-model="slotProps.data.unit"
            class="w-full"
            :invalid="!slotProps.data.unit?.trim()"
            placeholder="licenses"
          />
          <div class="h-4 mt-1">
            <small
              v-if="!slotProps.data.unit?.trim()"
              class="text-red-500 text-xs"
              >Unit is required</small
            >
          </div>
        </template>
      </Column>

      <!-- Discount: single input that accepts 10 or 10% -->
      <Column header="Discount" style="width: 14rem">
        <template #body="slotProps">
          <InputText
            v-model="slotProps.data.discount as any"
            class="w-full"
            placeholder="10% or 5"
            @input="recalc"
          />
          <div class="h-4 mt-1"></div>
        </template>
      </Column>

      <Column header="Total Price" style="width: 12rem">
        <template #body="slotProps">
          {{
            new Intl.NumberFormat('de-DE', {
              style: 'currency',
              currency: 'EUR',
            }).format(slotProps.data.totalPrice || 0)
          }}
        </template>
      </Column>
    </DataTable>
    <div class="flex justify-end mt-3">
      <div class="text-right">
        <!-- Other Costs input (editable, included in total) -->
        <div class="mb-2">
          <div class="text-sm text-surface-600">Other Costs (taxes, fees)</div>
          <InputNumber
            v-model="(form as any).extras"
            mode="currency"
            currency="EUR"
            locale="de-DE"
            class="w-40 md:w-48"
            placeholder="0,00"
            :disabled="busy"
            @update:modelValue="recalc"
          />
          <div class="h-4 mt-1">
            <!-- reserved space for potential error/help text -->
          </div>
        </div>

        <div class="text-sm text-surface-600">Total Cost</div>
        <div class="text-lg font-semibold">
          {{
            new Intl.NumberFormat('de-DE', {
              style: 'currency',
              currency: 'EUR',
            }).format(form.totalCost || 0)
          }}
        </div>
        <div class="h-4 mt-1">
          <small v-if="errors.totalCost" class="text-red-500 text-xs">
            {{ errors.totalCost }}
          </small>
        </div>
      </div>
    </div>
  </div>

  <div class="mt-6">
    <Button
      :label="submitLabel ?? 'Save'"
      :disabled="!isValid || busy"
      icon="pi pi-save"
      @click="onSubmit"
    />
  </div>
</template>

<style scoped>
/* Keep placeholder gray when invalid (PrimeVue adds .p-invalid) */
:deep(.p-inputtext.p-invalid::placeholder) {
  color: #6b7280 !important; /* gray-500 */
  opacity: 1;
}

:deep(.p-inputnumber-input.p-invalid::placeholder),
:deep(.p-inputnumber.p-invalid .p-inputnumber-input::placeholder) {
  color: #6b7280 !important;
  opacity: 1;
}

/* Dropdown shows placeholder in label element */
:deep(.p-dropdown.p-invalid .p-dropdown-label.p-placeholder) {
  color: #6b7280 !important;
  opacity: 1;
}
</style>
