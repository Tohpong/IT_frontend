import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, catchError, tap } from 'rxjs/operators';


// ----------------------
// ✅ Interfaces เดิมทั้งหมด
// ----------------------
export interface User {
  id: number;
  username: string;
  email?: string;
  fullName?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  registrationDate?: Date;
  profileImage?: string;
}

export interface WorkoutSession {
  id: number;
  userId: number;
  date: Date;
  exerciseType: string;
  duration: number; // in minutes
  calories?: number;
  notes?: string;
}

export interface RegistrationHistory {
  id: number;
  userId: number;
  courseId: number;
  courseName: string;
  registrationDate: Date;
  status: 'active' | 'completed' | 'cancelled';
  price: number;
  studentName?: string;
  email?: string;
  phone?: string;
  paymentMethod?: string;
}

// ----------------------
// ✅ AuthService เริ่มต้น
// ----------------------


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private apiUrl = 'http://localhost:8000/account'; // 🔗 ชี้ไปยัง Backend จริง

  // ✅ mock data เดิม (เผื่อใช้กับระบบภายใน)
  private users: User[] = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      fullName: 'Administrator',
      phone: '0123456789',
      registrationDate: new Date('2024-01-01')
    }
  ];

  private workoutSessions: WorkoutSession[] = [];
  private registrationHistories: RegistrationHistory[] = [];

  constructor(private http: HttpClient) {
    // โหลดข้อมูล user ปัจจุบันจาก localStorage (หากเคย login แล้ว)
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  // ----------------------
  // 🔹 Login (เชื่อม backend จริง)
  // ----------------------
  login(username: string, password: string): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(response => {
        if (response.success && response.user) {
          const user: User = {
            id: response.user.account_id,
            username: response.user.username,
            profileImage: response.user.account_pic
          };
          this.currentUserSubject.next(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
      }),
      map(response => response.success === true),
      catchError(err => {
        console.error('Login error:', err);
        return of(false);
      })
    );
  }

  // ----------------------
  // 🔹 Register (สร้างบัญชีจริงใน MySQL)
  // ----------------------
  register(userData: Partial<User>, password: string): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}`, {
      account_pic: userData.profileImage ?? null,
      username: userData.username,
      password: password
    }).pipe(
      map(res => !!res.account_id),
      catchError(err => {
        console.error('Register error:', err);
        return of(false);
      })
    );
  }

  // ----------------------
  // 🔹 Logout
  // ----------------------
  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
  }

  // ----------------------
  // 🔹 ตรวจสอบสถานะ Login
  // ----------------------
  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  // ----------------------
  // 🔹 ดึงข้อมูลผู้ใช้ปัจจุบัน
  // ----------------------
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // ----------------------
  // 🔹 อัปเดตข้อมูลผู้ใช้ (mock)
  // ----------------------
  updateProfile(userData: Partial<User>): Observable<boolean> {
    return new Observable(observer => {
      setTimeout(() => {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
          const userIndex = this.users.findIndex(u => u.id === currentUser.id);
          if (userIndex !== -1) {
            this.users[userIndex] = { ...this.users[userIndex], ...userData };
            const updatedUser = this.users[userIndex];
            this.currentUserSubject.next(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            observer.next(true);
          } else {
            observer.next(false);
          }
        } else {
          observer.next(false);
        }
        observer.complete();
      }, 500);
    });
  }

  // ----------------------
  // 🔹 Workout / Registration (mock)
  // ----------------------
  addWorkoutSession(session: Omit<WorkoutSession, 'id'>): Observable<boolean> {
    return new Observable(observer => {
      const newSession: WorkoutSession = {
        ...session,
        id: this.workoutSessions.length + 1
      };
      this.workoutSessions.push(newSession);
      observer.next(true);
      observer.complete();
    });
  }

  getWorkoutSessions(userId: number): Observable<WorkoutSession[]> {
    return of(this.workoutSessions.filter(s => s.userId === userId));
  }

  addRegistration(registration: Omit<RegistrationHistory, 'id'>): Observable<boolean> {
    return new Observable(observer => {
      const newRegistration: RegistrationHistory = {
        ...registration,
        id: this.registrationHistories.length + 1
      };
      this.registrationHistories.push(newRegistration);
      observer.next(true);
      observer.complete();
    });
  }

  getRegistrationHistory(userId: number): Observable<RegistrationHistory[]> {
    return of(this.registrationHistories.filter(r => r.userId === userId));
  }
}
