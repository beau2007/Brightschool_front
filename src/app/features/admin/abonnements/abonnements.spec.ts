import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Abonnements } from './abonnements';

describe('Abonnements', () => {
  let component: Abonnements;
  let fixture: ComponentFixture<Abonnements>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Abonnements],
    }).compileComponents();

    fixture = TestBed.createComponent(Abonnements);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
