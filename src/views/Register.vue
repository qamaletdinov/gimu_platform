<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Регистрация</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form @submit.prevent="register">
              <v-text-field
                v-model="email"
                label="Email"
                name="email"
                prepend-icon="mdi-account"
                type="text"
                required
              ></v-text-field>
              <v-text-field
                v-model="password"
                id="password"
                label="Пароль"
                name="password"
                prepend-icon="mdi-lock"
                type="password"
                required
              ></v-text-field>
              <v-text-field
                v-model="confirmPassword"
                label="Повторите пароль"
                name="confirmPassword"
                prepend-icon="mdi-lock-check"
                type="password"
                required
              ></v-text-field>
              <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
              <v-alert v-if="successMessage" type="success" class="mb-4">{{ successMessage }}</v-alert>
              <v-card-actions>
                <v-btn color="secondary" to="/login">Уже есть аккаунт?</v-btn>
                <v-spacer></v-spacer>
                <v-btn type="submit" color="primary">Зарегистрироваться</v-btn>
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
import { getBackendUrl } from '@/utils/api';

const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const successMessage = ref('');
const router = useRouter();

const register = async () => {
  error.value = '';
  successMessage.value = '';

  if (password.value !== confirmPassword.value) {
    error.value = 'Пароли не совпадают.';
    return;
  }

  try {
    const response = await fetch(`${getBackendUrl()}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Ошибка регистрации');
    }
    successMessage.value = 'Регистрация успешна! Теперь вы можете войти.';
    email.value = '';
    password.value = '';
    confirmPassword.value = '';
  } catch (err) {
    error.value = err.message;
  }
};
</script>
