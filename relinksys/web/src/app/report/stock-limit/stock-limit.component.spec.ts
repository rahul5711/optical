import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockLimitComponent } from './stock-limit.component';

describe('StockLimitComponent', () => {
  let component: StockLimitComponent;
  let fixture: ComponentFixture<StockLimitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StockLimitComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StockLimitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
