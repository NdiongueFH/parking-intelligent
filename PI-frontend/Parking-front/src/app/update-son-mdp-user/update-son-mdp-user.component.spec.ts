import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateSonMDPUserComponent } from './update-son-mdp-user.component';

describe('UpdateSonMDPUserComponent', () => {
  let component: UpdateSonMDPUserComponent;
  let fixture: ComponentFixture<UpdateSonMDPUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateSonMDPUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateSonMDPUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
