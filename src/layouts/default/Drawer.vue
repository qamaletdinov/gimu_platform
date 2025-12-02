<template>
  <v-navigation-drawer v-model="appStore.drawer">
    <v-list>
      <v-list-item
        v-for="(item, i) in menuItems"
        :key="i"
        :to="item.to"
        router
        exact
      >
        <template v-slot:prepend>
          <v-icon :icon="item.icon"></v-icon>
        </template>
        <v-list-item-title>{{ item.title }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
  import { ref } from 'vue';
  import { useAppStore } from '@/store/app';

  const appStore = useAppStore();

  const menuItems = ref([
    { title: 'Учиться', icon: 'mdi-school', to: '/learn' },
    { title: 'Домашка', icon: 'mdi-home-account', to: '/homework' },
    { title: 'Расписание', icon: 'mdi-calendar', to: '/schedule' },
    { title: 'Экзамены', icon: 'mdi-book-open-variant', to: '/exams' },
    { title: 'Админка', icon: 'mdi-shield-crown', to: '/admin' },
  ]);
</script>
