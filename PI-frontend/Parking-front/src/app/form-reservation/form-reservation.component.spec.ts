import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParkingReservationComponent } from './form-reservation.component';

describe('FormReservationComponent', () => {
  let component: ParkingReservationComponent;
  let fixture: ComponentFixture<ParkingReservationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParkingReservationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParkingReservationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
