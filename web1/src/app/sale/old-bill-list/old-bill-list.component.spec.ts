import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OldBillListComponent } from './old-bill-list.component';

describe('OldBillListComponent', () => {
  let component: OldBillListComponent;
  let fixture: ComponentFixture<OldBillListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OldBillListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OldBillListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
