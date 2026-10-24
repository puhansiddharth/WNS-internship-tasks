import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { BadClsPageComponent } from './pages/bad-cls-page/bad-cls-page.component';
import { FixedClsPageComponent } from './pages/fixed-cls-page/fixed-cls-page.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    title: 'CLS Demonstration'
  },
  {
    path: 'bad-cls',
    component: BadClsPageComponent,
    title: 'Bad CLS — Isolated Demo'
  },
  {
    path: 'fixed-cls',
    component: FixedClsPageComponent,
    title: 'Fixed CLS — Isolated Demo'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
