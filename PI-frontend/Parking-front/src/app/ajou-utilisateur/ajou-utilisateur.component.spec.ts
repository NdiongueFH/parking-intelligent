import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjouUtilisateurComponent } from './ajou-utilisateur.component';

describe('AjouUtilisateurComponent', () => {
  let component: AjouUtilisateurComponent;
  let fixture: ComponentFixture<AjouUtilisateurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjouUtilisateurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AjouUtilisateurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
