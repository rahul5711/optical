import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RewardReportComponent } from './reward-report.component';

describe('RewardReportComponent', () => {
  let component: RewardReportComponent;
  let fixture: ComponentFixture<RewardReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RewardReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RewardReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
