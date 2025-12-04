<template>
  <v-container>
    <h1 class="mb-4">Подготовка к экзамену</h1>

    <!-- Выбор режима -->
    <v-card class="mb-4">
      <v-card-text>
        <v-btn-toggle v-model="mode" mandatory color="primary" class="mb-4">
          <v-btn value="answers">
            <v-icon left>mdi-book-open-variant</v-icon>
            Получить ответы
          </v-btn>
          <v-btn value="test">
            <v-icon left>mdi-clipboard-check</v-icon>
            Пройти тест
          </v-btn>
        </v-btn-toggle>

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
          class="mb-4"
        ></v-file-input>

        <v-btn
          v-if="mode === 'answers'"
          @click="prepareForExam"
          color="primary"
          :loading="loading"
          :disabled="!selectedCourse || !questionsFile"
        >
          <v-icon left>mdi-book-search</v-icon>
          Получить ответы
        </v-btn>

        <v-btn
          v-if="mode === 'test'"
          @click="generateTest"
          color="success"
          :loading="loading"
          :disabled="!selectedCourse || !questionsFile"
        >
          <v-icon left>mdi-file-document-edit</v-icon>
          Сгенерировать тест
        </v-btn>

        <v-alert v-if="error" type="error" class="mt-4" closable>{{ error }}</v-alert>
      </v-card-text>
    </v-card>

    <!-- Загрузка -->
    <v-card v-if="loading" class="mt-4 d-flex flex-column justify-center align-center pa-8">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4 text-h6">{{ loadingText }}</p>
    </v-card>

    <!-- Режим: Ответы на вопросы -->
    <v-card v-if="!loading && mode === 'answers' && answers.length > 0" class="mt-4">
      <v-card-title class="d-flex align-center">
        <v-icon left color="primary">mdi-book-open-page-variant</v-icon>
        Ответы на вопросы
        <v-spacer></v-spacer>
        <v-btn icon @click="downloadAnswers" title="Скачать PDF">
          <v-icon>mdi-download</v-icon>
        </v-btn>
      </v-card-title>
      <v-list lines="three">
        <v-list-item v-for="(item, index) in answers" :key="index" class="mb-2">
          <template v-slot:prepend>
            <v-avatar color="primary" size="32">{{ index + 1 }}</v-avatar>
          </template>
          <v-list-item-title class="font-weight-bold mb-2">{{ item.question }}</v-list-item-title>
          <v-list-item-subtitle style="white-space: pre-wrap;">{{ item.answer }}</v-list-item-subtitle>
          <v-divider v-if="index < answers.length - 1" class="my-4"></v-divider>
        </v-list-item>
      </v-list>
    </v-card>

    <!-- Режим: Тест -->
    <div v-if="!loading && mode === 'test' && testQuestions.length > 0">
      <!-- Прохождение теста -->
      <v-card v-if="!testSubmitted" class="mt-4">
        <v-card-title class="d-flex align-center">
          <v-icon left color="success">mdi-clipboard-text</v-icon>
          Тест по экзамену
          <v-spacer></v-spacer>
          <v-chip color="primary">
            Вопросов: {{ testQuestions.length }}
          </v-chip>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <div v-for="(question, index) in testQuestions" :key="question.id" class="mb-6">
            <div class="d-flex align-center mb-3">
              <v-chip color="primary" variant="outlined" class="mr-3">
                Вопрос {{ index + 1 }}
              </v-chip>
              <h3>{{ question.question }}</h3>
            </div>

            <v-radio-group v-model="userAnswers[question.id]" class="ml-4">
              <v-radio
                v-for="(text, option) in question.options"
                :key="option"
                :label="`${option}. ${text}`"
                :value="option"
                color="primary"
              ></v-radio>
            </v-radio-group>

            <v-divider v-if="index < testQuestions.length - 1" class="my-4"></v-divider>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            color="success"
            size="large"
            @click="submitTest"
            :disabled="!allQuestionsAnswered"
          >
            <v-icon left>mdi-check-circle</v-icon>
            Проверить ответы
          </v-btn>
        </v-card-actions>
      </v-card>

      <!-- Результаты теста -->
      <v-card v-if="testSubmitted && testResults" class="mt-4">
        <v-card-title class="d-flex align-center">
          <v-icon left :color="testResults.passed ? 'success' : 'error'">
            {{ testResults.passed ? 'mdi-check-circle' : 'mdi-close-circle' }}
          </v-icon>
          Результаты теста
        </v-card-title>
        <v-card-text>
          <!-- Общий результат -->
          <v-alert
            :type="testResults.passed ? 'success' : 'error'"
            prominent
            class="mb-4"
          >
            <v-row align="center">
              <v-col class="grow">
                <div class="text-h4">
                  {{ testResults.totalScore }} / {{ testResults.maxScore }}
                </div>
                <div class="text-subtitle-1">
                  Процент правильных ответов: {{ testResults.percentage }}%
                </div>
                <div class="text-subtitle-2 mt-2">
                  {{ testResults.passed ? '✅ Тест сдан!' : '❌ Тест не сдан. Минимум 60% для прохождения.' }}
                </div>
              </v-col>
              <v-col class="shrink">
                <v-progress-circular
                  :model-value="testResults.percentage"
                  :color="testResults.passed ? 'success' : 'error'"
                  size="80"
                  width="8"
                >
                  {{ testResults.percentage }}%
                </v-progress-circular>
              </v-col>
            </v-row>
          </v-alert>

          <!-- Детальные результаты -->
          <div v-for="(result, index) in testResults.results" :key="result.id" class="mb-6">
            <v-card
              :color="result.isCorrect ? 'success' : 'error'"
              variant="tonal"
              class="pa-4"
            >
              <div class="d-flex align-center mb-3">
                <v-icon
                  :color="result.isCorrect ? 'success' : 'error'"
                  size="32"
                  class="mr-3"
                >
                  {{ result.isCorrect ? 'mdi-check-circle' : 'mdi-close-circle' }}
                </v-icon>
                <div>
                  <v-chip
                    :color="result.isCorrect ? 'success' : 'error'"
                    size="small"
                    class="mb-2"
                  >
                    Вопрос {{ index + 1 }}
                  </v-chip>
                  <h3>{{ result.question }}</h3>
                </div>
              </div>

              <div class="ml-11">
                <div v-for="(text, option) in result.options" :key="option" class="mb-2">
                  <v-chip
                    v-if="option === result.correctAnswer"
                    color="success"
                    variant="flat"
                    prepend-icon="mdi-check"
                    class="mr-2"
                  >
                    {{ option }}
                  </v-chip>
                  <v-chip
                    v-else-if="option === result.userAnswer && !result.isCorrect"
                    color="error"
                    variant="flat"
                    prepend-icon="mdi-close"
                    class="mr-2"
                  >
                    {{ option }}
                  </v-chip>
                  <v-chip
                    v-else
                    variant="outlined"
                    class="mr-2"
                  >
                    {{ option }}
                  </v-chip>
                  <span>{{ text }}</span>
                </div>

                <v-alert
                  v-if="!result.isCorrect"
                  type="info"
                  variant="tonal"
                  class="mt-3"
                >
                  <strong>Объяснение:</strong> {{ result.explanation }}
                </v-alert>
              </div>
            </v-card>
          </div>

          <v-btn
            color="primary"
            block
            size="large"
            @click="resetTest"
            class="mt-4"
          >
            <v-icon left>mdi-refresh</v-icon>
            Пройти тест заново
          </v-btn>
        </v-card-text>
      </v-card>
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getBackendUrl, getToken } from '@/utils/api';

