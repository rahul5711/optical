import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyOptionHideComponent } from './company-option-hide.component';

describe('CompanyOptionHideComponent', () => {
  let component: CompanyOptionHideComponent;
  let fixture: ComponentFixture<CompanyOptionHideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompanyOptionHideComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompanyOptionHideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
