<script setup lang="ts">
definePageMeta({ layout: 'app' })
const { user } = useAuth()

interface Member {
  id: string
  userName: string
  email: string | null
  phoneNumber: string | null
  isAdmin: boolean
  isMember: boolean
  duckCount: number
  lastLogin: string | null
}

const { data: members, refresh } = useFetch<Member[]>('/api/admin/members')

async function setRole(m: Member, field: 'isAdmin' | 'isMember', value: boolean) {
  await $fetch(`/api/admin/members/${m.id}`, { method: 'PUT', body: { [field]: value } })
  await refresh()
}

const deleting = ref<Member | null>(null)
const removing = ref(false)
async function del() {
  if (!deleting.value) return
  removing.value = true
  try {
    await $fetch(`/api/admin/members/${deleting.value.id}`, { method: 'DELETE' })
    deleting.value = null
    await refresh()
  } finally {
    removing.value = false
  }
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString() : '—'
}
</script>

<template>
  <v-container class="py-8">
    <h1 class="text-h4 font-weight-bold mb-6">Admin · Members</h1>
    <v-alert v-if="user && !user.isAdmin" type="error" variant="tonal">Admins only.</v-alert>

    <v-card v-else>
      <v-table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th class="text-center">Admin</th>
            <th class="text-center">Member</th>
            <th class="text-center">Ducks</th>
            <th>Last login</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in members" :key="m.id">
            <td>{{ m.userName }}</td>
            <td class="text-medium-emphasis">{{ m.email || m.phoneNumber || '—' }}</td>
            <td class="text-center">
              <v-switch
                :model-value="m.isAdmin"
                color="deep-purple"
                density="compact"
                hide-details
                :disabled="m.id === user?.id"
                @update:model-value="(v) => setRole(m, 'isAdmin', !!v)"
              />
            </td>
            <td class="text-center">
              <v-switch
                :model-value="m.isMember"
                color="primary"
                density="compact"
                hide-details
                @update:model-value="(v) => setRole(m, 'isMember', !!v)"
              />
            </td>
            <td class="text-center">{{ m.duckCount }}</td>
            <td>{{ fmtDate(m.lastLogin) }}</td>
            <td>
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                color="error"
                :disabled="m.id === user?.id"
                @click="deleting = m"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-dialog :model-value="!!deleting" max-width="440" @update:model-value="deleting = null">
      <v-card>
        <v-card-title>Delete member?</v-card-title>
        <v-card-text>
          This soft-deletes <strong>{{ deleting?.userName }}</strong> and any ducks only they have
          sighted.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleting = null">Cancel</v-btn>
          <v-btn color="error" :loading="removing" @click="del">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
