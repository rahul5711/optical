import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerBlukComponent } from './customer-bluk.component';

describe('CustomerBlukComponent', () => {
  let component: CustomerBlukComponent;
  let fixture: ComponentFixture<CustomerBlukComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerBlukComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomerBlukComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
