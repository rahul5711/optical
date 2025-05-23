import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommissionDetailComponent } from './commission-detail.component';

describe('CommissionDetailComponent', () => {
  let component: CommissionDetailComponent;
  let fixture: ComponentFixture<CommissionDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommissionDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommissionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
