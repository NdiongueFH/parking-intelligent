import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoriquesUtilisateurComponent } from './historiques-utilisateur.component';

describe('HistoriquesUtilisateurComponent', () => {
  let component: HistoriquesUtilisateurComponent;
  let fixture: ComponentFixture<HistoriquesUtilisateurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoriquesUtilisateurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoriquesUtilisateurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
