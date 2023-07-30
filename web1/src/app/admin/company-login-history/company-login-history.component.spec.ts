import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyLoginHistoryComponent } from './company-login-history.component';

describe('CompanyLoginHistoryComponent', () => {
  let component: CompanyLoginHistoryComponent;
  let fixture: ComponentFixture<CompanyLoginHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompanyLoginHistoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompanyLoginHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
