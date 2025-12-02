<template>
  <v-container>
    <h1 class="mb-4">Домашка (RAG)</h1>
    <v-card class="mb-4">
      <v-card-text>
        <v-select
          v-model="selectedCourse"
          :items="courses"
          item-title="name"
          item-value="id"
          label="Выберите курс"
          required
          class="mb-4"
        ></v-select>
        <v-textarea
          v-model="question"
          label="Ваш вопрос по материалам курса"
          rows="3"
          required
          class="mb-4"
        ></v-textarea>
        <v-btn color="primary" @click="askQuestion" :loading="loading">Спросить</v-btn>
        <v-alert v-if="error" type="error" class="mt-4">{{ error }}</v-alert>
      </v-card-text>
    </v-card>

    <v-card v-if="loading" class="mt-4 d-flex justify-center align-center" min-height="200">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-card>

    <v-card v-if="answer" class="mt-4">
      <v-card-title>Ответ ассистента</v-card-title>
      <v-card-text style="white-space: pre-wrap;">{{ answer }}</v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getBackendUrl, getToken } from '@/utils/api'; // Импортируем

const courses = ref([]);
const selectedCourse = ref(null);
const question = ref('');
const answer = ref('');
const loading = ref(false);
const error = ref('');

onMounted(async () => {
  try {
    const response = await fetch(`${getBackendUrl()}/api/courses`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!response.ok) throw new Error('Не удалось загрузить курсы.');
    courses.value = await response.json();
    if (courses.value.length > 0) {
      selectedCourse.value = courses.value[0].id;
    }
  } catch (err) {
    error.value = err.message;
  }
});

const askQuestion = async () => {
  if (!selectedCourse.value || !question.value) {
    error.value = 'Выберите курс и введите вопрос.';
    return;
  }
  loading.value = true;
  answer.value = '';
  error.value = '';

  try {
    const response = await fetch(`${getBackendUrl()}/api/homework`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify({ taskDescription: question.value, courseId: selectedCourse.value }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Не удалось получить ответ.');
    }
    answer.value = data.content;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>
