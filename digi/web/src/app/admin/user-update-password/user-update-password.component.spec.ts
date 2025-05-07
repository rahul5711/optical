import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserUpdatePasswordComponent } from './user-update-password.component';

describe('UserUpdatePasswordComponent', () => {
  let component: UserUpdatePasswordComponent;
  let fixture: ComponentFixture<UserUpdatePasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserUpdatePasswordComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserUpdatePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
