import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FitterInvoiceComponent } from './fitter-invoice.component';

describe('FitterInvoiceComponent', () => {
  let component: FitterInvoiceComponent;
  let fixture: ComponentFixture<FitterInvoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FitterInvoiceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FitterInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
