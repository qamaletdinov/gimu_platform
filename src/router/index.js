// Composables
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/default/Default.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
      },
      {
        path: 'courses',
        name: 'Courses',
        component: () => import('@/views/Courses.vue'),
      },
      {
        path: 'schedule',
        name: 'Schedule',
        component: () => import('@/views/Schedule.vue'),
      },
      {
        path: 'homework',
        name: 'Homework',
        component: () => import('@/views/Homework.vue'),
      },
      {
        path: 'exams',
        name: 'Exams',
        component: () => import('@/views/Exams.vue'),
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('@/views/Admin.vue'),
        meta: { requiresAdmin: true },
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
  },
  {
    path: '/register', // <-- ДОБАВЛЕН НОВЫЙ МАРШРУТ
    name: 'Register',
    component: () => import('@/views/Register.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (to.name !== 'Login' && to.name !== 'Register' && !token) { // <-- ИЗМЕНЕНО: Разрешаем доступ к /register без токена
    next({ name: 'Login' });
  } else {
    next();
  }
});

export default router
