import { TestBed } from '@angular/core/testing';

import { OtpPinService } from './otp-pin.service';

describe('OtpPinService', () => {
  let service: OtpPinService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OtpPinService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
