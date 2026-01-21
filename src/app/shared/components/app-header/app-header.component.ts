import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { Usuario } from '../../../core/models/login-response.dto';

@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
  standalone: false,
})
export class AppHeaderComponent implements OnInit, OnDestroy {
  @Input() showBackButton: boolean = false;
  @Input() breadcrumbItems: { label: string; route?: string; click?: () => void }[] = [];
  @Input() showNav: boolean = true;

  currentUser: Usuario | null = null;
  private userSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private location: Location
  ) {}

  ngOnInit() {
    this.loadUser();
    // Suscribirse a cambios del usuario para actualizar el avatar automáticamente
    this.userSubscription = this.authService.user$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  loadUser() {
    this.currentUser = this.authService.getUser();
  }

  getInitials(): string {
    if (!this.currentUser) {
      return 'U';
    }
    
    const nombre = this.currentUser.nombre || '';
    const apellido = this.currentUser.apellido || '';
    
    if (nombre && apellido) {
      return (nombre[0] + apellido[0]).toUpperCase();
    } else if (nombre) {
      return nombre[0].toUpperCase();
    }
    
    return 'U';
  }

  goBack() {
    this.location.back();
  }

  onBreadcrumbClick(item: { label: string; route?: string; click?: () => void }) {
    if (item.click) {
      item.click();
    }
  }
}
