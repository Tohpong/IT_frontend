import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http'; // ✅ ตรงนี้สำคัญ
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';

// ✅ import component ทั้งหมด
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
import { NavbarComponent } from './shared/navbar/navbar.component';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    CourseComponent,
    CourseEnrollmentComponent,
    TrainerComponent,
    TrainerDetailComponent,
    ContactComponent,
    LoginComponent,
    RegisterComponent,
    ProfileComponent,
    WorkoutHistoryComponent,
    RegistrationHistoryComponent,
    BookingHistoryComponent,
  NavbarComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule   // ✅ ต้องใส่ใน imports
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent]
})


export class AppModule { }
    