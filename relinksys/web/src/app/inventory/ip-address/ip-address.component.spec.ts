import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IpAddressComponent } from './ip-address.component';

describe('IpAddressComponent', () => {
  let component: IpAddressComponent;
  let fixture: ComponentFixture<IpAddressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IpAddressComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IpAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
