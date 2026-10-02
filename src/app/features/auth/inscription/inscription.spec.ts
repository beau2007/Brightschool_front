import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Inscription } from './inscription';

describe('Inscription', () => {
  let component: Inscription;
  let fixture: ComponentFixture<Inscription>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inscription],
    }).compileComponents();

    fixture = TestBed.createComponent(Inscription);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create and expose the registration form', () => {
    expect(component).toBeTruthy();
    expect(component.form.get('nomEcole')).toBeTruthy();
    expect(component.form.get('planId')).toBeTruthy();
    expect(component.form.get('motDePasse')).toBeTruthy();
  });
});
