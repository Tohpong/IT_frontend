import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CourseComponent } from './pages/course/course.component';
import { CourseEnrollmentComponent } from './pages/course-enrollment/course-enrollment.component';
import { TrainerComponent } from './pages/trainer/trainer.component';
import { TrainerDetailComponent } from './pages/trainer/trainer-detail.component';
import { ContactComponent } from './pages/contact/contact.component';
import { LoginComponent } from './pages/auth/login.component';
import { RegisterComponent } from './pages/auth/register.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { WorkoutHistoryComponent } from './pages/workout-history/workout-history.component';
import { RegistrationHistoryComponent } from './pages/registration-history/registration-history.component';
import { BookingHistoryComponent } from './pages/booking-history/booking-history.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'course', component: CourseComponent },
  { path: 'course-enrollment', component: CourseEnrollmentComponent, canActivate: [AuthGuard] },
  // service page removed
  { path: 'trainer', component: TrainerComponent },
  { path: 'trainer/:id', component: TrainerDetailComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'workout-history', component: WorkoutHistoryComponent, canActivate: [AuthGuard] },
  { path: 'registration-history', component: RegistrationHistoryComponent, canActivate: [AuthGuard] },
  { path: 'booking-history', component: BookingHistoryComponent },
  { path: 'admin', canActivate: [AuthGuard, AdminGuard], loadChildren: () => import('./pages/admin/admin.module').then(m => m.AdminModule) },
  { path: '**', redirectTo: '/home' } // Wildcard route for 404 page
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
