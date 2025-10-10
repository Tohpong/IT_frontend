import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface ServiceItem {
  id: number;
  title: string;
  description: string;
  icon: string;
  features: string[];
  price: string;
  duration: string;
  popular?: boolean;
}

interface ServiceStep {
  title: string;
  description: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface SelectedService {
  service: ServiceItem;
  selectedDate?: string;
  selectedTime?: string;
  notes?: string;
}

@Component({
  selector: 'app-service',
  templateUrl: './service.component.html',
  styleUrls: ['./service.component.css']
})
export class ServiceComponent implements OnInit {
  services: ServiceItem[] = [];
  serviceSteps: ServiceStep[] = [];
  faqs: FAQ[] = [];
  activeFaq: number = -1;
  selectedServices: SelectedService[] = [];
  showBookingModal: boolean = false;
  currentService: ServiceItem | null = null;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.services = [
      {
        id: 1,
        title: 'นัดหมายกับเทรนเนอร์',
        description: 'จองเวลาเทรนเนอร์ที่คุณต้องการได้ล่วงหน้า พร้อมการยืนยันทันที',
        icon: '📅',
        features: [
          'จองออนไลน์ 24/7',
          'ยืนยันการนัดหมายทันที',
          'แจ้งเตือนก่อนเวลานัด',
          'สามารถแก้ไขหรือยกเลิกได้'
        ],
        price: '299',
        duration: '1 ชั่วโมง',
      },
      {
        id: 2,
        title: 'ติดตามผลการฝึก',
        description: 'ดูสถิติและผลลัพธ์ของการฝึกแต่ละครั้งพร้อมการวิเคราะห์',
        icon: '📊',
        features: [
          'บันทึกผลการฝึกอัตโนมัติ',
          'กราฟแสดงความก้าวหน้า',
          'รายงานสรุปรายเดือน',
          'เปรียบเทียบผลลัพธ์'
        ],
        price: '199',
        duration: 'ตลอดเดือน'
      },
      {
        id: 3,
        title: 'ค้นหาเทรนเนอร์',
        description: 'เลือกเทรนเนอร์ที่เหมาะกับเป้าหมายของคุณ พร้อมข้อมูลครบถ้วน',
        icon: '🏋️',
        features: [
          'ค้นหาตามความเชี่ยวชาญ',
          'ดูรีวิวและคะแนน',
          'เปรียบเทียบเทรนเนอร์',
          'ติดต่อโดยตรง'
        ],
        price: '99',
        duration: 'ไม่จำกัด'
      },
      {
        id: 4,
        title: 'โปรแกรมส่วนตัว',
        description: 'รับโปรแกรมการฝึกที่ออกแบบเฉพาะสำหรับคุณ',
        icon: '🎯',
        features: [
          'ปรึกษาเป้าหมายส่วนตัว',
          'โปรแกรมออกแบบเฉพาะ',
          'ปรับแผนตามความก้าวหน้า',
          'การสนับสนุนต่อเนื่อง'
        ],
        price: '599',
        duration: '30 วัน',
      },
      {
        id: 5,
        title: 'กลุ่มฝึกหมู่',
        description: 'เข้าร่วมกลุ่มฝึกหมู่กับผู้คนที่มีเป้าหมายเดียวกัน',
        icon: '👥',
        features: [
          'เข้ากลุ่มตามระดับ',
          'กิจกรรมกลุ่มสนุกสนาน',
          'สร้างแรงบันดาลใจร่วมกัน',
          'ค่าใช้จ่ายประหยัด'
        ],
        price: '399',
        duration: '4 สัปดาห์'
      },
      {
        id: 6,
        title: 'คำปรึกษาโภชนาการ',
        description: 'รับคำแนะนำด้านโภชนาการจากผู้เชี่ยวชาญ',
        icon: '🥗',
        features: [
          'วิเคราะห์สุขภาพเบื้องต้น',
          'แผนอาหารส่วนตัว',
          'ติดตามการกินประจำวัน',
          'คำแนะนำจากโภชนากร'
        ],
        price: '499',
        duration: '2 สัปดาห์'
      }
    ];

