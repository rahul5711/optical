import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreorderListComponent } from './preorder-list.component';

describe('PreorderListComponent', () => {
  let component: PreorderListComponent;
  let fixture: ComponentFixture<PreorderListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PreorderListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PreorderListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
