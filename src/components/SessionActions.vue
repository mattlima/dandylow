<template>
  <div class="action-buttons">
    <button class="btn btn-primary" @click="nextNote">Next Note</button>
    <button class="btn btn-secondary" @click="resetSession">Reset Session</button>
  </div>
</template>

<script setup lang="ts">
import { useNoteSession } from '../composables/useNoteSession';

const { nextNote, resetSession } = useNoteSession();
</script>
