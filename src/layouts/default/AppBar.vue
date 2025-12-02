<template>
  <v-app-bar flat>
    <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
    <v-app-bar-title>
      <v-icon icon="mdi-school" />
      GIMU Platform
    </v-app-bar-title>
  </v-app-bar>

  <v-navigation-drawer v-model="drawer" :permanent="$vuetify.display.mdAndUp" :temporary="!$vuetify.display.mdAndUp" expand-on-hover rail>
    <v-list>
      <v-list-item
        prepend-avatar="https://randomuser.me/api/portraits/women/85.jpg"
        :title="userEmail"
        subtitle="Студент"
      ></v-list-item>
    </v-list>

    <v-divider></v-divider>

    <v-list density="compact" nav>
      <v-list-item prepend-icon="mdi-home" title="Главная" value="home" to="/"></v-list-item>
      <v-list-item prepend-icon="mdi-book-open-variant" title="Курсы" value="courses" to="/courses"></v-list-item>
      <v-list-item prepend-icon="mdi-calendar-clock" title="Расписание" value="schedule" to="/schedule"></v-list-item>
      <v-list-item prepend-icon="mdi-head-question" title="Домашка (RAG)" value="homework" to="/homework"></v-list-item>
      <v-list-item prepend-icon="mdi-school" title="Экзамены" value="exams" to="/exams"></v-list-item>
      <v-list-item v-if="isAdmin" prepend-icon="mdi-shield-crown" title="Админка" value="admin" to="/admin"></v-list-item>
    </v-list>

     <template v-slot:append>
        <div class="pa-2">
          <v-btn block color="red" @click="logout">
            Выйти
          </v-btn>
        </div>
      </template>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { jwtDecode } from 'jwt-decode';
import { useDisplay } from 'vuetify';
import { getToken } from '@/utils/api'; // Импортируем

const router = useRouter();
const isAdmin = ref(false);
const userEmail = ref('');
const drawer = ref(false);

const display = useDisplay();

onMounted(() => {
  const token = getToken();
  if (token) {
    const decoded = jwtDecode(token);
    isAdmin.value = decoded.role === 'admin';
    userEmail.value = decoded.email || 'Пользователь';
  }
});

const logout = () => {
  localStorage.removeItem('token');
  router.push('/login');
};
</script>
