import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, RegistrationHistory, User } from '../../services/auth.service';

@Component({
  selector: 'app-registration-history',
  templateUrl: './registration-history.component.html',
  styleUrls: ['./registration-history.component.css']
})


export class RegistrationHistoryComponent implements OnInit {
  currentUser: User | null = null;
  registrationHistory: RegistrationHistory[] = [];
  isLoading = true;
  showAddForm = false;

  newRegistration = {
    courseId: 0,
    courseName: '',
    price: 0,
    status: 'active' as 'active' | 'completed' | 'cancelled'
  };

  // เพิ่มใน class
  cancellingId: number | null = null;
  deletingId: number | null = null;


  availableCourses = [
    { id: 2, name: 'Yoga & Flexibility', price: 2000 },
    { id: 3, name: 'Basic Fitness Training', price: 1500 },
    { id: 4, name: 'Cardio Workout', price: 1200 },
    { id: 5, name: 'Strength Training', price: 2000 },
    { id: 6, name: 'HIIT Training', price: 1800 },
    { id: 7, name: 'Functional Training', price: 1700 }
  ];

  statusOptions = [
    { value: 'active', label: 'กำลังเรียน', color: '#28a745' },
    { value: 'completed', label: 'เรียนจบแล้ว', color: '#17a2b8' },
    { value: 'cancelled', label: 'ยกเลิก', color: '#dc3545' }
  ];

  isAddingRegistration = false;
  isCancelling = false;
  isDeleting = false;
  successMessage = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadRegistrationHistory();
  }

  /** ✅ โหลดข้อมูลจาก backend (รวมข้อมูล Member, Course, Enrollment) */
  loadRegistrationHistory(): void {
    this.isLoading = true;
    this.authService.getRegistrationHistory(this.currentUser!.member_id!).subscribe({
      next: (data) => {
        // ✅ คาดว่า backend จะส่งข้อมูลรวม เช่น full_name, email, phone, course_id, courseName, enrollment_date
        this.registrationHistory = data.sort((a, b) => {
          const dateA: any = new Date((a as any).enrollment_date || a.registrationDate);
          const dateB: any = new Date((b as any).enrollment_date || b.registrationDate);
          return dateB - dateA;
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Load registration history error:', err);
        this.isLoading = false;
        this.errorMessage = 'โหลดข้อมูลไม่สำเร็จ';
      }
    });
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) this.resetForm();
    this.successMessage = '';
    this.errorMessage = '';
  }

  resetForm(): void {
    this.newRegistration = {
      courseId: 0,
      courseName: '',
      price: 0,
      status: 'active'
    };
  }

  onCourseChange(): void {
    const selected = this.availableCourses.find(c => c.id === +this.newRegistration.courseId);
    if (selected) {
      this.newRegistration.courseName = selected.name;
      this.newRegistration.price = selected.price;
    }
  }

  /** ✅ สมัครคอร์สใหม่ */
  addRegistration(): void {
    if (!this.currentUser || !this.newRegistration.courseId) {
      this.errorMessage = 'กรุณาเลือกคอร์สเรียน';
      return;
    }

    this.isAddingRegistration = true;
    this.successMessage = '';
    this.errorMessage = '';

    const payload = {
      member_id: this.currentUser.member_id || this.currentUser.id,
      course_id: this.newRegistration.courseId,
      experience: 'beginner',
      goals: 'เพิ่มสมรรถภาพ',
      medical_conditions: '',
      payment_method: 'promptpay',
      price: this.newRegistration.price,
      enrollment_date: new Date().toISOString()
    };

    this.authService.addRegistration(payload).subscribe({
      next: () => {
        this.isAddingRegistration = false;
        this.successMessage = 'สมัครคอร์สเรียบร้อยแล้ว';
        this.showAddForm = false;

        /** ✅ โหลดข้อมูลใหม่ทั้งหมดทันที */
        this.loadRegistrationHistory();

        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (err) => {
        this.isAddingRegistration = false;
        console.error(err);
        this.errorMessage = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      }
    });
  }

  /** ✅ ยกเลิกการสมัครเรียน */
  cancelRegistration(enrollmentId: number) {
    if (!confirm('คุณต้องการยกเลิกการสมัครเรียนนี้หรือไม่?')) return;
    this.cancellingId = enrollmentId;

    this.authService.cancelRegistration(enrollmentId).subscribe({
      next: () => {
        this.successMessage = 'ยกเลิกการสมัครเรียบร้อยแล้ว';
        this.registrationHistory = this.registrationHistory.map(r => {
          if (r.enrollment_id === enrollmentId || r.id === enrollmentId) {
            return { ...r, status: 'cancelled' };
          }
          return r;
        });
      },
      error: (err) => {
        console.error('cancelRegistration error:', err);
        this.errorMessage = 'เกิดข้อผิดพลาดในการยกเลิกการสมัคร';
      },
      complete: () => {
        this.cancellingId = null;
      }
    });
  }

  // ✅ ลบการสมัคร (เฉพาะตัวที่เลือก)
  deleteRegistration(enrollmentId: number) {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบการสมัครนี้?')) return;
    this.deletingId = enrollmentId;

    this.authService.deleteRegistration(enrollmentId).subscribe({
      next: () => {
        this.successMessage = 'ลบการสมัครเรียบร้อยแล้ว';
        this.registrationHistory = this.registrationHistory.filter(
          r => r.enrollment_id !== enrollmentId && r.id !== enrollmentId
        );
      },
      error: (err) => {
        console.error('deleteRegistration error:', err);
        this.errorMessage = 'เกิดข้อผิดพลาดในการลบข้อมูล';
      },
      complete: () => {
        this.deletingId = null;
      }
    });
  }

  /** ✅ Utility */
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getStatusLabel(status: string): string {
    const s = this.statusOptions.find(x => x.value === status);
    return s ? s.label : status;
  }

  getStatusColor(status: string): string {
    const s = this.statusOptions.find(x => x.value === status);
    return s ? s.color : '#6c757d';
  }

  getTotalRegistrations(): number {
    return this.registrationHistory.length;
  }

  getActiveRegistrations(): number {
    return this.registrationHistory.filter(r => r.status === 'active').length;
  }

  getCompletedRegistrations(): number {
    return this.registrationHistory.filter(r => r.status === 'completed').length;
  }

  getTotalSpent(): number {
    return this.registrationHistory
      .filter(r => r.status !== 'cancelled')
      .reduce((total, reg) => total + (reg.price || 0), 0);
  }

  getRegistrationsByYear(): { [key: string]: RegistrationHistory[] } {
    const grouped: { [key: string]: RegistrationHistory[] } = {};
    this.registrationHistory.forEach(reg => {
      const dateValue: any = (reg as any).enrollment_date || reg.registrationDate;
      const year = new Date(dateValue).getFullYear().toString();
      grouped[year] = grouped[year] || [];
      grouped[year].push(reg);
    });
    return grouped;
  }

  getYearKeys(): string[] {
    return Object.keys(this.getRegistrationsByYear()).sort((a, b) => +b - +a);
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }

  // Navigate to course listing page
  goToCourses(): void {
    this.router.navigate(['/course']);
  }
}