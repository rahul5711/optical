import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferProductReportComponent } from './transfer-product-report.component';

describe('TransferProductReportComponent', () => {
  let component: TransferProductReportComponent;
  let fixture: ComponentFixture<TransferProductReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TransferProductReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TransferProductReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
