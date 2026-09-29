import { Routes } from '@angular/router';
export default [
  {
    path: '',
    loadComponent: () =>
      import('../feat-dashboard/facility-dashboard-page').then((m) => m.FacilityDashboardPage),
  },
] satisfies Routes;
