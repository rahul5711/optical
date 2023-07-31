import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FitterInvoiceDetailComponent } from './fitter-invoice-detail.component';

describe('FitterInvoiceDetailComponent', () => {
  let component: FitterInvoiceDetailComponent;
  let fixture: ComponentFixture<FitterInvoiceDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FitterInvoiceDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FitterInvoiceDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
