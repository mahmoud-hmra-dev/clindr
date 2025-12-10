import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SearchDoctorComponent } from './search-doctor.component';

const routes: Routes = [
  {
    path: '',
    component: SearchDoctorComponent,
    children: [
      {
        path: 'search',
        loadChildren: () =>
          import('./search2/search2.module').then((m) => m.Search2Module),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SearchDoctorRoutingModule {}
