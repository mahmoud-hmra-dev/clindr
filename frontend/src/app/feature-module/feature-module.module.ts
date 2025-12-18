import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FeatureModuleRoutingModule } from './feature-module-routing.module';
import { FeatureModuleComponent } from './feature-module.component';
import { FeatureCommonComponentsModule } from './common/common-components.module';



@NgModule({
  declarations: [
    FeatureModuleComponent,
  ],
  imports: [
    CommonModule,
    FeatureModuleRoutingModule,
    FeatureCommonComponentsModule
  ]
})
export class FeatureModuleModule { }
