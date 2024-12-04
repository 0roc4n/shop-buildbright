import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BootPage } from './boot.page';

describe('BootPage', () => {
  let component: BootPage;
  let fixture: ComponentFixture<BootPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(BootPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
