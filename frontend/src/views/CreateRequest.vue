<script setup lang="ts">
import { ref } from 'vue'
import FileUpload from 'primevue/fileupload'
import Card from 'primevue/card'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner' // <-- add
import RequestForm from '../components/RequestForm.vue'
import type { RequestForm as RequestFormType } from '../types'
import { extractFromPdf, extractFromText, createRequest } from '../api'

const busy = ref(false)
const error = ref<string | null>(null)
const info = ref<string | null>(null)
const currentFileName = ref<string | null>(null) // <-- add

const model = ref<RequestFormType>({
  requestorName: '',
  title: '',
  vendorName: '',
  vatId: '',
  department: '',
  commodityGroupId: '', // required
  orderLines: [],
  totalCost: 0,
  status: 'open',
})

async function onSelect(event: any) {
  const file: File | undefined = event.files?.[0]
  if (!file) return
  currentFileName.value = file.name // <-- add
  try {
    busy.value = true
    error.value = null
    info.value = `Extracting fields from PDF (${currentFileName.value})...` // <-- add
    const result = await extractFromPdf(file)
    Object.assign(model.value, result.fields)
    info.value = `Fields extracted from ${currentFileName.value}. Review and complete the form.` // <-- add
  } catch (e: any) {
    error.value = e.message ?? 'Failed to extract from PDF'
  } finally {
    busy.value = false
  }
}

const pasted = ref('')

async function onExtractText() {
  if (!pasted.value.trim()) return
  try {
    busy.value = true
    error.value = null
    info.value = 'Extracting fields from text...'
    const result = await extractFromText(pasted.value)
    Object.assign(model.value, result.fields)
    info.value = 'Fields extracted. Review and complete the form.'
  } catch (e: any) {
    error.value = e.message ?? 'Failed to extract from text'
  } finally {
    busy.value = false
  }
}

async function onSubmit(form: RequestFormType) {
  try {
    busy.value = true
    error.value = null
    info.value = 'Saving request...'
    const saved = await createRequest(form)
    // Clear the entire form after a successful save
    Object.assign(model.value, {
      requestorName: '',
      title: '',
      vendorName: '',
      vatId: '',
      department: '',
      commodityGroupId: '', // required
      orderLines: [],
      totalCost: 0,
      status: 'open',
      extras: null,
    } as RequestFormType)
    pasted.value = ''
    info.value = 'Saved successfully. Form cleared.'
  } catch (e: any) {
    error.value = e.message ?? 'Save failed'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <Card>
      <template #title>Upload PDF</template>
      <template #content>
        <FileUpload
          name="file"
          mode="basic"
          accept="application/pdf"
          chooseLabel="Choose PDF"
          :auto="true"
          customUpload
          @select="onSelect"
          :disabled="busy"
        />
        <p class="text-sm text-surface-500 mt-2">
          Optionally paste text if no PDF is available.
        </p>
      </template>
    </Card>

    <Divider />

    <Card>
      <template #title>Paste Text (Optional)</template>
      <template #content>
        <div class="flex gap-2 items-start">
          <Textarea
            v-model="pasted"
            rows="5"
            auto-resize
            class="w-full"
            placeholder="Paste text content here..."
            :disabled="busy"
          />
          <div class="flex items-center gap-2">
            <Button
              label="Extract"
              icon="pi pi-bolt"
              @click="onExtractText"
              :disabled="busy || !pasted"
            />
          </div>
        </div>
      </template>
    </Card>

    <Divider />

    <Card>
      <template #title>Request Form</template>
      <template #content>
        <div class="space-y-4">
          <Message v-if="error" severity="error">{{ error }}</Message>
          <Message v-if="info" severity="info">
            <span class="inline-flex items-center gap-2">
              <span>{{ info }}</span>
              <ProgressSpinner
                v-if="busy"
                style="width: 20px; height: 20px"
                strokeWidth="8"
              />
            </span>
          </Message>

          <RequestForm
            v-model="model"
            :busy="busy"
            submit-label="Save"
            @submit="onSubmit"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped></style>
