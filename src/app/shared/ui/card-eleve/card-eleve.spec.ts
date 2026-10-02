import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardEleve } from './card-eleve';

describe('CardEleve', () => {
  let component: CardEleve;
  let fixture: ComponentFixture<CardEleve>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardEleve],
    }).compileComponents();

    fixture = TestBed.createComponent(CardEleve);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
