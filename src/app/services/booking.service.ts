import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BookingRequest {
  fullname: string;
  email?: string;
  phone: string;
  booking_date: string;  // ISO date string
  time_slot?: string;
  session_type?: string;
  goal?: string;
  additional?: string;
  status?: string;
  trainer_id: number;
  member_id?: number;
}

export interface BookingResponse {
  booking_id: number;
  fullname: string;
  email: string | null;
  phone: string;
  booking_date: string;
  time_slot: string | null;
  session_type: string | null;
  goal: string | null;
  additional: string | null;
  status: string;
  trainer_id: number;
  member_id: number | null;
  created_at: string;
  trainer?: {
    trainer_id: number;
    trainer_fullname: string;
    trainer_email?: string;
    trainer_phone?: string;
    course_name?: string;
  };
  member?: {
    member_id: number;
    member_fullname: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = 'https://itbackend-production.up.railway.app/booking';

  constructor(private http: HttpClient) {}

  /**
   * สร้างการจองใหม่
   */
  createBooking(data: BookingRequest): Observable<BookingResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<BookingResponse>(this.apiUrl, data, { headers });
  }

  /**
   * ดึงรายการจองทั้งหมด
   */
  getAllBookings(): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(this.apiUrl);
  }

  /**
   * ดึงข้อมูลการจองตาม ID
   */
  getBookingById(id: number): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * อัปเดตการจอง (PATCH)
   */
  updateBooking(id: number, data: Partial<BookingRequest>): Observable<BookingResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.patch<BookingResponse>(`${this.apiUrl}/${id}`, data, { headers });
  }

  /**
   * ลบการจอง
   */
  deleteBooking(id: number): Observable<{ deleted: boolean; id: number }> {
    return this.http.delete<{ deleted: boolean; id: number }>(`${this.apiUrl}/${id}`);
  }
}
