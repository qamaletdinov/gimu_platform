<template>
  <v-navigation-drawer v-model="drawer" app>
    <v-list>
      <v-list-item
        v-for="item in menuItems"
        :key="item.text"
        :to="item.path"
        :prepend-icon="item.icon"
        :title="item.text"
        color="primary"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>

  <v-app-bar app color="primary">
    <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
    <v-toolbar-title>GIMU Platform</v-toolbar-title>
    <v-spacer></v-spacer>
    
    <v-tooltip text="Переключить тему" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props" @click="toggleTheme">
          <v-icon>{{ theme.global.current.value.dark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
        </v-btn>
      </template>
    </v-tooltip>

    <v-tooltip text="Выход" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props" @click="$emit('logout')">
          <v-icon>mdi-logout</v-icon>
        </v-btn>
      </template>
    </v-tooltip>
  </v-app-bar>

  <v-main>
    <v-container fluid class="pa-6">
      <slot></slot>
    </v-container>
  </v-main>
</template>

<script setup>
import { ref } from 'vue';
import { useTheme } from 'vuetify';

const drawer = ref(true);
const theme = useTheme();

const menuItems = [
  { text: 'Учиться', path: '/learn', icon: 'mdi-school' },
  { text: 'Домашка', path: '/homework', icon: 'mdi-home-account' }, 
  { text: 'Расписание', path: '/schedule', icon: 'mdi-calendar-month' },
  { text: 'Экзамены', path: '/exams', icon: 'mdi-star' },
  { text: 'Админка', path: '/admin', icon: 'mdi-shield-account' },
];

const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark';
};
</script>
