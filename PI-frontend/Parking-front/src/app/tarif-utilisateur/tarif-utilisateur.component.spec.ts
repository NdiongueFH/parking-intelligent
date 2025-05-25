import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarifUtilisateurComponent } from './tarif-utilisateur.component';

describe('TarifUtilisateurComponent', () => {
  let component: TarifUtilisateurComponent;
  let fixture: ComponentFixture<TarifUtilisateurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarifUtilisateurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TarifUtilisateurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
