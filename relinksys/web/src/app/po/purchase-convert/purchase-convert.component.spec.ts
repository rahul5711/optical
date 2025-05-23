import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseConvertComponent } from './purchase-convert.component';

describe('PurchaseConvertComponent', () => {
  let component: PurchaseConvertComponent;
  let fixture: ComponentFixture<PurchaseConvertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PurchaseConvertComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PurchaseConvertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
