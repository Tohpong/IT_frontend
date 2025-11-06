import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BookingService, BookingRequest } from '../../services/booking.service';

interface Trainer {
  id: number;
  name: string;        // trainer_fullname
  specialty: string;   // course_name
  experience: number;  // trainer_year
  age: number;         // trainer_age
  bio: string;         // trainer_bio
  image: string;       // trainer_url
  schedule: string;    // schedule
  rating: number;      // rating
  email: string;       // trainer_email
  phone: string;       // trainer_phone
}

@Component({
  selector: 'app-trainer-detail',
  templateUrl: './trainer-detail.component.html',
  styleUrls: ['./trainer-detail.component.css']
})
export class TrainerDetailComponent implements OnInit {
  trainer: Trainer | null = null;
  showBookingModal = false;
  bookingForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private bookingService: BookingService
  ) {
    this.bookingForm = this.formBuilder.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      sessionDate: ['', Validators.required],
      sessionTime: ['', Validators.required],
      sessionType: ['', Validators.required],
      goals: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTrainerDetail(id);
  }

  /** ✅ ดึงข้อมูลเทรนเนอร์จาก backend */
  loadTrainerDetail(id: number): void {
    this.http.get<any>(`https://itbackend-production.up.railway.app/trainer/${id}`).subscribe({
      next: (t) => {
        this.trainer = {
          id: t.trainer_id,
          name: t.trainer_fullname,
          specialty: t.course_name || 'ไม่ระบุ',   // ✅ ดึงชื่อคอร์สจาก backend
          experience: Number(t.trainer_year),
          age: t.trainer_age,
          bio: t.trainer_bio,
          image: t.trainer_url,
          schedule: t.schedule,
          rating: t.rating,
          email: t.trainer_email || 'ไม่ระบุ',
          phone: t.trainer_phone || 'ไม่ระบุ'
        };

      },
      error: (err) => {
        console.error('ไม่สามารถโหลดข้อมูลเทรนเนอร์ได้:', err);
        this.router.navigate(['/trainer']);
      }
    });
  }

  /** ✅ เพิ่มฟังก์ชันนี้เพื่อกลับไปหน้า trainer */
  goBack(): void {
    this.router.navigate(['/trainer']);
  }

  getStarRating(rating: number): string[] {
    const stars: string[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) stars.push('★');
      else if (i === fullStars && hasHalfStar) stars.push('☆');
      else stars.push('☆');
    }
    return stars;
  }

  bookSession(): void {
    this.showBookingModal = true;
  }

  closeBookingModal(): void {
    this.showBookingModal = false;
    this.bookingForm.reset();
  }

  onSubmitBooking(): void {
    if (this.bookingForm.valid && this.trainer) {
      // แปลงข้อมูลจากฟอร์มเป็นรูปแบบที่ API ต้องการ
      const formValue = this.bookingForm.value;
      
      // รวมวันที่และเวลาเป็น ISO string
      const bookingDateTime = new Date(`${formValue.sessionDate}T${formValue.sessionTime || '00:00'}:00`);
      
      const bookingData: BookingRequest = {
        fullname: formValue.fullName,
        email: formValue.email,
        phone: formValue.phone,
        booking_date: bookingDateTime.toISOString(),
        time_slot: formValue.sessionTime,
        session_type: formValue.sessionType,
        goal: formValue.goals,
        additional: formValue.notes,
        trainer_id: this.trainer.id
      };

      // ส่งข้อมูลไป backend
      this.bookingService.createBooking(bookingData).subscribe({
        next: (response) => {
          console.log('✅ จองสำเร็จ:', response);
          this.closeBookingModal();
          // แสดง confirmation dialog แล้ว redirect ไปหน้าประวัติการจอง
          if (confirm(`จองเซสชั่นกับ ${this.trainer!.name} เรียบร้อยแล้ว!\nหมายเลขการจอง: ${response.booking_id}\nเราจะติดต่อกลับภายใน 24 ชั่วโมง\n\nคุณต้องการดูประวัติการจองหรือไม่?`)) {
            this.router.navigate(['/booking-history']);
          }
        },
        error: (error) => {
          console.error('❌ เกิดข้อผิดพลาดในการจอง:', error);
          alert(`ไม่สามารถจองได้ในขณะนี้\nกรุณาลองใหม่อีกครั้ง\nError: ${error.error?.error || error.message}`);
        }
      });
    } else {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
    }
  }

  getFormError(fieldName: string): string {
    const field = this.bookingForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'กรุณากรอกข้อมูลนี้';
      if (field.errors['email']) return 'รูปแบบอีเมลไม่ถูกต้อง';
      if (field.errors['minlength']) return 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร';
      if (field.errors['pattern']) return 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก';
    }
    return '';
  }

  contactTrainer(): void {
    if (this.trainer) {
      alert(`ติดต่อ ${this.trainer.name}\nEmail: ${this.trainer.email}\nPhone: ${this.trainer.phone}`);
    }
  }
}