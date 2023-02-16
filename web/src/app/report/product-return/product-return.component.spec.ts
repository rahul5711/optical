import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductReturnComponent } from './product-return.component';

describe('ProductReturnComponent', () => {
  let component: ProductReturnComponent;
  let fixture: ComponentFixture<ProductReturnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductReturnComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductReturnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
