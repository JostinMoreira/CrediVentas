import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Product {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  estado: 'Activo' | 'Oculto';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  // Arreglo estático de 3 productos de prueba para maquinaria agrícola y electrodomésticos
  products: Product[] = [
    {
      id: 1,
      nombre: 'Tractor Agrícola 75 HP 4x4',
      categoria: 'Maquinaria Agrícola',
      precio: 85000000,
      estado: 'Activo'
    },
    {
      id: 2,
      nombre: 'Refrigerador No Frost 400L Inverter',
      categoria: 'Electrodomésticos',
      precio: 3200000,
      estado: 'Activo'
    },
    {
      id: 3,
      nombre: 'Guadañadora a Gasolina 52cc',
      categoria: 'Maquinaria Agrícola',
      precio: 1150000,
      estado: 'Oculto'
    }
  ];
}
