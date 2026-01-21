import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VehiclesListPage } from './vehicles-list.page';

describe('VehiclesListPage', () => {
  let component: VehiclesListPage;
  let fixture: ComponentFixture<VehiclesListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VehiclesListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
