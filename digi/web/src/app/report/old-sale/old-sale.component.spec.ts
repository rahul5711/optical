import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OldSaleComponent } from './old-sale.component';

describe('OldSaleComponent', () => {
  let component: OldSaleComponent;
  let fixture: ComponentFixture<OldSaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OldSaleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OldSaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
