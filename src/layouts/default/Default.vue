<template>
  <v-app>
    <default-bar />
    <default-view />
    <politician-chatbot />
  </v-app>
</template>

<script setup>
  import DefaultBar from './AppBar.vue'
  import DefaultView from './View.vue'
  import PoliticianChatbot from '@/components/PoliticianChatbot.vue'
</script>
