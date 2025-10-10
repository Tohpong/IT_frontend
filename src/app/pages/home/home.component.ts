import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

interface NewsItem {
  id: number;
  title: string;
  description: string;
  image: string;
  category: string;
  link?: string;
  isExternal?: boolean;
  routerLink?: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  welcomeMessage: string = 'ระบบติดตามและนัดหมายเทรนเนอร์';

  // ✅ เพิ่มชุดภาพสำหรับ Hero Section
  heroImages: string[] = [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=1000&q=80'
  ];

  // ✅ ตัวแปรสำหรับควบคุมภาพ
  index: number = 0;
  currentImage: string = this.heroImages[0];
  fadeIn: boolean = true;
  private slideshowInterval: any;

  // ✅ ข่าว (เหมือนเดิม)
  newsItems: NewsItem[] = [
    {
      id: 1,
      title: 'กีฬาออนไลน์',
      description: 'เรียนรู้ท่าออกกำลังกาย เทคนิคการเล่นกีฬา และสุขภาพดี',
      image: 'https://fth0.com/uppic/13101493/news/13101493_0_20181106-165658.png',
      category: 'กีฬาออนไลน์',
      link: 'https://www.homefittools.com/news/16-Basic-Exercise.html',
      isExternal: true
    },
    {
      id: 2,
      title: 'คอร์สออนไลน์',
      description: 'คอร์สเรียนออนไลน์สำหรับผู้เริ่มต้น',
      image: 'https://images.unsplash.com/photo-1616279969856-759f316a5ac1?auto=format&fit=crop&w=1000&q=80',
      category: 'คอร์สออนไลน์',
      routerLink: '/course',
      isExternal: false
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.startSlideshow();
  }

  ngOnDestroy(): void {
    this.stopSlideshow();
  }

  // ✅ สไลด์อัตโนมัติ
  startSlideshow(): void {
    this.slideshowInterval = setInterval(() => {
      this.nextImage();
    }, 4000);
  }

  stopSlideshow(): void {
    if (this.slideshowInterval) {
      clearInterval(this.slideshowInterval);
    }
  }

  // ✅ เปลี่ยนภาพไปข้างหน้า
  nextImage(): void {
    this.fadeIn = false;
    setTimeout(() => {
      this.index = (this.index + 1) % this.heroImages.length;
      this.currentImage = this.heroImages[this.index];
      this.fadeIn = true;
    }, 300);
  }

  // ✅ ย้อนกลับภาพก่อนหน้า
  prevImage(): void {
    this.fadeIn = false;
    setTimeout(() => {
      this.index = (this.index - 1 + this.heroImages.length) % this.heroImages.length;
      this.currentImage = this.heroImages[this.index];
      this.fadeIn = true;
    }, 300);
  }

  // ✅ เลือกภาพด้วยจุดวงกลม
  goToImage(i: number): void {
    this.stopSlideshow();
    this.fadeIn = false;
    setTimeout(() => {
      this.index = i;
      this.currentImage = this.heroImages[this.index];
      this.fadeIn = true;
      this.startSlideshow();
    }, 300);
  }

  // ✅ คลิกข่าว
  onNewsClick(news: NewsItem): void {
    if (news.isExternal && news.link) {
      window.open(news.link, '_blank');
    } else if (news.routerLink) {
      this.router.navigate([news.routerLink]);
    }
  }
}
