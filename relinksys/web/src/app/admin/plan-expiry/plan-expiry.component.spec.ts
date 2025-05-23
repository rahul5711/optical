import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanExpiryComponent } from './plan-expiry.component';

describe('PlanExpiryComponent', () => {
  let component: PlanExpiryComponent;
  let fixture: ComponentFixture<PlanExpiryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlanExpiryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlanExpiryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
