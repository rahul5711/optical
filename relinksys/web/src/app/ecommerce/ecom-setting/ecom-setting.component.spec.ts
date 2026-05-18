import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EcomSettingComponent } from './ecom-setting.component';

describe('EcomSettingComponent', () => {
  let component: EcomSettingComponent;
  let fixture: ComponentFixture<EcomSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EcomSettingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EcomSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
