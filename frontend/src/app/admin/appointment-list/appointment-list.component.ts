import { Component } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { AdminService } from 'src/app/core/services/admin.service';
import { PaginationService, tablePageSize } from 'src/app/shared/custom-pagination/pagination.service';
import { PaginatedResponse, pageSelection } from 'src/app/shared/models/models';
import { routes } from 'src/app/shared/routes/routes';

type AppointmentRow = {
  id: number;
  doctorName: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  amount: string;
  isSelected: boolean;
};
@Component({
    selector: 'app-appointment-list',
    templateUrl: './appointment-list.component.html',
    styleUrls: ['./appointment-list.component.scss'],
    standalone: false
})
export class AppointmentListComponent {
  public routes = routes;
  initChecked = false;

  public tableData: Array<AppointmentRow> = [];
  // pagination variables
  public pageSize = 10;
  public serialNumberArray: Array<number> = [];
  public totalData = 0;
  showFilter = false;
  dataSource!: MatTableDataSource<AppointmentRow>;
  public searchDataValue = '';
  // pagination variables end

  constructor(
    private adminService: AdminService,
    private pagination: PaginationService,
    private router: Router
  ) {
    this.pagination.tablePageSize.subscribe((res: tablePageSize) => {
      if (this.router.url == this.routes.appointmentList) {
        this.getTableData({ skip: res.skip, limit: res.limit });
        this.pageSize = res.pageSize;
      }
    });
  }

  private getTableData(pageOption: pageSelection): void {
    const currentPage = Math.floor(pageOption.skip / this.pageSize) + 1;

    this.adminService
      .getAppointments({ page: currentPage, per_page: this.pageSize })
      .subscribe((apiRes: PaginatedResponse<any>) => {
        const data = apiRes?.data ?? [];
        const meta = (apiRes as any)?.meta;

        this.pageSize = meta?.per_page ?? this.pageSize;
        this.totalData = meta?.total ?? data.length;

        const serialStart = ((meta?.current_page ?? 1) - 1) * this.pageSize;
        this.tableData = data.map((res: any, index: number) => {
          const scheduledAt = res.scheduled_at ? new Date(res.scheduled_at) : null;
          return {
            id: res.id,
            doctorName: res.doctor?.display_name || res.doctor?.full_name || `#${res.doctor_id}`,
            patientName: res.patient?.full_name || `#${res.patient_id}`,
            appointmentDate: scheduledAt ? scheduledAt.toLocaleDateString() : '--',
            appointmentTime: scheduledAt
              ? scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '--',
            status: res.status ?? 'pending',
            amount: res.invoice?.amount
              ? `${res.invoice.amount} ${res.invoice.currency || ''}`.trim()
              : '--',
            isSelected: false,
          };
        });
        this.serialNumberArray = this.tableData.map(
          (_: AppointmentRow, idx: number) => serialStart + idx + 1
        );
        this.dataSource = new MatTableDataSource<AppointmentRow>(this.tableData);
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

  selectAll(initChecked: boolean) {
    this.tableData.forEach((f) => {
      f.isSelected = !initChecked;
    });
  }

  deleteAppointment(id: number): void {
    if (!id) {
      return;
    }
    this.adminService.deleteAppointment(id).subscribe(() => {
      this.tableData = this.tableData.filter((row) => row.id !== id);
      this.dataSource = new MatTableDataSource<AppointmentRow>(this.tableData);
      this.totalData = Math.max(0, this.totalData - 1);
    });
  }
}
