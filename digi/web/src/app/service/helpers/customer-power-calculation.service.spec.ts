import { TestBed } from '@angular/core/testing';

import { CustomerPowerCalculationService } from './customer-power-calculation.service';

describe('CustomerPowerCalculationService', () => {
  let service: CustomerPowerCalculationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomerPowerCalculationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
