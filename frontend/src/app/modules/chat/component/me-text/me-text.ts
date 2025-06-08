import { Component, input } from '@angular/core';

@Component({
  selector: 'app-me-text',
  imports: [],
  templateUrl: './me-text.html',
})
export class MeText {
  message = input.required<string>();
  label = input.required<string>();
  timestamp = input.required<string>();
}
