import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LensGridListComponent } from './lens-grid-list.component';

describe('LensGridListComponent', () => {
  let component: LensGridListComponent;
  let fixture: ComponentFixture<LensGridListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LensGridListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LensGridListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
