
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  isEditing = false;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  editForm: any = {};

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    this.resetEditForm();
  }

  resetEditForm(): void {
    if (this.currentUser) {
      this.editForm = {
        fullName: this.currentUser.fullName,
        email: this.currentUser.email,
        phone: this.currentUser.phone || '',
        dateOfBirth: this.currentUser.dateOfBirth ? 
          new Date(this.currentUser.dateOfBirth).toISOString().split('T')[0] : '',
        gender: this.currentUser.gender || ''
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

  saveProfile(): void {
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const updateData = {
      fullName: this.editForm.fullName,
      email: this.editForm.email,
      phone: this.editForm.phone,
      dateOfBirth: this.editForm.dateOfBirth ? new Date(this.editForm.dateOfBirth) : undefined,
      gender: this.editForm.gender
    };

    this.authService.updateProfile(updateData).subscribe({
      next: (success) => {
        this.isLoading = false;
        if (success) {
          this.currentUser = this.authService.getCurrentUser();
          this.isEditing = false;
          this.successMessage = 'บันทึกข้อมูลเรียบร้อยแล้ว';
          setTimeout(() => this.successMessage = '', 3000);
        } else {
          this.errorMessage = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
        }
      },
      error: () => {
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

  formatDate(date: Date | undefined): string {
    if (!date) return 'ไม่ระบุ';
    return new Date(date).toLocaleDateString('th-TH');
  }

  getGenderDisplay(gender: string | undefined): string {
    switch (gender) {
      case 'male': return 'ชาย';
      case 'female': return 'หญิง';
      case 'other': return 'อื่นๆ';
      default: return 'ไม่ระบุ';
    }
  }
}
 