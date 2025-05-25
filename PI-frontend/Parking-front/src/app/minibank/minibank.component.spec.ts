import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MinibankComponent } from './minibank.component';

describe('MinibankComponent', () => {
  let component: MinibankComponent;
  let fixture: ComponentFixture<MinibankComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MinibankComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MinibankComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
