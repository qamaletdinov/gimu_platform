<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12" @keyup.enter="handleRegister">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Регистрация</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form>
              <v-text-field
                label="Email"
                v-model="email"
                prepend-icon="mdi-account"
                type="email"
                required
              ></v-text-field>
              <v-text-field
                label="Пароль"
                v-model="password"
                prepend-icon="mdi-lock"
                type="password"
                required
              ></v-text-field>
              <v-alert v-if="error" type="error" dense class="mb-4">{{ error }}</v-alert>
              <v-alert v-if="success" type="success" dense class="mb-4">{{ success }}</v-alert>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn to="/login" text>Вход</v-btn>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="handleRegister" :loading="loading">Зарегистрироваться</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const error = ref('');
const success = ref('');
const loading = ref(false);
const router = useRouter();

const handleRegister = async () => {
  error.value = '';
  success.value = '';
  loading.value = true;

  try {
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Не удалось зарегистрироваться.');
    }

    success.value = 'Регистрация прошла успешно! Перенаправляем на страницу входа...';
    setTimeout(() => {
      router.push('/login');
    }, 2000);

  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>
