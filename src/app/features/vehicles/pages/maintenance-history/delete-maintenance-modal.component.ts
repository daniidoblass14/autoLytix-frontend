import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { MantenimientoResponseDTO } from '../../../../core/models/mantenimiento-response.dto';

@Component({
  selector: 'app-delete-maintenance-modal',
  templateUrl: './delete-maintenance-modal.component.html',
  styleUrls: ['./delete-maintenance-modal.component.scss'],
  standalone: false,
})
export class DeleteMaintenanceModalComponent implements OnInit {
  @Input() maintenance!: MantenimientoResponseDTO;
  @Input() tipoLabel: string = '';
  @Input() fechaFormateada: string = '';
  @Input() kmFormateado: string = '';

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    // El foco se establecerá en el botón Cancelar por defecto
  }

  cancel() {
    this.modalController.dismiss(false);
  }

  confirm() {
    this.modalController.dismiss(true);
  }
}
