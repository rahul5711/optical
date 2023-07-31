import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FitterComponent } from './fitter.component';

describe('FitterComponent', () => {
  let component: FitterComponent;
  let fixture: ComponentFixture<FitterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FitterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FitterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
