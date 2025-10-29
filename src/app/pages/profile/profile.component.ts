import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  memberData: any = null;   // ✅ ข้อมูลจากตาราง Member
  isEditing = false;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  editForm: any = {};

  private apiUrl = 'http://localhost:8000/member'; // ✅ backend API

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    // ✅ ดึงข้อมูลผู้ใช้ที่ล็อกอินไว้
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    // ✅ ใช้ member_id ที่เชื่อมกับบัญชีดึงข้อมูลจาก backend
    const memberId = this.currentUser['member_id'];
    if (memberId) {
      this.http.get(`${this.apiUrl}/${memberId}`).subscribe({
        next: (res) => {
          this.memberData = res;
          this.resetEditForm();
        },
        error: (err) => {
          console.error('โหลดข้อมูลสมาชิกผิดพลาด:', err);
          this.errorMessage = 'ไม่สามารถโหลดข้อมูลสมาชิกได้';
        }
      });
    } else {
      this.errorMessage = 'ไม่พบข้อมูลสมาชิกที่เชื่อมกับบัญชีนี้';
    }
  }

  resetEditForm(): void {
    if (this.memberData) {
      this.editForm = {
        fullName: this.memberData.full_name,
        phone: this.memberData.phone || '',
        dateOfBirth: this.memberData.birthdate
          ? new Date(this.memberData.birthdate).toISOString().split('T')[0]
          : '',
        gender: this.memberData.gender || ''
      };
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.resetEditForm();
    }
    this.successMessage = '';
    this.errorMessage = '';
  }

  /** ✅ ฟังก์ชันคำนวณอายุจากวันเกิด */
  private calcAge(dateString: string): number | null {
    if (!dateString) return null;
    const birth = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  saveProfile(): void {
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    // ✅ เตรียมข้อมูลที่จะส่งไป backend
    const updateData = {
      full_name: this.editForm.fullName,
      phone: this.editForm.phone,
      birthdate: this.editForm.dateOfBirth || null, // ส่งเป็น YYYY-MM-DD
      gender: this.editForm.gender,
      age: this.calcAge(this.editForm.dateOfBirth) // ✅ คำนวณอายุ
    };

    if (!this.memberData?.member_id) {
      this.errorMessage = 'ไม่พบรหัสสมาชิก';
      this.isLoading = false;
      return;
    }

    // ✅ อัปเดตข้อมูลในตาราง Member
    this.http.patch(`${this.apiUrl}/${this.memberData.member_id}`, updateData).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = 'บันทึกข้อมูลเรียบร้อยแล้ว';
        this.isEditing = false;
        this.memberData = res; // อัปเดตข้อมูลล่าสุดในหน้า
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (err) => {
        console.error('เกิดข้อผิดพลาดในการบันทึก:', err);
        this.isLoading = false;
        this.errorMessage = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  goToWorkoutHistory(): void {
    this.router.navigate(['/workout-history']);
  }

  goToRegistrationHistory(): void {
    this.router.navigate(['/registration-history']);
  }

  /** ✅ ฟังก์ชันแปลงวันที่ */
  formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'ไม่ระบุ';
    try {
      return new Date(date).toLocaleDateString('th-TH');
    } catch {
      return 'ไม่ถูกต้อง';
    }
  }

  /** ✅ ฟังก์ชันแปลงค่าเพศเป็นข้อความไทย */
  getGenderDisplay(gender: string | undefined): string {
    switch (gender?.toLowerCase()) {
      case 'male':
        return 'ชาย';
      case 'female':
        return 'หญิง';
      case 'other':
        return 'อื่นๆ';
      default:
        return 'ไม่ระบุ';
    }
  }
}
