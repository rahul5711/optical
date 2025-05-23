import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseBlukComponent } from './purchase-bluk.component';

describe('PurchaseBlukComponent', () => {
  let component: PurchaseBlukComponent;
  let fixture: ComponentFixture<PurchaseBlukComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PurchaseBlukComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PurchaseBlukComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
