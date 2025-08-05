import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptometristComponent } from './optometrist.component';

describe('OptometristComponent', () => {
  let component: OptometristComponent;
  let fixture: ComponentFixture<OptometristComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OptometristComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OptometristComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
