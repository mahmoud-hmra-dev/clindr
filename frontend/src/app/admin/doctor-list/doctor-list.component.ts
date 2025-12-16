import { Component } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { AdminService } from 'src/app/core/services/admin.service';
import {
  PaginationService,
  tablePageSize,
} from 'src/app/shared/custom-pagination/pagination.service';
import { PaginatedResponse, pageSelection } from 'src/app/shared/models/models';
import { routes } from 'src/app/shared/routes/routes';

@Component({
    selector: 'app-doctor-list',
    templateUrl: './doctor-list.component.html',
    styleUrls: ['./doctor-list.component.scss'],
    standalone: false
})
export class DoctorListComponent {
  public routes = routes;
  public tableData: Array<any> = [];
  initChecked = false;
  loading = false;

  // pagination variables
  public pageSize = 10;
  public serialNumberArray: Array<number> = [];
  public totalData = 0;
  showFilter = false;
  dataSource!: MatTableDataSource<any>;
  public searchDataValue = '';
  // pagination variables end

  constructor(
    private adminService: AdminService,
    private pagination: PaginationService,
    private router: Router
  ) {
    this.pagination.tablePageSize.subscribe((res: tablePageSize) => {
      if (this.router.url == this.routes.doctorList) {
        this.getTableData({ skip: res.skip, limit: res.limit });
        this.pageSize = res.pageSize;
      }
    });
  }

  private getTableData(pageOption: pageSelection): void {
    this.loading = true;
    const currentPage = Math.floor(pageOption.skip / this.pageSize) + 1;
    this.adminService
      .getDoctors({ page: currentPage, per_page: this.pageSize })
      .subscribe((apiRes: PaginatedResponse<any>) => {
        const data = apiRes?.data ?? [];
        const meta = (apiRes as any)?.meta;

        this.pageSize = meta?.per_page ?? this.pageSize;
        this.totalData = meta?.total ?? data.length;

        const serialStart = ((meta?.current_page ?? 1) - 1) * this.pageSize;
        this.tableData = data.map((res: any, index: number) => ({
          id: res.id,
          doctorName: res.display_name || res.full_name || `#${res.id}`,
          designation: res.designation || '—',
          city: res.city || '—',
          country: res.country || '',
          defaultFee: res.default_fee ?? '—',
          accepting: res.accepting_new_patients ?? false,
          profileImage: res.profile_image_path || 'assets/admin/img/doctors/default.jpg',
          serial: serialStart + index + 1,
        }));
        this.serialNumberArray = this.tableData.map((row) => row.serial);
        this.dataSource = new MatTableDataSource<any>(this.tableData);
        this.pagination.calculatePageSize.next({
          totalData: this.totalData,
          pageSize: this.pageSize,
          tableData: this.tableData,
          serialNumberArray: this.serialNumberArray,
          tableData2: [],
          tableData3: [],
          tableData4: [],
        });
        this.loading = false;
      });
  }

  public sortData(sort: Sort) {
    const data = this.tableData.slice();

    if (!sort.active || sort.direction === '') {
      this.tableData = data;
    } else {
      this.tableData = data.sort((a, b) => {
        const aValue = (a as never)[sort.active];
        const bValue = (b as never)[sort.active];
        return (aValue < bValue ? -1 : 1) * (sort.direction === 'asc' ? 1 : -1);
      });
    }
  }
  selectAll(initChecked: boolean) {
    if (!initChecked) {
      this.tableData.forEach((f) => {
        f.isSelected = true;
      });
    } else {
      this.tableData.forEach((f) => {
        f.isSelected = false;
      });
    }
  }

  deleteDoctor(id: number): void {
    if (!id) {
      return;
    }
    this.adminService.deleteDoctor(id).subscribe(() => {
      this.tableData = this.tableData.filter((d) => d.id !== id);
      this.totalData = Math.max(0, this.totalData - 1);
      this.dataSource = new MatTableDataSource<any>(this.tableData);
    });
  }
}
