import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  currentUser: any = null;
  showProfileDropdown: boolean = false;
  private authSubscription: Subscription = new Subscription();

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit(): void {
    // Subscribe to auth state changes
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
  }

  // Demo helper removed — rely on backend authentication and role

  checkLoginStatus(): void {
    // สำหรับตัวอย่าง - ในการใช้งานจริงควรเช็คจาก service หรือ localStorage
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      this.isLoggedIn = true;
      this.currentUser = JSON.parse(userData);
    }
  }

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }


  goToProfile(): void {
    this.router.navigate(['/profile']);
    this.showProfileDropdown = false;
  }

  logout(): void {
    this.authService.logout();
    this.showProfileDropdown = false;
    this.router.navigate(['/home']);
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    const navbar = document.querySelector('.top-nav');
    if (window.pageYOffset > 50) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-dropdown')) {
      this.showProfileDropdown = false;
    }
  }

}
