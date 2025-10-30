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

  onSubmit(): void {
    if (!this.validateForm()) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      username: this.formData.username,
      password: this.formData.password,
      full_name: this.formData.fullName, // ✅ Backend ต้องใช้ full_name
      email: this.formData.email,
      phone: this.formData.phone,
      birthdate: this.formData.dateOfBirth || null, // ✅ Backend ต้องใช้ birthdate
      gender: this.formData.gender,
      age: this.calculateAge(this.formData.dateOfBirth)
    };

    this.authService.register(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          this.successMessage = 'สมัครสมาชิกสำเร็จ! กำลังนำไปหน้าเข้าสู่ระบบ...';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        } else {
          this.errorMessage = res.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
      }
    });
  }

  private calculateAge(dateString: string): number {
    if (!dateString) return 0;
    const diff = Date.now() - new Date(dateString).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  }

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
