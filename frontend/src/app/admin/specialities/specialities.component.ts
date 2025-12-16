import { Component } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { AdminService } from 'src/app/core/services/admin.service';
import {
  PaginationService,
  tablePageSize,
} from 'src/app/shared/custom-pagination/pagination.service';
import { pageSelection } from 'src/app/shared/models/models';
import { routes } from 'src/app/shared/routes/routes';

@Component({
    selector: 'app-specialities',
    templateUrl: './specialities.component.html',
    styleUrls: ['./specialities.component.scss'],
    standalone: false
})
export class SpecialitiesComponent {
  public routes = routes;
  public tableData: Array<any> = [];
  newSpecialtyName = '';
  newSpecialtyDescription = '';
  editSpecialty: any = null;

  // pagination variables
  public pageSize = 10;
  public serialNumberArray: Array<number> = [];
  public totalData = 0;
  showFilter = false;
  dataSource!: MatTableDataSource<specialities>;
  public searchDataValue = '';
  // pagination variables end

  constructor(
    private adminService: AdminService,
    private pagination: PaginationService,
    private router: Router
  ) {
    this.pagination.tablePageSize.subscribe((res: tablePageSize) => {
      if (this.router.url == this.routes.specialities) {
        this.getTableData({ skip: res.skip, limit: res.limit });
        this.pageSize = res.pageSize;
      }
    });
  }

  private getTableData(pageOption: pageSelection): void {
    this.adminService.getSpecialties().subscribe((apiRes: any) => {
      const data = apiRes?.data ?? apiRes ?? [];
      this.totalData = data.length;
      this.tableData = data.map((res: any, index: number) => ({
        id: res.id ?? index + 1,
        name: res.name,
        description: res.description,
      }));
      this.serialNumberArray = this.tableData.map((_, idx) => idx + 1);
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

  submitSpecialty(): void {
    if (!this.newSpecialtyName.trim()) {
      return;
    }
    this.adminService
      .createSpecialty({
        name: this.newSpecialtyName.trim(),
        description: this.newSpecialtyDescription || null,
      })
      .subscribe((res: any) => {
        const specialty = res?.data ?? res;
        this.tableData = [...this.tableData, specialty];
        this.dataSource = new MatTableDataSource<any>(this.tableData);
        this.totalData = this.tableData.length;
        this.newSpecialtyName = '';
        this.newSpecialtyDescription = '';
      });
  }

  startEdit(specialty: any): void {
    this.editSpecialty = { ...specialty };
  }

  submitEdit(): void {
    if (!this.editSpecialty?.id) {
      return;
    }
    this.adminService
      .updateSpecialty(this.editSpecialty.id, {
        name: this.editSpecialty.name,
        description: this.editSpecialty.description,
      })
      .subscribe((res: any) => {
        const updated = res?.data ?? res;
        this.tableData = this.tableData.map((item) =>
          item.id === updated.id ? updated : item
        );
        this.dataSource = new MatTableDataSource<any>(this.tableData);
        this.editSpecialty = null;
      });
  }

  deleteSpecialty(id: number): void {
    this.adminService.deleteSpecialty(id).subscribe(() => {
      this.tableData = this.tableData.filter((item) => item.id !== id);
      this.dataSource = new MatTableDataSource<any>(this.tableData);
      this.totalData = this.tableData.length;
    });
  }
}
