import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, InstitutionalInfo } from '../api.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html'
})
export class AboutComponent implements OnInit {
  info: InstitutionalInfo | null = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getInfoInstitucional().subscribe({
      next: info => this.info = info,
      error: err => console.warn('No se pudo cargar la información institucional:', err)
    });
  }
}
