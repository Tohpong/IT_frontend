import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface AdminUser {
  id?: number;
  // backend may return account_id instead of id
  account_id?: number;
  username: string;
  email?: string;
  fullName?: string;
  phone?: string;
}

// Course management removed from AdminService (handled elsewhere or not exposed in admin UI)

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = 'https://itbackend-production.up.railway.app';

  constructor(private http: HttpClient) {}

  // Users
  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/account`).pipe(
      // normalize user shape: ensure `id` is present (use account_id if provided)
      map(list => (list || []).map(u => ({ ...(u as any), id: (u as any).account_id || (u as any).id }))),
      catchError(err => {
        console.error('getUsers error', err);
        return of([]);
      })
    );
  }

  deleteUser(id: number): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/account/${id}`).pipe(
      map(() => true),
      catchError(err => {
        console.error('deleteUser error', err);
        return of(false);
      })
    );
  }

  updateUser(id: number, payload: Partial<AdminUser>): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/account/${id}`, payload).pipe(
      map(() => true),
      catchError(err => {
        console.error('updateUser error', err);
        return of(false);
      })
    );
  }

  // Partial update (PATCH) for users - allows updating username/email/password without sending full record
  patchUser(id: number, payload: Partial<AdminUser & { password?: string }>): Observable<boolean> {
    return this.http.patch<any>(`${this.apiUrl}/account/${id}`, payload).pipe(
      map(() => true),
      catchError(err => {
        console.error('patchUser error', err);
        return of(false);
      })
    );
  }

  createUser(payload: Partial<AdminUser & { password?: string }>): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/account`, payload).pipe(
      catchError(err => {
        console.error('createUser error', err);
        return of(null);
      })
    );
  }

  // Courses
  // Course-related APIs were removed from the admin client because course management is not part of the simplified admin UI.

  // Registrations / stats
  getRegistrations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/registration`).pipe(
      catchError(err => {
        console.error('getRegistrations error', err);
        return of([]);
      })
    );
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/stats`).pipe(
      catchError(err => {
        console.error('getStats error', err);
        // fallback: return empty stats
        return of({ users: 0, courses: 0, registrations: 0, revenue: 0 });
      })
    );
  }

  // Messages / Contact
  getMessages(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/contact`).pipe(
      catchError(err => {
        console.error('getMessages error', err);
        return of([]);
      })
    );
  }

  getMessage(id: number): Observable<any | null> {
    return this.http.get<any>(`${this.apiUrl}/contact/${id}`).pipe(
      catchError(err => {
        console.error('getMessage error', err);
        return of(null);
      })
    );
  }

  createMessage(payload: { name: string; email: string; message: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/contact`, payload).pipe(
      catchError(err => {
        console.error('createMessage error', err);
        return of(null);
      })
    );
  }

  replyMessage(id: number, payload: { from: string; message: string }): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/contact/${id}/reply`, payload).pipe(
      map(() => true),
      catchError(err => {
        console.error('replyMessage error', err);
        return of(false);
      })
    );
  }

  updateMessage(id: number, payload: Partial<any>): Observable<boolean> {
    return this.http.patch<any>(`${this.apiUrl}/contact/${id}`, payload).pipe(
      map(() => true),
      catchError(err => {
        console.error('updateMessage error', err);
        return of(false);
      })
    );
  }
}
