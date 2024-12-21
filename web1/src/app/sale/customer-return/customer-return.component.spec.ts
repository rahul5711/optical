import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerReturnComponent } from './customer-return.component';

describe('CustomerReturnComponent', () => {
  let component: CustomerReturnComponent;
  let fixture: ComponentFixture<CustomerReturnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerReturnComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomerReturnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
