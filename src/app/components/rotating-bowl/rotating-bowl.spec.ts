import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RotatingBowl } from './rotating-bowl';

describe('RotatingBowl', () => {
  let component: RotatingBowl;
  let fixture: ComponentFixture<RotatingBowl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RotatingBowl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RotatingBowl);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
