import { createRouter, createWebHistory } from 'vue-router';
import PlayerView from '../views/PlayerView.vue';
import GroupsView from '../views/GroupsView.vue';
import GroupView from '../views/GroupView.vue';
import GroupPairsView from '../views/GroupPairsView.vue';
import TopPlayersView from '../views/TopPlayersView.vue';
import AboutView from '../views/AboutView.vue';

import { tokenStorage } from "@bogdanovmn/ssofw"
import type { Role } from "@bogdanovmn/ssofw"

const routes = [
  { path: '/player', component: PlayerView },
  { path: '/players/:playerId', component: PlayerView, props: true },
  { path: '/top',    component: TopPlayersView },
  { path: '/groups', component: GroupsView, meta: { private: true } },
  { path: '/groups/:groupId', component: GroupView, meta: { private: true }, props: true },
  { path: '/groups/:groupId/pairs', component: GroupPairsView, meta: { private: true }, props: true },
  { path: '/about',  component: AboutView },
  { path: '/login', 
    redirect: () => {
      const ssoUrl = import.meta.env.VITE_SSO_FRONT_URL;
      const redirectUri = `${window.location.origin}/brating/sso-callback`;
      window.location.href = `${ssoUrl}/login?from=${encodeURIComponent(redirectUri)}`;
      return '/';
    }
  },
  { path: '/sso-callback', component: () => import('../views/SsoCallbackView.vue') },
];

const router = createRouter({
  history: createWebHistory('/brating/'),
  routes,
});

router.beforeEach(
  async (to: any) => {
      localStorage.removeItem("errorMsg")

      const isAuthenticated = tokenStorage.defined()
      const isAdmin = tokenStorage.claims?.isAdmin('brating')
      const targetRole: Role = to.meta.allow
      const privateTarget = to.meta.private || targetRole

      console.log(`routing to ${to.fullPath} auth: ${isAuthenticated} isAdmin: ${isAdmin}`)

      if (targetRole && !tokenStorage.claims?.hasRole(targetRole, 'brating')) {
          return error('Permission denied')
      }

      if (privateTarget && !isAuthenticated) {
          return error('Permission denied')
      }

      return true
  }
);

function error(msg: string) {
  localStorage.setItem("errorMsg", msg)
  return { path: "/error" }
}

export default router;