const mode = ref('answers'); // 'answers' или 'test'
const courses = ref([]);
const selectedCourse = ref(null);
const questionsFile = ref(null);
const answers = ref([]);
const testQuestions = ref([]);
const userAnswers = ref({});
const testSubmitted = ref(false);
const testResults = ref(null);
const loading = ref(false);
const loadingText = ref('');
const error = ref('');

const allQuestionsAnswered = computed(() => {
  return testQuestions.value.every(q => userAnswers.value[q.id]);
});

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
  loadingText.value = 'Генерация ответов на вопросы...';
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

const generateTest = async () => {
  const file = questionsFile.value;
  if (!file || !selectedCourse.value) {
    error.value = 'Выберите курс и файл с вопросами.';
    return;
  }
  loading.value = true;
  loadingText.value = 'Генерация тестовых вопросов с вариантами ответов...';
  testQuestions.value = [];
  userAnswers.value = {};
  testSubmitted.value = false;
  testResults.value = null;
  error.value = '';

  const formData = new FormData();
  formData.append('questionsFile', file);
  formData.append('courseId', selectedCourse.value);

  try {
    const response = await fetch(`${getBackendUrl()}/api/exams/generate-test`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Не удалось сгенерировать тест.');
    }
    testQuestions.value = data;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const submitTest = async () => {
  loading.value = true;
  loadingText.value = 'Проверка ответов...';

  const formattedUserAnswers = testQuestions.value.map(q => ({
    id: q.id,
    answer: userAnswers.value[q.id]
  }));

  const correctAnswers = testQuestions.value.map(q => ({
    id: q.id,
    question: q.question,
    correct: q.correct,
    options: q.options,
    explanation: q.explanation
  }));

  try {
    const response = await fetch(`${getBackendUrl()}/api/exams/check-answers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userAnswers: formattedUserAnswers,
        correctAnswers: correctAnswers
      })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Не удалось проверить ответы.');
    }
    testResults.value = data;
    testSubmitted.value = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const resetTest = () => {
  userAnswers.value = {};
  testSubmitted.value = false;
  testResults.value = null;
  testQuestions.value = [];
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const downloadAnswers = () => {
  // TODO: Implement PDF download
  alert('Функция скачивания PDF будет реализована позже');
};
</script>

<style scoped>
.v-list-item {
  border-radius: 8px;
  transition: background-color 0.3s;
}

.v-list-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}
</style>
