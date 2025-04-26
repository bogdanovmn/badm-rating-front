import { createRouter, createWebHistory } from 'vue-router';
import PlayerView from '../views/PlayerView.vue';
// import TopPlayersView from '../views/TopPlayersView.vue';
import AboutView from '../views/AboutView.vue';

const routes = [
  {
    path: '/player',
    name: 'player',
    component: PlayerView,
  },
  // {
  //   path: '/top',
  //   name: 'top',
  //   component: TopPlayersView,
  // },
  {
    path: '/about',
    name: 'about',
    component: AboutView,
  },
];

const router = createRouter({
  history: createWebHistory('/brating/'),
  routes,
});

export default router;