import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MotDePasseOublie } from './mot-de-passe-oublie';

describe('MotDePasseOublie', () => {
  let component: MotDePasseOublie;
  let fixture: ComponentFixture<MotDePasseOublie>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MotDePasseOublie],
    }).compileComponents();

    fixture = TestBed.createComponent(MotDePasseOublie);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
