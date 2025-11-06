import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';
import { AdminService, AdminUser } from '../../services/admin.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  currentUser: User | null = null;

  // UI state
  activeTab: 'users' | 'messages' = 'users';
  // include messages tab
  // eslint-disable-next-line @typescript-eslint/ban-types
  messages: any[] = [];
  users: AdminUser[] = [];
  registrations: any[] = [];
  // keep stats object only for backward compatibility if used elsewhere, but we won't load it
  stats: any = { users: 0, courses: 0, registrations: 0, revenue: 0 };
  loading = { users: false };

  constructor(private authService: AuthService, private adminService: AdminService) {}

  // helper to resolve user id from different possible backend shapes
  private getUserId(u: AdminUser): number | undefined {
    // try common field names: account_id, id, _id, accountId
    return (u as any).account_id || (u as any).id || (u as any)._id || (u as any).accountId;
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUsers();
    this.loadMessages();
  }

  setTab(tab: 'users' | 'messages') {
    this.activeTab = tab;
  }

  // Users
  loadUsers() {
    this.loading.users = true;
    this.adminService.getUsers().subscribe(list => {
      this.users = list;
  this.loading.users = false;
    });
  }

  removeUser(u: AdminUser) {
    console.log('Deleting user:', u);
    const id = this.getUserId(u);
    if (!id) {
      console.error('deleteUser: id undefined for user', u);
      return alert('ไม่สามารถลบผู้ใช้: ไม่พบ id ของผู้ใช้ (ตรวจสอบ API หรือ mapping)');
    }
    if (!confirm(`ลบผู้ใช้ ${u.username} ?`)) return;
    this.adminService.deleteUser(id).subscribe(ok => {
      if (ok) this.users = this.users.filter(x => this.getUserId(x) !== id);
      else alert('ลบไม่สำเร็จ');
    });
  }


  // Edit / create user
  editingUser: AdminUser | null = null;
  newUserMode = false;
  userForm: Partial<AdminUser & { password?: string }> = {};

  startEditUser(u: AdminUser) {
    this.editingUser = { ...u };
    this.userForm = { ...u };
    this.newUserMode = false;
  }

  startCreateUser() {
    this.editingUser = null;
    this.newUserMode = true;
    this.userForm = { username: '', email: '', password: '' };
  }

  cancelUserEdit() {
    this.editingUser = null;
    this.newUserMode = false;
    this.userForm = {};
  }

  saveUser() {
    if (this.newUserMode) {
      // create
      this.adminService.createUser(this.userForm as any).subscribe(res => {
        if (res) {
          alert('สร้างผู้ใช้สำเร็จ');
          this.loadUsers();
          this.cancelUserEdit();
        } else alert('สร้างผู้ใช้ไม่สำเร็จ');
      });
    } else if (this.editingUser) {
      const id = this.getUserId(this.editingUser);
      if (!id) return alert('ไม่สามารถอัปเดตผู้ใช้: ไม่พบ id ของผู้ใช้');

      // Build a minimal payload: only send fields that were filled in the form.
      const payload: any = {};
      if (this.userForm.username) payload.username = this.userForm.username;
      if (this.userForm.email) payload.email = this.userForm.email;
      // password is optional — include only if provided (admin wants to change password)
      if ((this.userForm as any).password) payload.password = (this.userForm as any).password;

      // Use PATCH so backend does not require full record (username+password) for update
      this.adminService.patchUser(id, payload).subscribe(ok => {
        if (ok) {
          alert('อัปเดตผู้ใช้สำเร็จ');
          this.loadUsers();
          this.cancelUserEdit();
        } else alert('อัปเดตผู้ใช้ไม่สำเร็จ');
      });
    }
  }

  // Courses
  // Courses removed: admin manages users and messages only

  // Stats loading removed (statistics removed from admin UI)

  // Messages
  loadMessages() {
    this.adminService.getMessages().subscribe(list => {
      this.messages = list || [];
    });
  }

  openMessage(m: any) {
    // could fetch detail if needed
    this.selectedMessage = m;
  }

  selectedMessage: any = null;

  sendReply(text: string) {
    if (!this.selectedMessage) return;
    const id = this.selectedMessage.id || this.selectedMessage.message_id || this.selectedMessage.id;
    if (!text) return alert('กรุณาพิมพ์ข้อความตอบกลับ');
    this.adminService.replyMessage(id, { from: this.currentUser?.username || 'admin', message: text }).subscribe(ok => {
      if (ok) {
        alert('ส่งข้อความตอบกลับเรียบร้อย');
        // refresh messages
        this.loadMessages();
      } else alert('ส่งไม่สำเร็จ');
    });
  }
}
