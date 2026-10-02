import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableauNotes } from './tableau-notes';

describe('TableauNotes', () => {
  let component: TableauNotes;
  let fixture: ComponentFixture<TableauNotes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableauNotes],
    }).compileComponents();

    fixture = TestBed.createComponent(TableauNotes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
