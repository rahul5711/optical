import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FitterInvoiceListComponent } from './fitter-invoice-list.component';

describe('FitterInvoiceListComponent', () => {
  let component: FitterInvoiceListComponent;
  let fixture: ComponentFixture<FitterInvoiceListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FitterInvoiceListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FitterInvoiceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
