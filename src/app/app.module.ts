import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule, MatRadioModule, MatExpansionModule, MatInputModule, MatCheckboxModule, MatListModule, MatTooltipModule, MatDialogModule } from '@angular/material'
import { FormsModule } from '@angular/forms'
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { AngularDraggableModule } from 'angular2-draggable';
import { AgGridModule } from '@ag-grid-community/angular';

import { AppComponent } from './app.component';
import { MenuComponent } from './menu/menu.component';
import { GridComponent } from './grid/grid.component';
import { OtherNumberFilterComponent } from './other-number-filter/other-number-filter.component'
import { CommonContactsComponent } from './common-contacts/common-contacts.component'
import { MapComponent } from './map/map.component'
import { HelpComponent } from './help/help.component';
import { OtherNumberTooltipComponent } from './other-number-tooltip/other-number-tooltip.component';
import { LocationDialogComponent } from './location-dialog/location-dialog.component';

const appRoutes: Routes = [
  { path: '', component: MapComponent },
  { path: 'help', component: HelpComponent },
]
@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    GridComponent,
    OtherNumberFilterComponent,
    CommonContactsComponent,
    MapComponent,
    HelpComponent,
    OtherNumberTooltipComponent,
    LocationDialogComponent
  ],
  imports: [
    BrowserModule,
    AngularDraggableModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatRadioModule,
    MatExpansionModule,
    MatInputModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatListModule,
    MatDialogModule,
    FormsModule,
    RouterModule.forRoot(appRoutes),
    AgGridModule.withComponents([OtherNumberFilterComponent,OtherNumberTooltipComponent]),
  ],
  providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy }],
  bootstrap: [AppComponent],
  entryComponents: [CommonContactsComponent,LocationDialogComponent]
})
export class AppModule { }
