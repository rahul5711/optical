import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PettycashReportComponent } from './pettycash-report.component';

describe('PettycashReportComponent', () => {
  let component: PettycashReportComponent;
  let fixture: ComponentFixture<PettycashReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PettycashReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PettycashReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
