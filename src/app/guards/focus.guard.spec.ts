import { TestBed } from '@angular/core/testing';

import { FocusGuard } from './focus.guard';

describe('FocusGuard', () => {
  let guard: FocusGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(FocusGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
