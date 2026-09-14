import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Atenciones</h2>
    <div *ngIf="yo"><em>Sesion: {{ yo.nombre }} - roles: {{ yo.roles.join(', ') }}</em></div>
    <ul>
      <li *ngFor="let a of atenciones">
        #{{ a.id }} - {{ a.pacienteNombre }} - <strong>{{ a.estado }}</strong>
      </li>
    </ul>
    <p *ngIf="atenciones.length === 0">No hay atenciones todavia.</p>
  `
})
export class AppointmentsComponent implements OnInit {
  atenciones: any[] = [];
  yo: any = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getMe().subscribe(r => this.yo = r);
    this.api.getAppointments().subscribe(r => this.atenciones = r);
  }
}
