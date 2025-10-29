import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Course {
  course_id: number;
  course_name: string;
  description: string;
  duration: string;
  price: number;
  level: string;
  img_url: string;
  tags: string;
  trainer_name: string;
}

@Component({
  selector: 'app-course-enrollment',
  templateUrl: './course-enrollment.component.html',
  styleUrls: ['./course-enrollment.component.css']
})
export class CourseEnrollmentComponent implements OnInit {
  enrollmentForm!: FormGroup;
  course!: Course | null;
  isSubmitting = false;
  showSuccessMessage = false;
  isLoading = false;
  errorMessage = '';

  private courseApiUrl = 'http://localhost:8000/course';
  private memberApiUrl = 'http://localhost:8000/member';
  private accountApiUrl = 'http://localhost:8000/account';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.enrollmentForm = this.createForm();

    // ✅ โหลดข้อมูลคอร์ส
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (id) this.loadCourse(id);
      else this.router.navigate(['/course']);
    });

    // ✅ ดึงข้อมูลสมาชิกถ้ามี (เช่น หลังล็อกอิน)
    this.loadMemberInfo();
  }

  /** ✅ โหลดข้อมูลคอร์สจาก backend */
  loadCourse(id: number): void {
    this.isLoading = true;
    this.http.get<Course>(`${this.courseApiUrl}/${id}`).subscribe({
      next: (res) => {
        this.course = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ โหลดข้อมูลคอร์สผิดพลาด:', err);
        this.errorMessage = 'ไม่พบข้อมูลคอร์ส';
        this.isLoading = false;
      }
    });
  }

  /** ✅ โหลดข้อมูลสมาชิกจาก backend (ถ้ามี account_id) */
  loadMemberInfo(): void {
    const accountData = localStorage.getItem('user'); // สมมติว่าเก็บข้อมูลผู้ใช้หลังล็อกอินไว้ใน localStorage
    if (!accountData) return; // ยังไม่ได้ล็อกอิน

    const user = JSON.parse(accountData);
    const accountId = user.account_id;

    if (!accountId) return;

    // ✅ ดึงข้อมูล Member จาก backend
    this.http.get<any>(`${this.memberApiUrl}/${accountId}`).subscribe({
      next: (member) => {
        console.log('📥 โหลดข้อมูลสมาชิก:', member);

        // ✅ เติมค่าในฟอร์ม (เฉพาะฟิลด์ที่ต้องการ)
        this.enrollmentForm.patchValue({
          fullName: member.full_name || '',
          email: member.email || '',   // ถ้ามี email ใน member หรืออาจต้องดึงจาก account
          phone: member.phone || ''
        });

        // ✅ ถ้า member ไม่มี email ให้ลองดึงจากตาราง Account
        if (!member.email) {
          this.http.get<any>(`${this.accountApiUrl}/${accountId}`).subscribe({
            next: (acc) => {
              this.enrollmentForm.patchValue({ email: acc.email || '' });
            },
            error: (err) => console.warn('ไม่พบ email ใน account', err)
          });
        }
      },
      error: (err) => {
        console.error('❌ โหลดข้อมูลสมาชิกผิดพลาด:', err);
      }
    });
  }

  /** ✅ ฟอร์มสมัครเรียน */
  createForm(): FormGroup {
    return this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      medicalConditions: [''],
      experience: ['', Validators.required],
      goals: ['', [Validators.required, Validators.minLength(10)]],
      paymentMethod: ['', Validators.required],
      agreeTerms: [false, Validators.requiredTrue]
    });
  }

  /** ✅ เมื่อกดปุ่มสมัคร */
  onSubmit(): void {
    if (this.enrollmentForm.valid && this.course) {
      this.isSubmitting = true;

      const formValue = this.enrollmentForm.value;

      const payload = {
        full_name: formValue.fullName,
        email: formValue.email,
        phone: formValue.phone,
        course_id: this.course.course_id,
        course_name: this.course.course_name,
        price: this.course.price,
        enrollment_date: new Date().toISOString(),
        experience: formValue.experience,
        goals: formValue.goals,
        medical_conditions: formValue.medicalConditions
      };

      console.log('📦 ส่งข้อมูลไป Backend:', payload);

      this.http.post('http://localhost:8000/enroll', payload).subscribe({
        next: (res) => {
          console.log('✅ สมัครเรียนสำเร็จ', res);
          this.showSuccessMessage = true;
          setTimeout(() => this.router.navigate(['/registration-history']), 3000);
        },
        error: (err) => {
          console.error('❌ เกิดข้อผิดพลาดขณะสมัคร:', err);
          this.isSubmitting = false;
        },
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  markFormGroupTouched(): void {
    Object.values(this.enrollmentForm.controls).forEach(c => c.markAsTouched());
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.enrollmentForm.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  getFieldError(field: string): string {
    const ctrl = this.enrollmentForm.get(field);
    if (!ctrl || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'กรุณากรอกข้อมูล';
    if (ctrl.errors['email']) return 'อีเมลไม่ถูกต้อง';
    if (ctrl.errors['pattern']) return 'หมายเลขโทรศัพท์ไม่ถูกต้อง';
    if (ctrl.errors['requiredTrue']) return 'กรุณายอมรับเงื่อนไข';
    if (ctrl.errors['minlength']) return 'ข้อมูลสั้นเกินไป';
    return '';
  }

  goBack(): void {
    this.router.navigate(['/course']);
  }
}
