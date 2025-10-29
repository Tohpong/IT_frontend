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
  email?: string;
  fullName?: string;
  phone?: string;
  dateOfBirth?: Date | string | null;
  gender?: string;
  registrationDate?: Date;
  profileImage?: string;
  member_id?: number;       // ✅ เพิ่มฟิลด์นี้เพื่อเชื่อมกับ Member
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
// ✅ AuthService
// ----------------------
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private apiUrl = 'http://localhost:8000';

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
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  // ----------------------
  // 🔹 Login (เรียก backend + ดึง member_id ด้วย)
  // ----------------------
  login(username: string, password: string): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/account/login`, { username, password }).pipe(
      switchMap(response => {
        if (response.success && response.user) {
          const accountId = response.user.account_id;
          // ✅ ดึงข้อมูล member_id ที่เชื่อมกับ account_id
          return this.http.get<any[]>(`${this.apiUrl}/member`).pipe(
            map(members => {
              const member = members.find(m => m.account_id === accountId);
              const user: User = {
                id: accountId,
                username: response.user.username,
                profileImage: response.user.account_pic,
                member_id: member ? member.member_id : undefined
              };
              this.currentUserSubject.next(user);
              localStorage.setItem('currentUser', JSON.stringify(user));
              return true;
            }),
            catchError(err => {
              console.error('Error fetching member:', err);
              // ยังให้ล็อกอินผ่านแม้ไม่เจอ member_id
              const user: User = {
                id: response.user.account_id,
                username: response.user.username,
                profileImage: response.user.account_pic
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
  // 🔹 Register (ส่งตรงไป backend /account/register)
  // ----------------------
register(accountData: any, memberData: any): Observable<boolean> {
  // ✅ เตรียม payload ให้ตรงกับ backend
  const payload = {
    username: accountData.username,
    password: accountData.password,
    email: accountData.email || '',
    full_name: memberData.fullName,
    phone: memberData.phone,
    birthdate: memberData.dateOfBirth
      ? new Date(memberData.dateOfBirth).toISOString().split('T')[0]
      : null,
    gender: memberData.gender
  };

  console.log('📦 ส่งข้อมูลไป backend:', payload);

  return this.http.post<any>(`${this.apiUrl}/account/register`, payload).pipe(
    map((res: any) => res.success === true),
    catchError(err => {
      console.error('Register error:', err);
      if (err.status === 409) alert('ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว');
      else if (err.status === 400) alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      else alert('เกิดข้อผิดพลาดในการสมัครสมาชิก');
      return of(false);
    })
  );
}


  // ----------------------
  // 🔹 ฟังก์ชันคำนวณอายุ
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
  // 🔹 อัปเดตโปรไฟล์ (mock)
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
          } else observer.next(false);
        } else observer.next(false);
        observer.complete();
      }, 500);
    });
  }

  // ----------------------
  // 🔹 ดึงข้อมูล Member ตาม account_id (สำหรับกรณีต้องใช้แยก)
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
