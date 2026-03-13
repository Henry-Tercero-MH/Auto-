# AUTO+ — Sistema de Gestión de Taller Automotriz

Aplicación web para taller mecánico. Permite registrar solicitudes de servicio, dar seguimiento a órdenes de trabajo, gestionar clientes y vehículos, y generar reportes.

## Stack

- React 19 + Vite 5 + React Router DOM v7
- Tailwind CSS v3 (PostCSS)
- react-hot-toast — notificaciones
- Google Sheets como base de datos (Google Apps Script Web App como backend REST)

## Requisitos

- Node 18 (incompatible con Vite 7 y Tailwind v4)

## Instalación

```bash
npm install
npm run dev
```

## Credenciales de prueba

- Email: `admin@drivebot.com`
- Password: `admin123`

## Paleta de colores

| Token         | Valor     | Uso                              |
|---------------|-----------|----------------------------------|
| `primary`     | `#1F2A56` | Sidebar, headers, nav activo     |
| `accent`      | `#E10600` | Botones CTA, ítems activos       |
| `highlight`   | `#F57C00` | Hover, indicadores               |
| `background`  | `#F4F6F8` | Fondo general                    |
| `text-main`   | `#2B2B2B` | Texto principal                  |

## Estructura de páginas

| Ruta              | Página            | Descripción                                          |
|-------------------|-------------------|------------------------------------------------------|
| `/login`          | Login.jsx         | Pantalla de acceso                                   |
| `/`               | Home.jsx          | Dashboard con stats y tabla de solicitudes recientes |
| `/solicitudes`    | Solicitudes.jsx   | Listado completo de solicitudes                      |
| `/nueva`          | NuevaSolicitud.jsx| Wizard 4 pasos para crear orden de trabajo           |
| `/seguimiento`    | Seguimiento.jsx   | Timeline de estado por vehículo/orden                |
| `/servicios`      | Servicios.jsx     | Catálogo de servicios del taller                     |
| `/catalogos`      | Catalogos.jsx     | Admin: clientes, mecánicos, marcas, servicios        |
| `/reportes`       | Reportes.jsx      | Reportes y métricas                                  |
| `/scaner`         | Scaner.jsx        | Módulo de escaneo                                    |

## Contextos principales

- `AuthContext` — autenticación (mock local + Google Sheets)
- `CatalogosContext` — clientes, vehículos, mecánicos, marcas, servicios, config negocio
- `SolicitudesContext` — CRUD de solicitudes

## Backend (Google Apps Script)

El archivo `src/services/sheetsApi.js` expone el cliente REST que conecta con un Google Apps Script publicado como Web App. Todas las operaciones (crear, editar, eliminar) pasan por ahí.

Recursos disponibles: `solicitudes`, `clientes`, `vehiculos`, `mecanicos`, `servicios`, `marcas`, `pagos`, `repuestos`, `config`, `usuarios`.

## Wizard NuevaSolicitud

1. Datos del cliente (nombre, tel, email)
2. Datos del vehículo (marca, modelo, año, placa, km)
3. Tipo de servicio + adicionales + observaciones + inspección visual
4. Orden de trabajo estilo factura (logo, No. orden auto-generado, tabla de servicios)
