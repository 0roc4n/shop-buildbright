import { TestBed } from '@angular/core/testing';

import { DataqueriesService } from './dataqueries.service';

describe('DataqueriesService', () => {
  let service: DataqueriesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataqueriesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
