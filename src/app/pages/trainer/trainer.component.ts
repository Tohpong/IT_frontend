import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Trainer {
  id: number;
  name: string;        // trainer_fullname
  specialty: string;   // course_name (จาก Course)
  experience: number;  // trainer_year
  age: number;         // trainer_age
  bio: string;         // trainer_bio
  image: string;       // trainer_url
  schedule: string;    // schedule
  rating: number;      // rating
  email: string;       // trainer_email
  phone: string;       // trainer_phone
}

@Component({
  selector: 'app-trainer',
  templateUrl: './trainer.component.html',
  styleUrls: ['./trainer.component.css']
})
export class TrainerComponent implements OnInit {
  trainers: Trainer[] = [];

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadTrainers();
  }

  /** โหลดข้อมูล Trainer ทั้งหมดจาก backend */
  loadTrainers(): void {
    this.http.get<any[]>('https://itbackend-production.up.railway.app/trainer').subscribe({
      next: (data) => {
        this.trainers = data.map(t => ({
          id: t.trainer_id,
          name: t.trainer_fullname,
          specialty: t.course_name,
          experience: Number(t.trainer_year),
          age: t.trainer_age,
          bio: t.trainer_bio,
          image: t.trainer_url,
          schedule: t.schedule,
          rating: t.rating,
          email: t.trainer_email,
          phone: t.trainer_phone
        }));
      },
      error: (err) => {
        console.error('โหลดข้อมูลเทรนเนอร์ไม่สำเร็จ:', err);
      }
    });
  }

  viewTrainerDetail(trainerId: number): void {
    this.router.navigate(['/trainer', trainerId]);
  }

  /** ฟังก์ชันสร้างดาวคะแนน */
  getStarRating(rating: number): string[] {
    const stars: string[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    for (let i = 0; i < fullStars; i++) stars.push('★');
    if (hasHalfStar) stars.push('☆');
    while (stars.length < 5) stars.push('☆');
    return stars;
  }
}