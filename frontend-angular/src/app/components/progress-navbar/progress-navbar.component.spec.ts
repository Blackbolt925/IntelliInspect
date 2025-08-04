import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressNavbarComponent } from './progress-navbar.component';

describe('ProgressNavbarComponent', () => {
  let component: ProgressNavbarComponent;
  let fixture: ComponentFixture<ProgressNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProgressNavbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgressNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
