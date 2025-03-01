import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionsUtilisateursComponent } from './gestions-utilisateurs.component';

describe('GestionsUtilisateursComponent', () => {
  let component: GestionsUtilisateursComponent;
  let fixture: ComponentFixture<GestionsUtilisateursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionsUtilisateursComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionsUtilisateursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
