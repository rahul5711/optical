import { TestBed } from '@angular/core/testing';

import { MembershipcardService } from './membershipcard.service';

describe('MembershipcardService', () => {
  let service: MembershipcardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MembershipcardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
