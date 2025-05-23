import { TestBed } from '@angular/core/testing';

import { AdminSupportService } from './admin-support.service';

describe('AdminSupportService', () => {
  let service: AdminSupportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminSupportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