    this.serviceSteps = [
      {
        title: 'สมัครสมาชิก',
        description: 'สร้างบัญชีผู้ใช้และกรอกข้อมูลส่วนตัว'
      },
      {
        title: 'เลือกบริการ',
        description: 'เลือกบริการที่ต้องการและแพ็คเกจที่เหมาะสม'
      },
      {
        title: 'จับคู่เทรนเนอร์',
        description: 'ระบบจะแนะนำเทรนเนอร์ที่เหมาะกับคุณ'
      },
      {
        title: 'เริ่มการฝึก',
        description: 'เริ่มการฝึกตามโปรแกรมที่วางแผนไว้'
      }
    ];

    this.faqs = [
      {
        question: 'ฉันสามารถยกเลิกการนัดหมายได้หรือไม่?',
        answer: 'ได้ครับ คุณสามารถยกเลิกหรือแก้ไขการนัดหมายได้ก่อนเวลานัดอย่างน้อย 24 ชั่วโมง โดยไม่มีค่าใช้จ่ายเพิ่มเติม'
      },
      {
        question: 'เทรนเนอร์มีใบรับรองมืออาชีพหรือไม่?',
        answer: 'ใช่ครับ เทรนเนอร์ทุกคนของเรามีใบรับรองจากสถาบันที่ได้รับการยอมรับ และผ่านการอบรมอย่างต่อเนื่อง'
      },
      {
        question: 'มีการรับประกันผลลัพธ์หรือไม่?',
        answer: 'เรารับประกันความพึงพอใจ หากคุณไม่พอใจกับบริการในเดือนแรก เราจะคืนเงิน 100%'
      },
      {
        question: 'สามารถเปลี่ยนเทรนเนอร์ได้หรือไม่?',
        answer: 'ได้ครับ คุณสามารถเปลี่ยนเทรนเนอร์ได้ตลอดเวลา เราต้องการให้คุณได้เทรนเนอร์ที่เหมาะสมที่สุด'
      },
      {
        question: 'มีบริการสำหรับผู้เริ่มต้นหรือไม่?',
        answer: 'มีครับ เรามีโปรแกรมพิเศษสำหรับผู้เริ่มต้น พร้อมคำแนะนำแบบละเอียดและการดูแลเป็นพิเศษ'
      }
    ];
  }

  selectService(service: ServiceItem): void {
    this.currentService = service;
    this.showBookingModal = true;
  }

  bookService(service: ServiceItem, bookingData?: any): void {
    const selectedService: SelectedService = {
      service: service,
      selectedDate: bookingData?.date,
      selectedTime: bookingData?.time,
      notes: bookingData?.notes
    };

    // เพิ่มบริการที่เลือกลงใน array
    this.selectedServices.push(selectedService);
    
    // บันทึกลง localStorage
    const existingServices = JSON.parse(localStorage.getItem('selectedServices') || '[]');
    existingServices.push(selectedService);
    localStorage.setItem('selectedServices', JSON.stringify(existingServices));

    this.showBookingModal = false;
    this.currentService = null;

    // แสดงข้อความยืนยัน
    alert(`คุณได้เลือกบริการ "${service.title}" เรียบร้อยแล้ว!\nราคา: ${service.price} บาท/เดือน\nระยะเวลา: ${service.duration}\n\nเราจะติดต่อกลับเพื่อยืนยันการใช้บริการภายใน 24 ชั่วโมง`);
  }

  closeBookingModal(): void {
    this.showBookingModal = false;
    this.currentService = null;
  }

  isServiceSelected(serviceId: number): boolean {
    return this.selectedServices.some(selected => selected.service.id === serviceId);
  }

  getSelectedServiceCount(): number {
    return this.selectedServices.length;
  }

  viewSelectedServices(): void {
    if (this.selectedServices.length > 0) {
      this.router.navigate(['/profile'], { 
        queryParams: { tab: 'services' }
      });
    } else {
      alert('คุณยังไม่ได้เลือกบริการใดๆ');
    }
  }

  toggleFaq(index: number): void {
    this.activeFaq = this.activeFaq === index ? -1 : index;
  }
}