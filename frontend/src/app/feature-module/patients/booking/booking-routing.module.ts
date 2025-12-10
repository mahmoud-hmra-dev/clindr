import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BookingComponent } from './booking.component';

const routes: Routes = [
  {
    path: '',
    component: BookingComponent,
    children: [

    ],
  },
  { path: 'booking-popup', loadChildren: () => import('./booking-popup/booking-popup.module').then(m => m.BookingPopupModule) },
  // BookingSuccessRoutingModule
  { path: 'booking-Success', loadChildren: () => import('./booking-success/booking-success.module').then(m => m.BookingSuccessModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BookingRoutingModule {}
