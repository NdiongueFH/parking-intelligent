import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeParkingComponent } from './liste-parking.component';

describe('ListeParkingComponent', () => {
  let component: ListeParkingComponent;
  let fixture: ComponentFixture<ListeParkingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListeParkingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListeParkingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
