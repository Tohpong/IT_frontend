import { Component } from '@angular/core';
import { AdminService } from '../../services/admin.service';


@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {
  name: string = '';
  email: string = '';
  message: string = '';
  submitting = false;

  constructor(private adminService: AdminService) {}

  onSubmit() {
    if (!this.name || !this.email || !this.message) {
      alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    this.submitting = true;
    this.adminService.createMessage({ name: this.name, email: this.email, message: this.message }).subscribe(res => {
      this.submitting = false;
      if (res && res.id) {
        alert('ส่งข้อความสำเร็จ เจ้าหน้าที่จะติดต่อกลับภายหลัง');
        this.name = '';
        this.email = '';
        this.message = '';
      } else {
        alert('เกิดปัญหาในการส่งข้อความ โปรดลองอีกครั้งภายหลัง');
      }
    });
  }
}