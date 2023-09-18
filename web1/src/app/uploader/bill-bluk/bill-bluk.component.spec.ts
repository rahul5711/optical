import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillBlukComponent } from './bill-bluk.component';

describe('BillBlukComponent', () => {
  let component: BillBlukComponent;
  let fixture: ComponentFixture<BillBlukComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BillBlukComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BillBlukComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
