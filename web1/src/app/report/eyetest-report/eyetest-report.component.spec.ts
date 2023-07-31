import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EyetestReportComponent } from './eyetest-report.component';

describe('EyetestReportComponent', () => {
  let component: EyetestReportComponent;
  let fixture: ComponentFixture<EyetestReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EyetestReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EyetestReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
