<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Card from 'primevue/card'
import RequestForm from '../components/RequestForm.vue'
import {
  STATUS_OPTIONS,
  type RequestForm as RequestFormType,
  type RequestStatus,
} from '../types'
import {
  listRequests,
  updateRequest,
  changeStatus,
  deleteRequest,
} from '../api'

const loading = ref(false)
const error = ref<string | null>(null)
const requests = ref<RequestFormType[]>([])
const selected = ref<RequestFormType | null>(null)
const display = ref(false)

onMounted(load)

async function load() {
  console.log('Loading requests...')
  loading.value = true
  try {
    requests.value = await listRequests()
  } catch (e: any) {
    error.value = e.message ?? 'Failed to load requests'
  } finally {
    loading.value = false
  }
}

function statusSeverity(s: RequestStatus) {
  return s === 'closed' ? 'success' : s === 'in_progress' ? 'info' : 'secondary'
}

async function onSave(v: RequestFormType) {
  if (!v.id) return
  const updated = await updateRequest(v.id, v)
  const i = requests.value.findIndex((r) => r.id === updated.id)
  if (i >= 0) requests.value[i] = updated
  selected.value = updated
  display.value = false // close dialog after save
}
async function onChangeStatus(v: RequestFormType, status: RequestStatus) {
  if (!v.id) return
  const updated = await changeStatus(v.id, status)
  const i = requests.value.findIndex((r) => r.id === updated.id)
  if (i >= 0) requests.value[i] = updated
}

async function onDelete(v: RequestFormType) {
  if (!v.id) return
  await deleteRequest(v.id)
  requests.value = requests.value.filter((r) => r.id !== v.id)
  if (selected.value?.id === v.id) {
    selected.value = null
    display.value = false
  }
}

defineExpose({ reload: load })
</script>

<template>
  <div class="space-y-4">
    <Message v-if="error" severity="error">{{ error }}</Message>
    <DataTable
      :value="requests"
      :loading="loading"
      dataKey="id"
      paginator
      :rows="10"
      selectionMode="single"
    >
      <!-- @row-dblclick="(e:any)=>{ selected=e.data; display=true; }" -->
      <!-- <Column field="id" header="ID" style="width: 10rem" /> -->
      <Column field="title" header="Title" />
      <Column field="requestorName" header="Requestor" />
      <Column field="vendorName" header="Vendor" />
      <Column
        field="totalCost"
        header="Total"
        :body="(row:any)=> new Intl.NumberFormat('de-DE',{style:'currency', currency:'EUR'}).format(row.totalCost || 0)"
      />
      <Column header="Status">
        <template #body="slotProps">
          <Tag
            :value="
              STATUS_OPTIONS.find(
                (option) => option.value === slotProps.data.status
              )?.label
            "
            :severity="statusSeverity(slotProps.data.status)"
          />
        </template>
      </Column>
      <Column header="Actions">
        <template #body="slotProps">
          <div class="flex gap-2">
            <Button
              label="Edit"
              size="small"
              icon="pi pi-file-edit"
              @click="
                () => {
                  selected = slotProps.data
                  display = true
                }
              "
            />
            <Button
              label="Delete"
              size="small"
              severity="danger"
              icon="pi pi-trash"
              @click="() => onDelete(slotProps.data)"
            />
            <!-- <Button
              label="In Progress"
              size="small"
              severity="info"
              @click="() => onChangeStatus(slotProps.data, 'in_progress')"
            />
            <Button
              label="Close"
              size="small"
              severity="success"
              @click="() => onChangeStatus(slotProps.data, 'closed')"
            /> -->
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog
      v-model:visible="display"
      modal
      header="Request Details"
      :style="{ width: '70vw' }"
      :breakpoints="{ '960px': '90vw', '640px': '95vw' }"
    >
      <Card v-if="selected">
        <template #title>Filled Form</template>
        <template #content>
          <RequestForm
            v-model="(selected as any)"
            submit-label="Save"
            @submit="onSave"
          />
        </template>
      </Card>
    </Dialog>
  </div>
</template>

<style scoped></style>
