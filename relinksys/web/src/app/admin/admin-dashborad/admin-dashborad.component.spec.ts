import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDashboradComponent } from './admin-dashborad.component';

describe('AdminDashboradComponent', () => {
  let component: AdminDashboradComponent;
  let fixture: ComponentFixture<AdminDashboradComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminDashboradComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminDashboradComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
