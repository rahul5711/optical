import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhysicalListComponent } from './physical-list.component';

describe('PhysicalListComponent', () => {
  let component: PhysicalListComponent;
  let fixture: ComponentFixture<PhysicalListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PhysicalListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PhysicalListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
