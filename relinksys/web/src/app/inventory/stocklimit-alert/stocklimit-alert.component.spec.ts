import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StocklimitAlertComponent } from './stocklimit-alert.component';

describe('StocklimitAlertComponent', () => {
  let component: StocklimitAlertComponent;
  let fixture: ComponentFixture<StocklimitAlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StocklimitAlertComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StocklimitAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
