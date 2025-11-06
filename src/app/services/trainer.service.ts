import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Trainer {
  trainer_id?: number;
  trainer_fullname: string;
  trainer_age: number;
  trainer_date: string;
  trainer_year: string;
  trainer_bio: string;
  trainer_url: string;
  schedule: string;
  rating: number;
  account_id: number;
  course_id: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class TrainerService {
  private apiUrl = 'https://itbackend-production.up.railway.app/trainer';

  constructor(private http: HttpClient) {}

  /** ✅ ดึงเทรนเนอร์ทั้งหมด */
  getAll(): Observable<Trainer[]> {
    return this.http.get<Trainer[]>(this.apiUrl);
  }

  /** ✅ ดึงเทรนเนอร์รายคน */
  getById(id: number): Observable<Trainer> {
    return this.http.get<Trainer>(`${this.apiUrl}/${id}`);
  }

  /** ✅ เพิ่มเทรนเนอร์ใหม่ */
  create(trainer: Trainer): Observable<Trainer> {
    return this.http.post<Trainer>(this.apiUrl, trainer);
  }

  /** ✅ แก้ไขข้อมูลเทรนเนอร์ */
  update(id: number, trainer: Trainer): Observable<Trainer> {
    return this.http.put<Trainer>(`${this.apiUrl}/${id}`, trainer);
  }

  /** ✅ ลบเทรนเนอร์ */
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}