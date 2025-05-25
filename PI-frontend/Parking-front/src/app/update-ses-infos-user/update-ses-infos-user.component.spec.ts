import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateSesInfosUserComponent } from './update-ses-infos-user.component';

describe('UpdateSesInfosUserComponent', () => {
  let component: UpdateSesInfosUserComponent;
  let fixture: ComponentFixture<UpdateSesInfosUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateSesInfosUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateSesInfosUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
