import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OtherNumberTooltipComponent } from './other-number-tooltip.component';

describe('OtherNumberTooltipComponent', () => {
  let component: OtherNumberTooltipComponent;
  let fixture: ComponentFixture<OtherNumberTooltipComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OtherNumberTooltipComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OtherNumberTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
