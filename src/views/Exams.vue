<template>
  <v-container>
    <h1 class="mb-4">Подготовка к экзамену</h1>
    <v-card>
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
        <v-file-input
          v-model="questionsFile"
          label="Выберите файл с вопросами (.txt)"
          accept=".txt"
          required
        ></v-file-input>
        <v-btn type="submit" color="primary" :loading="loading">Получить ответы</v-btn>
        <v-alert v-if="error" type="error" class="mt-4">{{ error }}</v-alert>
      </v-card-text>
    </v-card>

    <v-card v-if="loading" class="mt-4 d-flex justify-center align-center" min-height="200">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-card>

    <v-card v-if="answers.length > 0" class="mt-4">
      <v-card-title>Ответы на вопросы</v-card-title>
      <v-list lines="three">
        <v-list-item v-for="(item, index) in answers" :key="index">
          <v-list-item-title class="font-weight-bold">{{ item.question }}</v-list-item-title>
          <v-list-item-subtitle style="white-space: pre-wrap;">{{ item.answer }}</v-list-item-subtitle>
          <v-divider v-if="index < answers.length - 1" class="my-2"></v-divider>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getBackendUrl, getToken } from '@/utils/api'; // Импортируем

const courses = ref([]);
const selectedCourse = ref(null);
const questionsFile = ref(null);
const answers = ref([]);
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

const prepareForExam = async () => {
  const file = questionsFile.value;
  if (!file || !selectedCourse.value) {
    error.value = 'Выберите курс и файл с вопросами.';
    return;
  }
  loading.value = true;
  answers.value = [];
  error.value = '';

  const formData = new FormData();
  formData.append('questionsFile', file);
  formData.append('courseId', selectedCourse.value);

  try {
    const response = await fetch(`${getBackendUrl()}/api/exams/prepare`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Не удалось получить ответы.');
    }
    answers.value = data;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>
