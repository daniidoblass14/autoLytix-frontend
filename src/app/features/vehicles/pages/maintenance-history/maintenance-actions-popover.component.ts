import { Component, Input } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { MantenimientoResponseDTO } from '../../../../core/models/mantenimiento-response.dto';

@Component({
  selector: 'app-maintenance-actions-popover',
  templateUrl: './maintenance-actions-popover.component.html',
  styleUrls: ['./maintenance-actions-popover.component.scss'],
  standalone: false,
})
export class MaintenanceActionsPopoverComponent {
  @Input() maintenance!: MantenimientoResponseDTO;
  @Input() onEditCallback?: (maintenance: MantenimientoResponseDTO) => void;
  @Input() onDeleteCallback?: (maintenance: MantenimientoResponseDTO) => void;

  constructor(private popoverController: PopoverController) {}

  onEdit() {
    if (this.onEditCallback) {
      this.onEditCallback(this.maintenance);
    }
    this.popoverController.dismiss();
  }

  onDelete() {
    if (this.onDeleteCallback) {
      this.onDeleteCallback(this.maintenance);
    }
    this.popoverController.dismiss();
  }
}
