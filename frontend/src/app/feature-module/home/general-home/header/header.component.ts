import { Component, HostListener, Renderer2, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/shared/common/common.service';
import { DataService } from 'src/app/shared/data/data.service';
import { header } from 'src/app/shared/models/sidebar-model';
import { routes } from 'src/app/shared/routes/routes';
import { SidebarService } from 'src/app/shared/sidebar/sidebar.service';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
public searchField  = false;
  public routes = routes;
  public header: header[];
  base = '';
  page = '';
  last = '';
  isFixed = false;
  isSearch=false;
  isdark=true;
  islight=false;
  isMenuOpened=false;
  themeColor = 'light-mode';
  userName = '';
  userRole = '';
  isLoggedIn = false;
  constructor(
    private common: CommonService,
    private data: DataService,
    public sidebar: SidebarService,
    private router: Router,
    private renderer: Renderer2,
    private authService: AuthService
  ) {
    this.common.base.subscribe((res: string) => {
      this.base = res;
    });
    this.common.page.subscribe((res: string) => {
      this.page = res;
    });
    this.common.last.subscribe((res: string) => {
      this.last = res;
    });
    this.header = this.data.header;
    this.sidebar.themeColor.subscribe((res: string) => {
      this.themeColor = res;
    });
  }
  
  public toggleSidebar(): void {
    this.sidebar.openSidebar();
    this.isMenuOpened=true;
  }
  public hideSidebar(): void {
    this.sidebar.closeSidebar();
    this.isMenuOpened=false;
  }
  closeOverlay() :void{
    this.sidebar.closeSidebar();
    this.isMenuOpened=false;
  }
  toggleSearch(){
    this.searchField = !this.searchField
  }
  public navigation() {
    this.router.navigate([routes.search1]);
  }
  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Add a fixed class when the scroll position is greater than 50px
    this.isFixed = window.pageYOffset > 50;
  }
  openSearch():void{
    this.isSearch=!this.isSearch;
  }
  ngOnInit(): void {
    const themeColor = localStorage.getItem('themeColor') || 'light-mode';
    this.sidebar.changeThemeColor(themeColor);
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
  darkMode():void{
    this.isdark=!this.isdark;
    this.islight=!this.islight;
  }
  navigate():void{
    this.router.navigate([routes.search1]);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate([routes.userLogin]),
      error: () => this.router.navigate([routes.userLogin]),
    });
  }
}
