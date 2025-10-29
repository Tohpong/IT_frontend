import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  formData = {
    username: '',
    email: '',
    fullName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    password: '',
    confirmPassword: ''
  };

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // ✅ เมื่อกด "สมัครสมาชิก"
onSubmit(): void {
  if (!this.validateForm()) return;

  this.isLoading = true;
  this.errorMessage = '';
  this.successMessage = '';

  // 🧩 แยกข้อมูลเป็น 2 ส่วน — account + member
  const accountData = {
    username: this.formData.username,
    password: this.formData.password
  };

  const memberData = {
    fullName: this.formData.fullName,
    phone: this.formData.phone,
    dateOfBirth: this.formData.dateOfBirth
      ? new Date(this.formData.dateOfBirth)
      : undefined,
    gender: this.formData.gender,
    email: this.formData.email, // ✅ เพิ่ม email ในส่วน Member
    age: this.calculateAge(this.formData.dateOfBirth)
  };

  // ✅ ส่งทั้งสองส่วนไป AuthService
  this.authService.register(accountData, memberData).subscribe({
    next: (success) => {
      this.isLoading = false;
      if (success) {
        this.successMessage = 'สมัครสมาชิกสำเร็จ! กำลังนำไปหน้าเข้าสู่ระบบ...';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      } else {
        this.errorMessage = 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว';
      }
    },
    error: () => {
      this.isLoading = false;
      this.errorMessage = 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
    }
  });
}


  // ✅ คำนวณอายุจากวันเกิด
  private calculateAge(dateString: string): number {
    if (!dateString) return 0;
    const diff = Date.now() - new Date(dateString).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  }

  // ✅ ตรวจสอบความถูกต้องของข้อมูลก่อนส่ง
  private validateForm(): boolean {
    if (
      !this.formData.username ||
      !this.formData.email ||
      !this.formData.fullName ||
      !this.formData.password ||
      !this.formData.confirmPassword
    ) {
      this.errorMessage = 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน';
      return false;
    }

    // ตรวจรูปแบบอีเมล
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.formData.email)) {
      this.errorMessage = 'กรุณากรอกอีเมลให้ถูกต้อง';
      return false;
    }

    if (this.formData.password !== this.formData.confirmPassword) {
      this.errorMessage = 'รหัสผ่านไม่ตรงกัน';
      return false;
    }

    if (this.formData.password.length < 6) {
      this.errorMessage = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
      return false;
    }

    return true;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}