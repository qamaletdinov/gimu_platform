<template>
  <v-container>
    <h1 class="mb-4">Расписание</h1>
    <v-card class="mb-4">
      <v-card-text>
        <v-row align="center" justify="space-between">
          <v-col cols="12" md="8">
            <v-file-input
              v-model="fileToUpload"
              label="Выберите файл расписания (XLSX)"
              accept=".xlsx"
              hide-details
              clearable
            ></v-file-input>
          </v-col>
          <v-col cols="12" md="4">
            <v-btn 
              @click="uploadNewSchedule" 
              color="primary" 
              :loading="uploadLoading" 
              :disabled="!fileToUpload"
              block 
              size="large"
            >
              Загрузить
            </v-btn>
          </v-col>
        </v-row>
        <v-divider class="my-4" v-if="scheduleData"></v-divider>
        <v-row v-if="scheduleData" align="center">
          <v-col cols="12" md="6">
            <v-select
              v-model="selectedGroup"
              :items="scheduleData.groups"
              label="Выберите группу"
              hide-details
            ></v-select>
          </v-col>
          <v-col cols="12" md="6">
            <p class="text-center">Неделя: {{ selectedWeek }}</p>
            <v-slider
              v-model="selectedWeek"
              :min="1"
              :max="17"
              :step="1"
              thumb-label
              hide-details
            ></v-slider>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-progress-circular v-if="loading" indeterminate color="primary"></v-progress-circular>
    <v-alert v-if="error" type="error" class="mt-4">{{ error }}</v-alert>

    <v-row v-if="filteredSchedule && Object.keys(filteredSchedule).length > 0">
      <v-col
        v-for="day in daysOfWeek"
        :key="day"
        cols="12"
        md="6"
      >
        <v-card v-if="filteredSchedule[day]" elevation="2">
          <v-card-title class="text-center">{{ day.charAt(0).toUpperCase() + day.slice(1).toLowerCase() }}</v-card-title>
          <v-divider></v-divider>
          <v-list lines="three">
            <v-list-item v-for="(item, index) in filteredSchedule[day]" :key="index">
              <template v-slot:prepend>
                <v-chip :color="getColorForType(item.type)" class="mr-4 font-weight-bold">{{ item.time }}</v-chip>
              </template>
              <v-list-item-title style="white-space: normal; word-break: break-word;">{{ item.details }}</v-list-item-title>
              <v-list-item-subtitle>{{ item.type }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
    <v-alert v-if="scheduleData && Object.keys(filteredSchedule).length === 0 && !loading" type="info" class="mt-4">
      На этой неделе для выбранной группы пар нет.
    </v-alert>
    <v-alert v-if="!scheduleData && !loading && !error" type="info" class="mt-4">
      Расписание еще не загружено. Загрузите файл, чтобы увидеть расписание.
    </v-alert>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const scheduleData = ref(null);
const selectedGroup = ref('');
const selectedWeek = ref(getCurrentWeek());
const loading = ref(true);
const uploadLoading = ref(false);
const error = ref('');
const fileToUpload = ref(null);

const daysOfWeek = ['ПОНЕДЕЛЬНИК', 'ВТОРНИК', 'СРЕДА', 'ЧЕТВЕРГ', 'ПЯТНИЦА', 'СУББОТА'];

function getCurrentWeek() {
  const startDate = new Date(new Date().getFullYear(), 8, 1);
  const now = new Date();
  const diff = now.getTime() - startDate.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const week = Math.floor(diff / oneWeek) + 1;
  return week > 0 && week <= 17 ? week : 1;
}

const fetchSchedule = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await fetch('http://localhost:3001/api/schedule', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    });
    if (!response.ok) throw new Error('Не удалось загрузить расписание.');
    
    const data = await response.json();
    if (data.schedule.length > 0) {
      scheduleData.value = data;
      if (data.groups && data.groups.length > 0 && !selectedGroup.value) {
        selectedGroup.value = data.groups[0];
      }
    } else {
      scheduleData.value = null;
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

onMounted(fetchSchedule);

const uploadNewSchedule = async () => {
  const file = fileToUpload.value;
  if (!file) {
    error.value = 'Сначала выберите файл.';
    return;
  }

  uploadLoading.value = true;
  error.value = '';

  const formData = new FormData();
  formData.append('scheduleFile', file);

  try {
    const response = await fetch('http://localhost:3001/api/schedule/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: formData,
    });
    if (!response.ok) throw new Error('Не удалось загрузить или обработать расписание.');
    
    await fetchSchedule();
    fileToUpload.value = null;

  } catch (err) {
    error.value = err.message;
  } finally {
    uploadLoading.value = false;
  }
};

// --- ИСПРАВЛЕНО ЗДЕСЬ: Правильная сортировка по времени ---
const timeToSortable = (timeStr) => {
  const startTime = timeStr.split('-')[0];
  const [hours, minutes] = startTime.replace('.', ':').split(':');
  return parseInt(hours, 10) * 100 + parseInt(minutes, 10);
};

const filteredSchedule = computed(() => {
  if (!scheduleData.value || !selectedGroup.value) return {};
  
  const groupedByDay = {};
  daysOfWeek.forEach(day => {
    const daySchedule = scheduleData.value.schedule
      .filter(item => 
        item.group === selectedGroup.value && 
        item.day.toUpperCase() === day &&
        item.weeks.includes(selectedWeek.value)
      )
      .sort((a, b) => timeToSortable(a.time) - timeToSortable(b.time)); // Используем новую функцию
    
    if (daySchedule.length > 0) {
      groupedByDay[day] = daySchedule;
    }
  });
  return groupedByDay;
});

const getColorForType = (type) => {
  switch (type) {
    case 'Лекция': return 'blue';
    case 'Практика': return 'green';
    case 'Лабораторная': return 'orange';
    default: return 'grey';
  }
};
</script>
