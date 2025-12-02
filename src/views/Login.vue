<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Вход</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form @submit.prevent="login">
              <v-text-field
                v-model="email"
                label="Email"
                name="login"
                prepend-icon="mdi-account"
                type="text"
              ></v-text-field>
              <v-text-field
                v-model="password"
                id="password"
                label="Пароль"
                name="password"
                prepend-icon="mdi-lock"
                type="password"
              ></v-text-field>
              <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
              <v-card-actions>
                <v-btn color="secondary" to="/register">Регистрация</v-btn>
                <v-spacer></v-spacer>
                <v-btn type="submit" color="primary">Войти</v-btn>
              </v-card-actions>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getBackendUrl } from '@/utils/api'; // Импортируем

const email = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();

const login = async () => {
  error.value = '';
  try {
    const response = await fetch(`${getBackendUrl()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to login');
    }
    localStorage.setItem('token', data.token);
    router.push('/');
  } catch (err) {
    error.value = err.message;
  }
};
</script>
