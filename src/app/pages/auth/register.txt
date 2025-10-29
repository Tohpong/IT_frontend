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
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const userData = {
      username: this.formData.username,
      email: this.formData.email,
      fullName: this.formData.fullName,
      phone: this.formData.phone,
      dateOfBirth: this.formData.dateOfBirth ? new Date(this.formData.dateOfBirth) : undefined,
      gender: this.formData.gender
    };

    this.authService.register(userData, this.formData.password).subscribe({
      next: (success) => {
        this.isLoading = false;
        if (success) {
          this.successMessage = 'สมัครสมาชิกสำเร็จ! กำลังนำไปหน้าเข้าสู่ระบบ...';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.errorMessage = 'ชื่อผู้ใช้หรืออีเมลนี้มีอยู่ในระบบแล้ว';
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
      }
    });
  }

  private validateForm(): boolean {
    if (!this.formData.username || !this.formData.email || !this.formData.fullName || 
        !this.formData.password || !this.formData.confirmPassword) {
      this.errorMessage = 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน';
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.formData.email)) {
      this.errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
      return false;
    }

    return true;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
