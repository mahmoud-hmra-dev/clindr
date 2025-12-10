import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/shared/common/common.service';
import { routes } from 'src/app/shared/routes/routes';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
    selector: 'app-doctor-sidebar',
    templateUrl: './doctor-sidebar.component.html',
    styleUrl: './doctor-sidebar.component.scss',
    standalone: false
})
export class DoctorSidebarComponent implements OnInit {
  public routes = routes;
  public base = '';
  public page = '';
  public last = '';
  public doctorName = '';
  public doctorDesignation = '';
  public doctorRole = '';

  constructor(private common: CommonService, private router: Router, private authService: AuthService) {
    this.common.base.subscribe((res: string) => {
      this.base = res;
    });
    this.common.page.subscribe((res: string) => {
      this.page = res;
    });
    this.common.last.subscribe((res: string) => {
      this.last = res;
    });
    console.log('base', this.base);
    console.log('page', this.page);
    console.log('last', this.last);
  }

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe((user:any) => {
      if (user) {
        this.doctorName = user.user?.name || `${user.id}`;
        this.doctorRole = Array.isArray(user.roles) && user.roles.length ? user.roles[0] || '' : 'doctor';
      }
    });
    this.authService.me().subscribe({
      next: (user) => {
        this.doctorName = user.name || this.doctorName;
        this.doctorDesignation = (user as any).designation || this.doctorDesignation;
        this.doctorRole = Array.isArray((user as any).roles) && (user as any).roles.length
          ? (user as any).roles[0] || ''
          : this.doctorRole || 'doctor';
      },
      error: () => {},
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate([routes.userLogin]),
      error: () => this.router.navigate([routes.userLogin]),
    });
  }
}
