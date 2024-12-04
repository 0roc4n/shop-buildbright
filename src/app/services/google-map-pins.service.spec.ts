import { TestBed } from '@angular/core/testing';

import { GoogleMapPinsService } from './google-map-pins.service';

describe('GoogleMapPinsService', () => {
  let service: GoogleMapPinsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleMapPinsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
