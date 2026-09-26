import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariante = 'primary' | 'outline' | 'ghost';
export type ButtonTaille = 'md' | 'sm';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './Button.html',
  styleUrl: './Button.scss'
})
export class Button {
  @Input() variante: ButtonVariante = 'primary';
  @Input() taille: ButtonTaille = 'md';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
  @Input() chargement = false;
  @Input() pleineLargeur = false;

  @Output() clicked = new EventEmitter<MouseEvent>();
}
