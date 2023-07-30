import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FitterListComponent } from './fitter-list.component';

describe('FitterListComponent', () => {
  let component: FitterListComponent;
  let fixture: ComponentFixture<FitterListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FitterListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FitterListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
