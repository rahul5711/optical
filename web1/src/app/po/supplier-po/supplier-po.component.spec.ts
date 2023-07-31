import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierPoComponent } from './supplier-po.component';

describe('SupplierPoComponent', () => {
  let component: SupplierPoComponent;
  let fixture: ComponentFixture<SupplierPoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SupplierPoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SupplierPoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
