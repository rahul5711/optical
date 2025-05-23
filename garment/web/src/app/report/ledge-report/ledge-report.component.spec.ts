import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LedgeReportComponent } from './ledge-report.component';

describe('LedgeReportComponent', () => {
  let component: LedgeReportComponent;
  let fixture: ComponentFixture<LedgeReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LedgeReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LedgeReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
