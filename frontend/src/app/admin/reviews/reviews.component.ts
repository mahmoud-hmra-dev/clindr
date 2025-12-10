import { Component } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { PaginationService, tablePageSize } from 'src/app/shared/custom-pagination/pagination.service';
import { routes } from 'src/app/shared/routes/routes';
import { AdminService } from 'src/app/core/services/admin.service';

@Component({
    selector: 'app-reviews',
    templateUrl: './reviews.component.html',
    styleUrls: ['./reviews.component.scss'],
    standalone: false
})
export class ReviewsComponent {
  public routes = routes;
  public tableData: Array<any> = [];

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
      if (this.router.url == this.routes.reviews) {
        this.getTableData({ skip: res.skip, limit: res.limit });
        this.pageSize = res.pageSize;
      }
    });
  }

  private getTableData(pageOption: any): void {
    this.adminService.getReviews().subscribe({
      next: (apiRes) => {
        const data = apiRes?.data ?? [];
        this.tableData = [];
        this.serialNumberArray = [];
        this.totalData = apiRes?.meta?.total ?? data.length;
        data.map((res: any, index: number) => {
          const serialNumber = index + 1;
          if (index >= pageOption.skip && serialNumber <= pageOption.limit) {
            const row = {
              id: serialNumber,
              doctorName: res.doctor_name || res.doctor_id,
              patientName: res.patient_name || res.patient_id,
              rating: res.rating,
              comment: res.comment,
              created_at: res.created_at
            };
            this.tableData.push(row);
            this.serialNumberArray.push(serialNumber);
          }
        });
        this.dataSource = new MatTableDataSource<any>(this.tableData);
        this.pagination.calculatePageSize.next({
          totalData: this.totalData,
          pageSize: this.pageSize,
          tableData: this.tableData,
          serialNumberArray: this.serialNumberArray,
          tableData2: [],
          tableData3: [],
          tableData4: []
        });
      }
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
}
