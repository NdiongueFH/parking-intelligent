import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonCompteUtilisateurComponent } from './mon-compte-utilisateur.component';

describe('MonCompteUtilisateurComponent', () => {
  let component: MonCompteUtilisateurComponent;
  let fixture: ComponentFixture<MonCompteUtilisateurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonCompteUtilisateurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonCompteUtilisateurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
