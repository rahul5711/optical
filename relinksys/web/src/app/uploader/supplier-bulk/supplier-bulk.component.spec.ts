import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierBulkComponent } from './supplier-bulk.component';

describe('SupplierBulkComponent', () => {
  let component: SupplierBulkComponent;
  let fixture: ComponentFixture<SupplierBulkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SupplierBulkComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SupplierBulkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
