import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Course {
  course_id: number;
  course_name: string;
  description: string;
  duration: string;
  img_url: string;
  price: number;
  level: string;
  tags: string;
  account_id: number;
  trainer_name?: string; // เพิ่มจากการ JOIN กับ Account
}

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.css']
})
export class CourseComponent implements OnInit {
  courses: Course[] = [];
  courseBenefits: Benefit[] = [
    { icon: '💪', title: 'เทรนเนอร์มืออาชีพ', description: 'ฝึกกับเทรนเนอร์ที่ได้รับการรับรองและมีประสบการณ์สูง' },
    { icon: '🏋️', title: 'อุปกรณ์ครบครัน', description: 'อุปกรณ์ออกกำลังกายทันสมัยและหลากหลาย' },
    { icon: '📈', title: 'ติดตามผลลัพธ์', description: 'วัดผลและติดตามความก้าวหน้าของร่างกายอย่างชัดเจน' },
    { icon: '🏆', title: 'โปรแกรมส่วนตัว', description: 'โปรแกรมการออกกำลังกายที่ปรับตามความต้องการของคุณ' },
    { icon: '👥', title: 'ชุมชนสุขภาพดี', description: 'เข้าร่วมกลุ่มผู้ที่รักการออกกำลังกายและแลกเปลี่ยนประสบการณ์' },
    { icon: '📞', title: 'ปรึกษาได้ทุกเวลา', description: 'ให้คำปรึกษาด้านสุขภาพและการออกกำลังกายตลอด 24 ชั่วโมง' }
  ];

  isLoading = false;
  errorMessage = '';

  private apiUrl = 'https://itbackend-production.up.railway.app/course';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.isLoading = true;
    this.http.get<Course[]>(this.apiUrl).subscribe({
      next: (res) => {
        this.courses = res.map(c => ({
          ...c,
          img_url: c.img_url || 'https://via.placeholder.com/800x400?text=No+Image',
          description: c.description || 'ไม่มีคำอธิบายคอร์ส',
          level: c.level || 'ไม่ระบุ',
          duration: c.duration || '-',
          price: c.price || 0
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ โหลดข้อมูลคอร์สผิดพลาด:', err);
        this.errorMessage = 'ไม่สามารถโหลดข้อมูลคอร์สได้';
        this.isLoading = false;
      }
    });
  }

  getEnrollmentCount(courseId: number): number {
    const counts = [120, 85, 150, 95, 110, 75];
    return counts[(courseId - 1) % counts.length];
  }

  getLevelColor(level: string): string {
    switch (level.toLowerCase()) {
      case 'beginner':
      case 'เริ่มต้น': return 'linear-gradient(135deg, #4CAF50, #66BB6A)';
      case 'intermediate':
      case 'กลาง': return 'linear-gradient(135deg, #FF9800, #FFB74D)';
      case 'advanced':
      case 'สูง': return 'linear-gradient(135deg, #F44336, #EF5350)';
      default: return 'linear-gradient(135deg, #4CAF50, #66BB6A)';
    }
  }

  /** ✅ ไปหน้าสมัครคอร์ส (ส่ง id ไปแทน JSON) */
  enrollCourse(course: Course): void {
    this.router.navigate(['/course-enrollment'], { queryParams: { id: course.course_id } });
  }
}
