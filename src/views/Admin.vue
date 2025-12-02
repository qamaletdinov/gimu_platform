<template>
  <v-container>
    <h1 class="mb-4">Панель администратора</h1>
    <v-row>
      <!-- Левая колонка: Создание и Загрузка -->
      <v-col cols="12" md="5">
        <v-card class="mb-4">
          <v-card-title>Создать новый курс</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="createCourse">
              <v-text-field v-model="courseName" label="Название курса" required></v-text-field>
              <v-textarea v-model="courseDescription" label="Описание курса"></v-textarea>
              <v-btn type="submit" color="primary" :loading="createLoading">Создать</v-btn>
              <v-alert v-if="createMessage" :type="createMessageType" class="mt-4">{{ createMessage }}</v-alert>
            </v-form>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title>Загрузить файл к курсу</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="uploadFile">
              <v-select v-model="selectedCourseForUpload" :items="courses" item-title="name" item-value="id" label="Выберите курс" required></v-select>
              <v-file-input v-model="fileToUpload" label="Выберите файл" required></v-file-input>
              <v-btn type="submit" color="primary" :loading="uploadLoading">Загрузить</v-btn>
              <v-alert v-if="uploadMessage" :type="uploadMessageType" class="mt-4">{{ uploadMessage }}</v-alert>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Правая колонка: Список курсов -->
      <v-col cols="12" md="7">
        <v-card>
          <v-card-title>Существующие курсы</v-card-title>
          <v-list>
            <v-list-item v-for="course in courses" :key="course.id">
              <v-list-item-title>{{ course.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ course.description }}</v-list-item-subtitle>
              <template v-slot:append>
                <v-btn icon="mdi-delete" color="error" variant="text" @click="deleteCourse(course.id)"></v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getBackendUrl, getToken } from '@/utils/api'; // Импортируем

const courseName = ref('');
const courseDescription = ref('');
const createMessage = ref('');
const createMessageType = ref('success');
const createLoading = ref(false);

const courses = ref([]);
const selectedCourseForUpload = ref(null);
const fileToUpload = ref(null);
const uploadMessage = ref('');
const uploadMessageType = ref('success');
const uploadLoading = ref(false);

const fetchCourses = async () => {
  try {
    const response = await fetch(`${getBackendUrl()}/api/courses`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!response.ok) throw new Error('Не удалось загрузить курсы.');
    courses.value = await response.json();
    if (courses.value.length > 0 && !selectedCourseForUpload.value) {
      selectedCourseForUpload.value = courses.value[0].id;
    }
  } catch (err) {
    console.error(err);
  }
};

onMounted(fetchCourses);

const createCourse = async () => {
  createMessage.value = '';
  createLoading.value = true;
  try {
    const response = await fetch(`${getBackendUrl()}/api/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify({ name: courseName.value, description: courseDescription.value }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    
    createMessageType.value = 'success';
    createMessage.value = `Курс "${data.name}" успешно создан!`;
    courseName.value = '';
    courseDescription.value = '';
    await fetchCourses(); // Обновляем список курсов
  } catch (err) {
    createMessageType.value = 'error';
    createMessage.value = err.message;
  } finally {
    createLoading.value = false;
  }
};

const uploadFile = async () => {
  const file = fileToUpload.value;
  if (!file || !selectedCourseForUpload.value) {
    uploadMessageType.value = 'error';
    uploadMessage.value = 'Выберите курс и файл.';
    return;
  }
  uploadMessage.value = '';
  uploadLoading.value = true;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${getBackendUrl()}/api/courses/${selectedCourseForUpload.value}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    uploadMessageType.value = 'success';
    uploadMessage.value = data.message;
    fileToUpload.value = null;
  } catch (err) {
    uploadMessageType.value = 'error';
    uploadMessage.value = err.message;
  } finally {
    uploadLoading.value = false;
  }
};

const deleteCourse = async (courseId) => {
  if (!confirm('Вы уверены, что хотите удалить этот курс? Это действие необратимо.')) {
    return;
  }
  try {
    const response = await fetch(`${getBackendUrl()}/api/courses/${courseId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    await fetchCourses(); // Обновляем список курсов
  } catch (err) {
    console.error(err);
  }
};
</script>
