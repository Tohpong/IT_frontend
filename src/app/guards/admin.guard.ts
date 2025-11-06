import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.authService.isAdmin().pipe(
      map(isAdmin => {
        if (isAdmin) return true;
        alert('ต้องเป็นผู้ดูแลระบบเพื่อเข้าใช้งานหน้านี้');
        this.router.navigate(['/home']);
        return false;
      }),
      catchError(err => {
        console.error('AdminGuard error', err);
        alert('ไม่สามารถตรวจสอบสิทธิ์ผู้ใช้');
        this.router.navigate(['/home']);
        return of(false);
      })
    );
  }
}
