import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OldBillComponent } from './old-bill.component';

describe('OldBillComponent', () => {
  let component: OldBillComponent;
  let fixture: ComponentFixture<OldBillComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OldBillComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OldBillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
