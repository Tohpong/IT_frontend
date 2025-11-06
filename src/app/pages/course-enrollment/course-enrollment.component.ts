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
  // QR data
  qrDataUrl: string | null = null;
  // If you have a real QR image (for example placed in `src/assets/qr/real-qr.png`), set this to that path or a full URL.
  // When `qrImageUrl` is set we will display/download it instead of generating a new QR payload.
  // Default: set to your asset path or null. Use the runtime-served path `/assets/...` (not `src/assets/...`).
  qrImageUrl: string | null = '/assets/qr/IMG_8003.png';
  // Merchant PromptPay identifier (phone number or tax id). Replace with your actual merchant id.
  promptpayId = '7060954732';
  enrollmentForm!: FormGroup;
  course!: Course | null;
  isSubmitting = false;
  showSuccessMessage = false;
  isLoading = false;
  errorMessage = '';

  private courseApiUrl = 'https://itbackend-production.up.railway.app/course';
  private memberApiUrl = 'https://itbackend-production.up.railway.app/member';
  private accountApiUrl = 'https://itbackend-production.up.railway.app/account';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.enrollmentForm = this.createForm();

    // react to payment method changes to generate QR when PromptPay selected
    this.enrollmentForm.get('paymentMethod')?.valueChanges.subscribe(value => {
      if (value === 'promptpay' && this.course) {
        // if a real QR image was supplied, skip generation and just show the image
        if (!this.qrImageUrl) {
          this.generatePromptpayQr(this.promptpayId, this.course.price).catch(err => console.error('QR gen error', err));
        } else {
          // ensure generated QR is cleared when using a real image
          this.qrDataUrl = null;
        }
      } else {
        this.qrDataUrl = null;
      }
    });

    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (id) this.loadCourse(id);
      else this.router.navigate(['/course']);
    });

    const userData = localStorage.getItem('currentUser');
    console.log('🧩 currentUser =', userData ? JSON.parse(userData) : null);

    this.loadMemberInfo();
  }

  /** Generate PromptPay payload and QR image data URL */
  private async generatePromptpayQr(id: string, amount: number) {
    try {
      // dynamic import to avoid build errors if libs not installed
      const promptpayModule = await import('promptpay-qr').catch(() => null);
      const qrcode = await import('qrcode');

      let payload: string;

      // normalize imported module to a callable function or object (cast to any to avoid TS type errors)
      const ppAny: any = promptpayModule && ((promptpayModule as any).create || (promptpayModule as any).generate || (promptpayModule as any).default || promptpayModule);

      if (ppAny) {
        // try calling as function signature (id, amount) or with options object
        try {
          if (typeof ppAny === 'function') {
            payload = ppAny(id, amount);
          } else if (typeof ppAny.create === 'function') {
            payload = ppAny.create(id, amount);
          } else if (typeof ppAny.generate === 'function') {
            payload = ppAny.generate(id, amount);
          } else if (typeof ppAny.default === 'function') {
            payload = ppAny.default(id, amount);
          } else {
            // last resort: attempt to stringify
            payload = String(ppAny);
          }
        } catch (e) {
          // try object-style call
          try {
            if (typeof ppAny === 'function') {
              payload = (ppAny as any)({ id, amount });
            } else if (typeof ppAny.create === 'function') {
              payload = ppAny.create({ id, amount });
            } else if (typeof ppAny.generate === 'function') {
              payload = ppAny.generate({ id, amount });
            } else if (typeof ppAny.default === 'function') {
              payload = ppAny.default({ id, amount });
            } else {
              payload = String(ppAny);
            }
          } catch (err) {
            throw err;
          }
        }
      } else {
        // fallback: build a very small EMVco-like string is complex; as a simple fallback encode phone:amount
        payload = `PROMPTPAY:${id}:${amount}`;
        console.warn('promptpay-qr not available, using fallback payload');
      }

      // generate QR image as data URL
      const dataUrl = await qrcode.toDataURL(payload.toString());
      this.qrDataUrl = dataUrl;
    } catch (e) {
      console.error('Failed to generate PromptPay QR', e);
      this.qrDataUrl = null;
      throw e;
    }
  }

  // copy promptpay id to clipboard
  copyPromptpayId(): void {
    const text = this.promptpayId || '';
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        alert('คัดลอกหมายเลขพร้อมเพย์เรียบร้อยแล้ว');
      }, () => {
        // fallback
        this.fallbackCopyText(text);
      });
    } else {
      this.fallbackCopyText(text);
    }
  }

  private fallbackCopyText(text: string) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      alert('คัดลอกหมายเลขพร้อมเพย์เรียบร้อยแล้ว');
    } catch (e) {
      alert('ไม่สามารถคัดลอก กรุณาคัดลอกด้วยตนเอง: ' + text);
    }
    document.body.removeChild(ta);
  }

  // download the generated QR as PNG
  downloadQr(): void {
    const filename = `promptpay-${this.course?.course_id || 'qr'}.png`;

    // If we have a data URL (generated QR), download directly
    if (this.qrDataUrl && this.qrDataUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = this.qrDataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // If we have a real image URL (assets or hosted), fetch it as blob then download
    if (this.qrImageUrl) {
      fetch(this.qrImageUrl)
        .then(res => res.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        })
        .catch(err => {
          console.error('ไม่สามารถดาวน์โหลดไฟล์ QR ได้', err);
          alert('เกิดข้อผิดพลาดขณะดาวน์โหลด QR');
        });
      return;
    }

    alert('ไม่มี QR ให้ดาวน์โหลด');
  }

  /**
   * Convenience helper: set a real QR image from assets folder.
   * Example: useQrImageFromAssets('krungthai-qr.png') will use `assets/qr/krungthai-qr.png`.
   */
  useQrImageFromAssets(filename: string) {
    if (!filename) return;
    // this path assumes Angular serves files under `src/assets` at `/assets/`
    this.qrImageUrl = `/assets/qr/${filename}`;
    // clear any generated QR
    this.qrDataUrl = null;
  }

  /** ✅ โหลดข้อมูลคอร์สจาก backend */
  loadCourse(id: number): void {
    this.isLoading = true;
    this.http.get<Course>(`${this.courseApiUrl}/${id}`).subscribe({
      next: (res) => {
        this.course = res;
        this.isLoading = false;
        // If payment method is promptpay (we defaulted it), trigger QR generation automatically
        const pm = this.enrollmentForm.get('paymentMethod')?.value;
        if (pm === 'promptpay' && this.course) {
          if (!this.qrImageUrl) {
            this.generatePromptpayQr(this.promptpayId, this.course.price).catch(err => console.error('QR gen error', err));
          } else {
            this.qrDataUrl = null;
          }
        }
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
    const accountData = localStorage.getItem('currentUser');
    if (!accountData) return;

    const user = JSON.parse(accountData);
    const accountId = user.account_id || user.id; // รองรับทั้งสองแบบ

    if (!accountId) return;

    // ✅ ดึงข้อมูลโปรไฟล์จาก /account/profile/:accountId
    this.http.get<any>(`${this.accountApiUrl}/profile/${accountId}`).subscribe({
      next: (profile) => {
        console.log('📥 โหลดข้อมูลโปรไฟล์:', profile);

        this.enrollmentForm.patchValue({
          fullName: profile.full_name || '',
          email: profile.email || '',
          phone: profile.phone || ''
        });
      },
      error: (err) => {
        console.error('❌ โหลดข้อมูลโปรไฟล์ผิดพลาด:', err);
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
      // default to promptpay so the payment UI shows automatically
      paymentMethod: ['promptpay', Validators.required],
      agreeTerms: [false, Validators.requiredTrue]
    });
  }

  /** ✅ เมื่อกดปุ่มสมัคร */
  onSubmit(): void {
    if (this.enrollmentForm.valid && this.course) {
      this.isSubmitting = true;
      const formValue = this.enrollmentForm.value;

      // ✅ ดึงข้อมูลผู้ใช้จาก localStorage (ใช้ key ให้ตรงกับที่ใช้ในระบบ)
      const accountData = localStorage.getItem('currentUser');
      if (!accountData) {
        console.error('❌ ไม่มีข้อมูลผู้ใช้ใน localStorage');
        this.isSubmitting = false;
        return;
      }

      const user = JSON.parse(accountData);
      const member_id = user.member_id || user.account_id;

      const payload = {
        member_id,
        full_name: formValue.fullName,
        email: formValue.email,
        phone: formValue.phone,
        course_id: this.course!.course_id,
        course_name: this.course!.course_name,
        price: this.course!.price,
        enrollment_date: new Date().toISOString(),
        experience: formValue.experience,
        goals: formValue.goals,
        medical_conditions: formValue.medicalConditions,
        payment_method: formValue.paymentMethod   // ✅ เพิ่มให้ตรงกับ backend
      };

      console.log('📦 ส่งข้อมูลไป Backend:', payload);

      this.http.post('https://itbackend-production.up.railway.app/enroll', payload).subscribe({
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