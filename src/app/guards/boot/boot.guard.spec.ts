import { TestBed } from '@angular/core/testing';

import { BootGuard } from './boot.guard';

describe('BootGuard', () => {
  let guard: BootGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(BootGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
