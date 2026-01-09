import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReminderReportComponent } from './reminder-report.component';

describe('ReminderReportComponent', () => {
  let component: ReminderReportComponent;
  let fixture: ComponentFixture<ReminderReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReminderReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReminderReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
