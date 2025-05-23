import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LensGridViewComponent } from './lens-grid-view.component';

describe('LensGridViewComponent', () => {
  let component: LensGridViewComponent;
  let fixture: ComponentFixture<LensGridViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LensGridViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LensGridViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
