import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeactiveListComponent } from './deactive-list.component';

describe('DeactiveListComponent', () => {
  let component: DeactiveListComponent;
  let fixture: ComponentFixture<DeactiveListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeactiveListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeactiveListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
