import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerPowerListComponent } from './customer-power-list.component';

describe('CustomerPowerListComponent', () => {
  let component: CustomerPowerListComponent;
  let fixture: ComponentFixture<CustomerPowerListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerPowerListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomerPowerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
