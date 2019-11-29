import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OtherNumberFilterComponent } from './other-number-filter.component';

describe('OtherNumberFilterComponent', () => {
  let component: OtherNumberFilterComponent;
  let fixture: ComponentFixture<OtherNumberFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OtherNumberFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OtherNumberFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
