import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductTransferComponent } from './product-transfer.component';

describe('ProductTransferComponent', () => {
  let component: ProductTransferComponent;
  let fixture: ComponentFixture<ProductTransferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductTransferComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductTransferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
