import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MesTransactionsComponent } from './mes-transactions.component';

describe('MesTransactionsComponent', () => {
  let component: MesTransactionsComponent;
  let fixture: ComponentFixture<MesTransactionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesTransactionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MesTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
