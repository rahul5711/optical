import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerRetrunListComponent } from './customer-retrun-list.component';

describe('CustomerRetrunListComponent', () => {
  let component: CustomerRetrunListComponent;
  let fixture: ComponentFixture<CustomerRetrunListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerRetrunListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomerRetrunListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
