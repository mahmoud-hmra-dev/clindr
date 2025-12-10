import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { routes } from 'src/app/shared/routes/routes';
import { SidebarService } from 'src/app/shared/sidebar/sidebar.service';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    standalone: false
})
export class HeaderComponent implements OnInit {
  public routes = routes;
  public miniSidebar = false;
  userName = '';
  userRole = '';
  isLoggedIn = false;
  
  constructor(public router: Router,private sidebar: SidebarService, private authService: AuthService) {
    this.sidebar.toggleSideBar.subscribe((res: string) => {
      if (res == 'true') {
        this.miniSidebar = true;
      } else {
        this.miniSidebar = false;
      }
    });
  }
  
  public miniSideBarMouseHover(position: string): void {
    if (position == 'over') {
      this.sidebar.expandSideBar.next(true);
    } else {
      this.sidebar.expandSideBar.next(false);
    }
  }
  public toggleAdminSideBar(): void {
    this.sidebar.switchAdminSideMenuPosition();
  }
  public toggleAdminMobileSideBar(): void {
    this.sidebar.switchAdminMobileSideBarPosition();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate([routes.adminLogin]),
      error: () => this.router.navigate([routes.adminLogin]),
    });
  }

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe((user) => {
      this.userName = user?.name || '';
      this.userRole = user?.roles?.[0] || '';
      this.isLoggedIn = !!user;
    });
    if (this.authService.getToken()) {
      this.authService.me().subscribe();
      this.isLoggedIn = true;
    }
  }
}
