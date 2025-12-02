<template>
  <v-container>
    <v-row>
      <!-- Список курсов -->
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Курсы</v-card-title>
          <v-list>
            <v-list-item
              v-for="course in courses"
              :key="course.id"
              @click="selectCourse(course)"
              :active="selectedCourse && selectedCourse.id === course.id"
            >
              <v-list-item-title>{{ course.name }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- Основной контент -->
      <v-col cols="12" md="8">
        <v-card v-if="isLoading" class="d-flex justify-center align-center" min-height="300">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </v-card>
        
        <v-card v-else-if="materials" :key="selectedCourse.id">
          <v-card-title>Материалы для курса: {{ selectedCourse.name }}</v-card-title>
          <v-card-text style="white-space: pre-wrap;">{{ materials }}</v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="generateQuiz" :loading="isQuizLoading">Сгенерировать тест</v-btn>
          </v-card-actions>

          <!-- Интерактивный тест -->
          <v-card-text v-if="quiz">
            <v-divider class="my-4"></v-divider>
            <h3>{{ quiz.title }}</h3>
            <div v-for="(q, index) in quiz.questions" :key="index" class="mt-4">
              <p><strong>{{ index + 1 }}. {{ q.question }}</strong></p>
              <v-radio-group v-model="selectedAnswers[index]">
                <v-radio
                  v-for="(option, i) in q.options"
                  :key="i"
                  :label="option"
                  :value="option"
                  :color="getOptionColor(q, option, index)"
                ></v-radio>
              </v-radio-group>
              <div v-if="quizResult && selectedAnswers[index] !== q.correctAnswer" class="text-success">
                Правильный ответ: {{ q.correctAnswer }}
              </div>
            </div>
            <v-btn color="success" @click="submitQuiz" class="mt-4" :disabled="!!quizResult">Проверить</v-btn>
            <v-alert v-if="quizResult" :type="quizResult.passed ? 'success' : 'error'" class="mt-4">
              Ваш результат: {{ quizResult.score }} из {{ quizResult.total }}
            </v-alert>
          </v-card-text>
        </v-card>

        <v-card v-else class="d-flex justify-center align-center" min-height="300">
          <v-card-text>Выберите курс, чтобы увидеть материалы.</v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const courses = ref([]);
const selectedCourse = ref(null);
const materials = ref(null);
const quiz = ref(null);
const isLoading = ref(false);
const isQuizLoading = ref(false);
const error = ref('');

const selectedAnswers = ref({});
const quizResult = ref(null);

onMounted(async () => {
  try {
    const response = await fetch('http://localhost:3001/api/courses');
    if (!response.ok) throw new Error('Не удалось загрузить курсы.');
    courses.value = await response.json();
  } catch (err) {
    error.value = err.message;
  }
});

const selectCourse = async (course) => {
  selectedCourse.value = course;
  materials.value = null;
  quiz.value = null;
  quizResult.value = null;
  selectedAnswers.value = {};
  isLoading.value = true;
  try {
    const response = await fetch(`http://localhost:3001/api/courses/${course.id}/materials`);
    if (!response.ok) throw new Error('Материалы для этого курса не найдены.');
    const data = await response.json();
    materials.value = data.content;
  } catch (err) {
    materials.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const generateQuiz = async () => {
  if (!selectedCourse.value) return;
  isQuizLoading.value = true;
  quiz.value = null;
  quizResult.value = null;
  selectedAnswers.value = {};
  try {
    const response = await fetch(`http://localhost:3001/api/courses/${selectedCourse.value.id}/quiz`);
    if (!response.ok) throw new Error('Не удалось сгенерировать тест.');
    quiz.value = await response.json();
  } catch (err) {
    console.error(err);
  } finally {
    isQuizLoading.value = false;
  }
};

const submitQuiz = () => {
  let correctCount = 0;
  quiz.value.questions.forEach((q, index) => {
    if (selectedAnswers.value[index] === q.correctAnswer) {
      correctCount++;
    }
  });
  quizResult.value = {
    score: correctCount,
    total: quiz.value.questions.length,
    passed: correctCount / quiz.value.questions.length >= 0.7,
  };
};

const getOptionColor = (question, option, index) => {
  if (!quizResult.value) return 'primary';
  if (option === question.correctAnswer) return 'success';
  if (option === selectedAnswers.value[index] && option !== question.correctAnswer) return 'error';
  return 'primary';
};
</script>
