import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonContactsComponent } from './common-contacts.component';

describe('CommonConcatsComponent', () => {
  let component: CommonContactsComponent;
  let fixture: ComponentFixture<CommonContactsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CommonContactsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CommonContactsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
