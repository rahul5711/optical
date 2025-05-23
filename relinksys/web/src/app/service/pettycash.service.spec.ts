import { TestBed } from '@angular/core/testing';

import { PettycashService } from './pettycash.service';

describe('PettycashService', () => {
  let service: PettycashService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PettycashService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
