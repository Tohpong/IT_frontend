import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, catchError, tap, switchMap } from 'rxjs/operators';

// ----------------------
// ✅ Interfaces
// ----------------------
export interface User {
  id: number;               // account_id
  username: string;
  password?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  dateOfBirth?: Date | string | null;
  gender?: string;
  registrationDate?: Date;
  profileImage?: string;
  member_id?: number;       // เชื่อมกับ Member
  role?: string;            // เพิ่มจากโค้ดชุดแรก
}

export interface WorkoutSession {
  id: number;
  userId: number;
  date: Date;
  exerciseType: string;
  duration: number;
  calories?: number;
  notes?: string;
}

export interface RegistrationHistory {
  id: number;
  enrollment_id?: number;
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

  // ฟิลด์เสริมจาก backend
  full_name?: string;
  course_name?: string;
  course_id?: number;
  enrollment_date?: string;

  // ฟิลด์ fallback จาก frontend
  studentEmail?: string;
  studentPhone?: string;
}

// ----------------------
// ✅ AuthService
// ----------------------
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private apiUrl = 'https://itbackend-production.up.railway.app';

  private workoutSessions: WorkoutSession[] = [];
  private registrationHistories: RegistrationHistory[] = [];

  constructor(private http: HttpClient) {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  // ----------------------
  // 🔹 Check admin role
  // ----------------------
  isAdmin(): Observable<boolean> {
    const current = this.getCurrentUser();
    if (!current) return of(false);

    if (current.role) return of(current.role === 'admin');

    if (current.id) {
      return this.http.get<any>(`${this.apiUrl}/account/${current.id}`).pipe(
        map(resp => {
          const role = resp?.role || resp?.data?.role;
          return role === 'admin';
        }),
        catchError(err => {
          console.error('isAdmin check failed', err);
          return of(current.username === 'admin');
        })
      );
    }

    return of(current.username === 'admin');
  }

  // ----------------------
  // 🔹 Login (เรียก backend + ดึง member_id)
  // ----------------------
  login(username: string, password: string): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/account/login`, { username, password }).pipe(
      switchMap(response => {
        if (response.success && response.user) {
          const accountId = response.user.account_id;
          return this.http.get<any[]>(`${this.apiUrl}/member`).pipe(
            map(members => {
              const member = members.find(m => m.account_id === accountId);
              const user: User = {
                id: accountId,
                username: response.user.username,
                member_id: member ? member.member_id : undefined,
                role: response.user.role
              };
              this.currentUserSubject.next(user);
              localStorage.setItem('currentUser', JSON.stringify(user));
              return true;
            }),
            catchError(err => {
              console.error('Error fetching member:', err);
              const user: User = {
                id: response.user.account_id,
                username: response.user.username,
                role: response.user.role
              };
              this.currentUserSubject.next(user);
              localStorage.setItem('currentUser', JSON.stringify(user));
              return of(true);
            })
          );
        } else {
          return of(false);
        }
      }),
      catchError(err => {
        console.error('Login error:', err);
        return of(false);
      })
    );
  }

  // ----------------------
  // 🔹 Register
  // ----------------------
  register(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/account/register`, payload);
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
  // 🔹 อัปเดตโปรไฟล์ (Local)
  // ----------------------
  updateProfile(userData: Partial<User>): Observable<boolean> {
    return new Observable(observer => {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        observer.next(false);
        observer.complete();
        return;
      }

      const updatedUser: User = { ...currentUser, ...userData } as User;
      this.currentUserSubject.next(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      observer.next(true);
      observer.complete();
    });
  }

  // ----------------------
  // 🔹 ดึงข้อมูล Member ตาม account_id
  // ----------------------
  getMemberByAccountId(accountId: number): Observable<any | null> {
    return this.http.get<any[]>(`${this.apiUrl}/member`).pipe(
      map(members => members.find(m => m.account_id === accountId) || null),
      catchError(err => {
        console.error('getMemberByAccountId error:', err);
        return of(null);
      })
    );
  }

  // ----------------------
  // 🔹 Workout
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

  // ----------------------
  // 🔹 Enroll / Registration (ใช้ backend จริง)
  // ----------------------
  getRegistrationHistory(memberId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/enroll/member/${memberId}`).pipe(
      catchError(err => {
        console.error('getRegistrationHistory API error:', err);
        return of([]);
      })
    );
  }

  addRegistration(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/enroll`, data).pipe(
      tap(() => console.log('Enrollment added:', data)),
      catchError(err => {
        console.error('addRegistration error:', err);
        throw err;
      })
    );
  }

  cancelRegistration(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/enroll/${id}/cancel`, {}).pipe(
      tap(() => console.log(`Enrollment #${id} cancelled`)),
      catchError(err => {
        console.error('cancelRegistration error:', err);
        throw err;
      })
    );
  }

  deleteRegistration(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/enroll/${id}`).pipe(
      tap(() => console.log(`Enrollment #${id} deleted`)),
      catchError(err => {
        console.error('deleteRegistration error:', err);
        throw err;
      })
    );
  }

  // ----------------------
  // 🔹 Utility: คำนวณอายุ
  // ----------------------
  private calculateAge(birthdate: string | null): number | null {
    if (!birthdate) return null;
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }
}
