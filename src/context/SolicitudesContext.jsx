import { createContext, useContext, useState } from 'react';

const SolicitudesContext = createContext();

export const solicitudesIniciales = [
  { id: '0128', cliente: 'Carlos Medina',     tel: '555-1001', vehiculo: 'Toyota Corolla 2021',    placa: 'ABC-001', servicio: 'Cambio de aceite',      estado: 'Completada',  fecha: '2026-02-28' },
  { id: '0127', cliente: 'María López',       tel: '555-1002', vehiculo: 'Honda Civic 2019',       placa: 'DEF-202', servicio: 'Revisión de frenos',     estado: 'En proceso',  fecha: '2026-03-01' },
  { id: '0126', cliente: 'Roberto García',    tel: '555-1003', vehiculo: 'Nissan Sentra 2020',     placa: 'GHI-303', servicio: 'Scaner',                 estado: 'En proceso',  fecha: '2026-03-01' },
  { id: '0125', cliente: 'Ana Torres',        tel: '555-1004', vehiculo: 'Chevrolet Spark 2022',   placa: 'JKL-404', servicio: 'Alineación y balanceo',  estado: 'Pendiente',   fecha: '2026-03-02' },
  { id: '0124', cliente: 'Luis Ramírez',      tel: '555-1005', vehiculo: 'Ford Focus 2018',        placa: 'MNO-505', servicio: 'Suspensión',             estado: 'Completada',  fecha: '2026-02-25' },
  { id: '0123', cliente: 'Patricia Vega',     tel: '555-1006', vehiculo: 'Kia Sportage 2020',      placa: 'PQR-606', servicio: 'Servicio completo',      estado: 'Pendiente',   fecha: '2026-03-02' },
  { id: '0122', cliente: 'Jorge Castillo',    tel: '555-1007', vehiculo: 'Hyundai Tucson 2021',    placa: 'STU-707', servicio: 'Ruido delantero',        estado: 'En proceso',  fecha: '2026-03-01' },
  { id: '0121', cliente: 'Sandra Morales',    tel: '555-1008', vehiculo: 'Volkswagen Jetta 2019',  placa: 'VWX-808', servicio: 'Servicio motor',         estado: 'Completada',  fecha: '2026-02-27' },
  { id: '0120', cliente: 'Eduardo Flores',    tel: '555-1009', vehiculo: 'Mazda CX-5 2022',        placa: 'YZA-909', servicio: 'Servicio frenos',        estado: 'Pendiente',   fecha: '2026-03-02' },
  { id: '0119', cliente: 'Claudia Herrera',   tel: '555-1010', vehiculo: 'Renault Logan 2018',     placa: 'BCD-010', servicio: 'Ruido trasero',          estado: 'Completada',  fecha: '2026-02-26' },
  { id: '0118', cliente: 'Miguel Ángel Díaz', tel: '555-1011', vehiculo: 'Peugeot 208 2021',       placa: 'EFG-111', servicio: 'Scaner',                 estado: 'Completada',  fecha: '2026-02-24' },
  { id: '0117', cliente: 'Fernanda Ruiz',     tel: '555-1012', vehiculo: 'Chevrolet Aveo 2020',    placa: 'HIJ-222', servicio: 'Suspensión',             estado: 'En proceso',  fecha: '2026-03-01' },
];

export function SolicitudesProvider({ children }) {
  const [solicitudes, setSolicitudes] = useState(solicitudesIniciales);

  const cambiarEstado = (id, nuevoEstado) => {
    setSolicitudes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, estado: nuevoEstado } : s))
    );
  };

  return (
    <SolicitudesContext.Provider value={{ solicitudes, cambiarEstado }}>
      {children}
    </SolicitudesContext.Provider>
  );
}

export const useSolicitudes = () => useContext(SolicitudesContext);
