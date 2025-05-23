import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferProductInvoiceComponent } from './transfer-product-invoice.component';

describe('TransferProductInvoiceComponent', () => {
  let component: TransferProductInvoiceComponent;
  let fixture: ComponentFixture<TransferProductInvoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TransferProductInvoiceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TransferProductInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
