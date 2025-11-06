import { Component, OnInit } from '@angular/core';
import { BookingService, BookingResponse } from '../../services/booking.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-booking-history',
  templateUrl: './booking-history.component.html',
  styleUrls: ['./booking-history.component.css']
})
export class BookingHistoryComponent implements OnInit {
  bookings: BookingResponse[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private bookingService: BookingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBookingHistory();
  }

  loadBookingHistory(): void {
    this.loading = true;
    this.bookingService.getAllBookings().subscribe({
      next: (data) => {
        this.bookings = data.sort((a, b) => {
          // เรียงจากวันที่จองล่าสุด
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('เกิดข้อผิดพลาดในการโหลดประวัติการจอง:', error);
        this.errorMessage = 'ไม่สามารถโหลดประวัติการจองได้ กรุณาลองใหม่อีกครั้ง';
        this.loading = false;
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'รอการยืนยัน',
      'confirmed': 'ยืนยันแล้ว',
      'completed': 'เสร็จสิ้น',
      'cancelled': 'ยกเลิก'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'pending': 'status-pending',
      'confirmed': 'status-confirmed',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    return classMap[status] || '';
  }

  editBooking(booking: BookingResponse): void {
    // Navigate to trainer detail page with booking data for editing
    this.router.navigate(['/trainer', booking.trainer_id], {
      state: { bookingData: booking }
    });
  }

  cancelBooking(bookingId: number): void {
    if (confirm('คุณต้องการยกเลิกการจองนี้หรือไม่?')) {
      this.bookingService.updateBooking(bookingId, { status: 'cancelled' }).subscribe({
        next: () => {
          alert('ยกเลิกการจองเรียบร้อยแล้ว');
          this.loadBookingHistory();
        },
        error: (error) => {
          console.error('เกิดข้อผิดพลาดในการยกเลิกการจอง:', error);
          alert('ไม่สามารถยกเลิกการจองได้ กรุณาลองใหม่อีกครั้ง');
        }
      });
    }
  }

  deleteBooking(bookingId: number): void {
    if (confirm('คุณต้องการลบการจองนี้ถาวรหรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      this.bookingService.deleteBooking(bookingId).subscribe({
        next: () => {
          alert('ลบการจองเรียบร้อยแล้ว');
          this.loadBookingHistory();
        },
        error: (error) => {
          console.error('เกิดข้อผิดพลาดในการลบการจอง:', error);
          alert('ไม่สามารถลบการจองได้ กรุณาลองใหม่อีกครั้ง');
        }
      });
    }
  }

  goToTrainerDetail(trainerId: number): void {
    this.router.navigate(['/trainer', trainerId]);
  }

  goBack(): void {
    this.router.navigate(['/trainer']);
  }
}
