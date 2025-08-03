import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateRangesComponent } from './date-ranges.component';

describe('DateRangesComponent', () => {
  let component: DateRangesComponent;
  let fixture: ComponentFixture<DateRangesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DateRangesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DateRangesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
