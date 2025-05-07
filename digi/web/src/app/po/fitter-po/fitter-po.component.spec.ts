import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FitterPoComponent } from './fitter-po.component';

describe('FitterPoComponent', () => {
  let component: FitterPoComponent;
  let fixture: ComponentFixture<FitterPoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FitterPoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FitterPoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
