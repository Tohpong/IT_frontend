import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  isLoading = false;
  errorMessage = '';
  returnUrl = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // ตรวจสอบว่ามี returnUrl ไหม
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/profile';
  }

  onSubmit(): void {
    if (!this.username || !this.password) {
      this.errorMessage = 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.username, this.password).subscribe({
      next: (success) => {
        this.isLoading = false;
        if (success) {
          // เปลี่ยนเส้นทางไปยังหน้าที่ต้องการเดิม หรือ profile
          this.router.navigate([this.returnUrl]);
        } else {
          this.errorMessage = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      }
    });
  }


  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
