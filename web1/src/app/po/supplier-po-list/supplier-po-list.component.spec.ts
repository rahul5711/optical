import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierPoListComponent } from './supplier-po-list.component';

describe('SupplierPoListComponent', () => {
  let component: SupplierPoListComponent;
  let fixture: ComponentFixture<SupplierPoListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SupplierPoListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SupplierPoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
