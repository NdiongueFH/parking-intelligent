import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParkingUtilisateurComponent } from './parking-utilisateur.component';

describe('ParkingUtilisateurComponent', () => {
  let component: ParkingUtilisateurComponent;
  let fixture: ComponentFixture<ParkingUtilisateurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParkingUtilisateurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParkingUtilisateurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
