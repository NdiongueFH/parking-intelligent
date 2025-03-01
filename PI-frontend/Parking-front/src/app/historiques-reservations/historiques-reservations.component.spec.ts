import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoriquesReservationsComponent } from './historiques-reservations.component';

describe('HistoriquesReservationsComponent', () => {
  let component: HistoriquesReservationsComponent;
  let fixture: ComponentFixture<HistoriquesReservationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoriquesReservationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoriquesReservationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
