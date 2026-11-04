import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { GreetingComponent } from './components/greeting/greeting';
import { AboutComponent } from './components/about/about';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Home | Angular Flask Demo' },
  { path: 'greet', component: GreetingComponent, title: 'Greeting Form | Angular Flask Demo' },
  { path: 'about', component: AboutComponent, title: 'About | Angular Flask Demo' },
  { path: '**', redirectTo: '' }
];
