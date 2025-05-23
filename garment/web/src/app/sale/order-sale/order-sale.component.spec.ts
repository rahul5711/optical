import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderSaleComponent } from './order-sale.component';

describe('OrderSaleComponent', () => {
  let component: OrderSaleComponent;
  let fixture: ComponentFixture<OrderSaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrderSaleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderSaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
