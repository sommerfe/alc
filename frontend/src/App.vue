<script setup lang="ts">
import { ref, watch } from 'vue'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Menubar from 'primevue/menubar'
import CreateRequest from './views/CreateRequest.vue'
import FollowUp from './views/FollowUp.vue'

const activeTab = ref('create')
const followUpRef = ref<any>(null)

watch(activeTab, (val) => {
  console.log('Active tab changed to', val)
  if (val === 'follow') {
    // call the exposed reload() on FollowUp whenever the tab is opened
    followUpRef.value?.reload?.()
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <Menubar>
      <template #start>
        <div class="text-lg font-semibold">AskLia</div>
      </template>
    </Menubar>

    <div class="container mx-auto p-4 flex-1">
      <Tabs v-model:value="activeTab">
        <TabList>
          <Tab value="create">Create Request</Tab>
          <Tab value="follow">Follow Up</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="create">
            <CreateRequest />
          </TabPanel>
          <TabPanel value="follow">
            <FollowUp ref="followUpRef" />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </div>
</template>

<style scoped></style>
