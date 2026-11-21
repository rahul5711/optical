import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseImgComponent } from './purchase-img.component';

describe('PurchaseImgComponent', () => {
  let component: PurchaseImgComponent;
  let fixture: ComponentFixture<PurchaseImgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PurchaseImgComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PurchaseImgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
