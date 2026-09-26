import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MesEnfants } from './mes-enfants';

describe('MesEnfants', () => {
  let component: MesEnfants;
  let fixture: ComponentFixture<MesEnfants>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesEnfants],
    }).compileComponents();

    fixture = TestBed.createComponent(MesEnfants);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
