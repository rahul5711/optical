import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductSummaryReportComponent } from './product-summary-report.component';

describe('ProductSummaryReportComponent', () => {
  let component: ProductSummaryReportComponent;
  let fixture: ComponentFixture<ProductSummaryReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductSummaryReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductSummaryReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
