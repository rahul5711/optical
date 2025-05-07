import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchBarcodeComponent } from './search-barcode.component';

describe('SearchBarcodeComponent', () => {
  let component: SearchBarcodeComponent;
  let fixture: ComponentFixture<SearchBarcodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SearchBarcodeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchBarcodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
