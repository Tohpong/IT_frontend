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
  memberData: any = null;
  isEditing = false;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  editForm: any = {};
  profileImage: string | null = null; // ✅ รูปโปรไฟล์

  private apiUrl = 'http://localhost:8000/member';

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

ngOnInit(): void {
  this.currentUser = this.authService.getCurrentUser();
  if (!this.currentUser) {
    this.router.navigate(['/login']);
    return;
  }

  const accountId = this.currentUser.id; // ✅ ใช้ account_id จาก user ที่ล็อกอินอยู่
  this.loadProfile(accountId);
}

private loadProfile(accountId: number): void {
  this.http.get<any>(`http://localhost:8000/account/profile/${accountId}`).subscribe({
    next: (res) => {
      this.memberData = res;
      this.profileImage = res.account_pic || null;
      this.resetEditForm();
    },
    error: (err) => {
      console.error('โหลดข้อมูลโปรไฟล์ผิดพลาด:', err);
      this.errorMessage = 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้';
    }
  });
}

  private loadMemberData(memberId: number): void {
    this.http.get(`${this.apiUrl}/${memberId}`).subscribe({
      next: (res: any) => {
        this.memberData = res;
        this.profileImage = res.account_pic || null;
        this.resetEditForm();
      },
      error: (err) => {
        console.error('โหลดข้อมูลสมาชิกผิดพลาด:', err);
        this.errorMessage = 'ไม่สามารถโหลดข้อมูลสมาชิกได้';
      }
    });
  }

  resetEditForm(): void {
    if (this.memberData) {
      this.editForm = {
        fullName: this.memberData.full_name || '',
        email: this.memberData.email || '',
        phone: this.memberData.phone || '',
        dateOfBirth: this.memberData.birthdate
          ? new Date(this.memberData.birthdate).toISOString().split('T')[0]
          : '',
        gender: this.memberData.gender || '',
        age: this.memberData.age || ''
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

    const updateData = {
      full_name: this.editForm.fullName,
      email: this.editForm.email,
      phone: this.editForm.phone,
      birthdate: this.editForm.dateOfBirth || null,
      gender: this.editForm.gender,
      age: this.calcAge(this.editForm.dateOfBirth)
    };

    if (!this.memberData?.member_id) {
      this.errorMessage = 'ไม่พบรหัสสมาชิก';
      this.isLoading = false;
      return;
    }

    this.http.patch(`${this.apiUrl}/${this.memberData.member_id}`, updateData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.successMessage = 'บันทึกข้อมูลเรียบร้อยแล้ว';
        this.isEditing = false;
        this.memberData = res;
        this.profileImage = res.account_pic || this.profileImage;
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

  formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'ไม่ระบุ';
    try {
      return new Date(date).toLocaleDateString('th-TH');
    } catch {
      return 'ไม่ถูกต้อง';
    }
  }

  getGenderDisplay(gender: string | undefined): string {
    switch (gender?.toLowerCase()) {
      case 'male': return 'ชาย';
      case 'female': return 'หญิง';
      case 'other': return 'อื่นๆ';
      default: return 'ไม่ระบุ';
    }
  }
}
