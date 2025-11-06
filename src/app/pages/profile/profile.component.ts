import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy, AfterViewChecked {
  currentUser: User | null = null;
  memberData: any = null;
  isEditing = false;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  // messages from admin for this user's email
  messages: any[] = [];
  // set of known admin author identifiers (username or email lowercased)
  adminSet: Set<string> = new Set();
  pollingHandle: any = null;
  selectedMessage: any = null;
  replyText = '';
  @ViewChild('chatScroll') chatScroll!: ElementRef<HTMLDivElement>;

  editForm: any = {};
  profileImage: string | null = null; // ✅ รูปโปรไฟล์

  private apiUrl = 'https://itbackend-production.up.railway.app/member';
  private contactApi = 'https://itbackend-production.up.railway.app/contact';
  private baseApi = 'https://itbackend-production.up.railway.app';
  // My trainers removed

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

ngOnInit(): void {
  this.currentUser = this.authService.getCurrentUser();
  if (!this.currentUser) {
    this.router.navigate(['/login']);
    return;
  }

  const accountId = this.currentUser.id; // ✅ ใช้ account_id จาก user ที่ล็อกอินอยู่
  this.loadProfile(accountId);
}

private loadProfile(accountId: number): void {
  this.http.get<any>(`https://itbackend-production.up.railway.app/account/profile/${accountId}`).subscribe({
    next: (res) => {
      this.memberData = res;
      this.resetEditForm();
      // Load messages for this user's email
      if (res?.email) {
        this.loadMessages(res.email);
        // start simple polling for new replies every 30s
        this.startPolling(res.email);
      }
        // no My Trainers behavior (removed)
    },
    error: (err) => {
      console.error('โหลดข้อมูลโปรไฟล์ผิดพลาด:', err);
      this.errorMessage = 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้';
    }
  });
}

  private loadMemberData(memberId: number): void {
    this.http.get(`${this.apiUrl}/${memberId}`).subscribe({
      next: (res: any) => {
        this.memberData = res;
        this.resetEditForm();
      },
      error: (err) => {
        console.error('โหลดข้อมูลสมาชิกผิดพลาด:', err);
        this.errorMessage = 'ไม่สามารถโหลดข้อมูลสมาชิกได้';
      }
    });
  }

  resetEditForm(): void {
    if (this.memberData) {
      this.editForm = {
        fullName: this.memberData.full_name || '',
        email: this.memberData.email || '',
        phone: this.memberData.phone || '',
        dateOfBirth: this.memberData.birthdate
          ? new Date(this.memberData.birthdate).toISOString().split('T')[0]
          : '',
        gender: this.memberData.gender || '',
        age: this.memberData.age || ''
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

  private calcAge(dateString: string): number | null {
    if (!dateString) return null;
    const birth = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  saveProfile(): void {
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const updateData = {
      full_name: this.editForm.fullName,
      email: this.editForm.email,
      phone: this.editForm.phone,
      birthdate: this.editForm.dateOfBirth || null,
      gender: this.editForm.gender,
      age: this.calcAge(this.editForm.dateOfBirth)
    };

    if (!this.memberData?.member_id) {
      this.errorMessage = 'ไม่พบรหัสสมาชิก';
      this.isLoading = false;
      return;
    }

    this.http.patch(`${this.apiUrl}/${this.memberData.member_id}`, updateData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.successMessage = 'บันทึกข้อมูลเรียบร้อยแล้ว';
        this.isEditing = false;
        this.memberData = res;
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (err) => {
        console.error('เกิดข้อผิดพลาดในการบันทึก:', err);
        this.isLoading = false;
        this.errorMessage = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      }
    });
  }

  // ----------------------
  // Messages: load and mark read
  // ----------------------
  loadMessages(email: string): void {
    // First fetch accounts to identify admin users, then fetch messages and keep replies from admins only
    this.http.get<any[]>(`${this.baseApi}/account`).subscribe({
      next: (accounts) => {
  const adminSet = new Set<string>();
        (accounts || []).forEach(a => {
          try {
            if (a && (a.role === 'admin' || a.role === 'ADMIN')) {
              if (a.username) adminSet.add(a.username.toString().toLowerCase());
              if (a.email) adminSet.add(a.email.toString().toLowerCase());
            }
          } catch { }
        });
        // persist adminSet for later conversation filtering
        this.adminSet = adminSet;

        this.http.get<any[]>(`${this.contactApi}?email=${encodeURIComponent(email)}`).subscribe({
          next: (res) => {
            const list = res || [];
            const replies: any[] = [];
            const meName = (this.currentUser?.username || this.currentUser?.email || '').toString().toLowerCase();
            // Collect replies that are authored by admin accounts only
            list.forEach((msg: any) => {
              if (msg.replies && Array.isArray(msg.replies)) {
                msg.replies.forEach((r: any, idx: number) => {
                  const authorRaw = (r.from || '').toString();
                  if (!authorRaw) return;
                  // use helper which checks adminSet and sensible fallbacks (e.g. 'admin' or 'support')
                  if (!this.isAdminAuthor(authorRaw)) return;
                  replies.push({
                    id: r.id || `${msg.id}-${idx}`,
                    parentId: msg.id,
                    parentName: msg.name,
                    parentEmail: msg.email,
                    from: r.from,
                    message: r.message,
                    created_at: r.created_at || r.createdAt
                  });
                });
              }
            });
            // sort by created_at desc
            replies.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            this.messages = replies;
          },
          error: (err) => {
            console.error('ไม่สามารถโหลดข้อความได้', err);
          }
        });
      },
      error: (err) => {
        console.error('ไม่สามารถดึงบัญชีผู้ใช้ได้', err);
  // fallback: fetch messages but filter out current user's replies
        this.http.get<any[]>(`${this.contactApi}?email=${encodeURIComponent(email)}`).subscribe({
          next: (res) => {
            const list = res || [];
            const replies: any[] = [];
            const meName = this.currentUser?.username || this.currentUser?.email || '';
            list.forEach((msg: any) => {
              if (msg.replies && Array.isArray(msg.replies)) {
                msg.replies.forEach((r: any, idx: number) => {
                  const authorRaw = (r.from || '').toString();
                  if (!authorRaw) return;
                  // only include replies that are admin-authored (use same helper fallback)
                  if (!this.isAdminAuthor(authorRaw)) return;
                  replies.push({
                    id: r.id || `${msg.id}-${idx}`,
                    parentId: msg.id,
                    parentName: msg.name,
                    parentEmail: msg.email,
                    from: authorRaw,
                    message: r.message,
                    created_at: r.created_at || r.createdAt
                  });
                });
              }
            });
            replies.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            this.messages = replies;
          },
          error: (err2) => console.error('ไม่สามารถโหลดข้อความได้', err2)
        });
      }
    });
  }

  markAsRead(messageId: string): void {
    this.http.patch(`${this.contactApi}/${messageId}`, { status: 'read' }).subscribe({
      next: () => {
        const m = this.messages.find(x => x.id === messageId);
        if (m) m.status = 'read';
      },
      error: (err) => console.error('ไม่สามารถอัปเดตสถานะข้อความได้', err)
    });
  }

  openConversation(msg: any): void {
    // msg is a flattened admin-reply item with parentId
    const parentId = msg.parentId || msg.id;
    // mark parent as read
    if (parentId) this.markAsRead(parentId);
    // load parent message/thread
    this.http.get<any>(`${this.contactApi}/${parentId}`).subscribe({
      next: (res) => {
        // Filter the thread's replies to include admin replies only
        const allReplies = Array.isArray(res.replies) ? res.replies : [];
        const filtered = allReplies.filter((r: any) => this.isAdminAuthor(r.from));
        // clone the response but replace replies with filtered set
        this.selectedMessage = { ...res, replies: filtered };
        // ensure UI updates
        setTimeout(() => this.scrollChatToBottom(), 50);
      },
      error: (err) => console.error('ไม่สามารถโหลดข้อความแบบละเอียดได้', err)
    });
  }

  // Determine whether an author string (username or email) should be considered an admin
  private isAdminAuthor(author: string | undefined | null): boolean {
    const a = (author || '').toString().toLowerCase().trim();
    if (!a) return false;
    // If we have a populated adminSet from accounts, require membership there
    if (this.adminSet && this.adminSet.size > 0) {
      return this.adminSet.has(a);
    }
    // Fallback: if adminSet missing, treat any author that's not the current user or the member email as "not-user" (i.e., include it)
    const me = (this.currentUser?.username || this.currentUser?.email || '').toString().toLowerCase();
    const memberEmail = (this.memberData?.email || '').toString().toLowerCase();
    return a !== me && a !== memberEmail;
  }

  sendUserReply(): void {
    if (!this.selectedMessage || !this.replyText?.trim()) return;
    const from = this.currentUser?.username || this.currentUser?.email || 'ผู้ใช้';
    const payload = { from, message: this.replyText.trim() };
    this.http.post<any>(`${this.contactApi}/${this.selectedMessage.id}/reply`, payload).subscribe({
      next: () => {
        // refresh thread
        this.replyText = '';
        this.http.get<any>(`${this.contactApi}/${this.selectedMessage.id}`).subscribe({
          next: (res) => {
            this.selectedMessage = res;
            // also refresh message list
            if (this.memberData?.email) this.loadMessages(this.memberData.email);
            setTimeout(() => this.scrollChatToBottom(), 50);
          }
        });
      },
      error: (err) => console.error('ไม่สามารถส่งข้อความตอบกลับได้', err)
    });
  }

  private scrollChatToBottom(): void {
    try {
      if (this.chatScroll && this.chatScroll.nativeElement) {
        const el = this.chatScroll.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    } catch (e) {
      // ignore
    }
  }

  ngAfterViewChecked(): void {
    this.scrollChatToBottom();
  }

  startPolling(email: string): void {
    if (this.pollingHandle) return;
    this.pollingHandle = setInterval(() => this.loadMessages(email), 30000);
  }

  stopPolling(): void {
    if (this.pollingHandle) {
      clearInterval(this.pollingHandle);
      this.pollingHandle = null;
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  goToWorkoutHistory(): void {
    this.router.navigate(['/workout-history']);
  }

  goToBookingHistory(): void {
    this.router.navigate(['/booking-history']);
  }

  goToRegistrationHistory(): void {
    this.router.navigate(['/registration-history']);
  }
  // My Trainers support removed

  formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'ไม่ระบุ';
    try {
      return new Date(date).toLocaleDateString('th-TH');
    } catch {
      return 'ไม่ถูกต้อง';
    }
  }

  getGenderDisplay(gender: string | undefined): string {
    switch (gender?.toLowerCase()) {
      case 'male': return 'ชาย';
      case 'female': return 'หญิง';
      case 'other': return 'อื่นๆ';
      default: return 'ไม่ระบุ';
    }
  }
}
