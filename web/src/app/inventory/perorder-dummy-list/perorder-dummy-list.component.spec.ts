import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerorderDummyListComponent } from './perorder-dummy-list.component';

describe('PerorderDummyListComponent', () => {
  let component: PerorderDummyListComponent;
  let fixture: ComponentFixture<PerorderDummyListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PerorderDummyListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PerorderDummyListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
