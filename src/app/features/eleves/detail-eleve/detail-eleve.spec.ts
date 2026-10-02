import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetailEleve } from './detail-eleve';

describe('DetailEleve', () => {
  let component: DetailEleve;
  let fixture: ComponentFixture<DetailEleve>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailEleve],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailEleve);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
