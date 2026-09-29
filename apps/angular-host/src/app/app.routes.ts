import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', loadChildren: () => import('./domains/facility/api/facility-routes') },
];
