# Manual de Usuario — Sistema de Gestión de Taller AUTO+

## Introducción

Bienvenido al sistema de gestión de taller **AUTO+**. Esta aplicación está diseñada para facilitar la administración de talleres mecánicos, permitiendo registrar vehículos, gestionar órdenes de trabajo, clientes, servicios, estados de reparación y más, de forma sencilla y rápida.

**¿A quién está dirigido?**
- Personal de talleres mecánicos (administradores, supervisores, mecánicos)
- Usuarios con pocos conocimientos técnicos

---

## Requisitos previos para usar la aplicación

- **Navegador recomendado:** Google Chrome, Microsoft Edge o Firefox (última versión)
- **Sistema operativo:** Windows, Linux, MacOS o Android (tableta o móvil)
- **Acceso a internet:** Requerido para todas las funciones
- **Credenciales:** Proporcionadas por el administrador del taller

---

## Acceso al sistema

1. Abre el navegador y accede a la dirección web del sistema (consulta con tu administrador).
2. Haz clic en **Iniciar sesión**.
3. Elige tu tipo de acceso:
   - **Administrador/Supervisor:** Ingresa tu correo y contraseña.
   - **Mecánico:** Ingresa tu correo y PIN de acceso.
4. Haz clic en **Ingresar**.

**¿No tienes cuenta?**
- Contacta al administrador del taller para que te registre en el sistema.

---

## Vista general de la interfaz

- **Menú lateral:** Acceso rápido a los módulos principales (Solicitudes, Nueva Solicitud, Servicios, Seguimiento, Catálogos, Reportes).
- **Panel principal:** Muestra la información y formularios del módulo seleccionado.
- **Barra superior:** Acceso a notificaciones y cierre de sesión.

---

## Funcionalidades principales

### 1. Crear una nueva orden de trabajo
**Descripción:** Registra una solicitud de servicio para un vehículo.

**Pasos:**
1. Haz clic en **Nueva Solicitud** en el menú.
2. Completa los pasos del formulario:
   1. **Inspección visual:** Marca daños en el diagrama del vehículo (opcional).
   2. **Datos del cliente:** Busca o crea un cliente nuevo.
   3. **Datos del vehículo:** Selecciona un vehículo existente o ingresa uno nuevo.
   4. **Servicio:** Elige el servicio principal y adicionales. Asigna mecánico si aplica.
   5. **Resumen:** Revisa la orden, imprime, envía por WhatsApp o confirma el registro.
3. Haz clic en **Confirmar registro** para guardar la orden.

**Notas:**
- Puedes adjuntar fotos del vehículo (si la función está habilitada).
- El sistema valida que los datos obligatorios estén completos.

### 2. Consultar y gestionar órdenes de trabajo
**Descripción:** Visualiza, filtra y actualiza el estado de las órdenes.

**Pasos:**
1. Haz clic en **Solicitudes** en el menú.
2. Usa los filtros por estado, búsqueda o fecha para encontrar la orden.
3. Haz clic en una orden para ver detalles.
4. Si tienes permisos, puedes cambiar el estado (ejemplo: Pendiente → En proceso → Completada).
5. Los mecánicos pueden tomar órdenes disponibles y ver solo las asignadas a ellos.

### 3. Registrar un cliente y asociar un vehículo
**Descripción:** Agrega un nuevo cliente y vincula su vehículo.

**Pasos:**
1. Al crear una nueva solicitud, en el paso de cliente, busca el nombre o teléfono.
2. Si no existe, selecciona "Agregar nuevo cliente" y completa los datos.
3. En el paso de vehículo, selecciona uno existente o ingresa los datos de uno nuevo.

### 4. Generar reportes
**Descripción:** Descarga listados de órdenes, servicios vendidos y comprobantes.

**Pasos:**
1. Haz clic en **Reportes** en el menú.
2. Filtra por fechas, estado o mecánico.
3. Descarga los reportes en Excel o imprime comprobantes.

### 5. Seguimiento de reparaciones
**Descripción:** Consulta el avance de una orden y su historial de estados.

**Pasos:**
1. Haz clic en **Seguimiento** en el menú.
2. Busca la orden o vehículo.
3. Visualiza el historial de cambios y estados.

---

## Flujos típicos de trabajo

### Registrar un cliente nuevo y asociar un vehículo
1. Inicia una **Nueva Solicitud**.
2. En el paso de cliente, busca el nombre. Si no existe, crea uno nuevo.
3. En el paso de vehículo, selecciona uno existente o ingresa los datos de uno nuevo.
4. Completa los pasos y confirma la solicitud.

### Crear una orden de trabajo para un vehículo
1. Haz clic en **Nueva Solicitud**.
2. Completa los datos requeridos.
3. Revisa el resumen y confirma el registro.

### Actualizar el estado de una reparación
1. Ve a **Solicitudes**.
2. Selecciona la orden.
3. Cambia el estado según el avance (ejemplo: En proceso, Completada).

### Cerrar una orden de trabajo
1. Marca la orden como **Completada** en el detalle de la solicitud.
2. El sistema la moverá al historial y podrás generar el comprobante.

---

## Roles y permisos

- **Administrador/Supervisor:**
  - Acceso total a todas las funciones y reportes.
  - Puede crear, editar y cerrar órdenes, gestionar catálogos y ver reportes.
- **Mecánico:**
  - Solo ve y gestiona sus propias órdenes.
  - Puede tomar órdenes disponibles y actualizar su estado.
  - No puede acceder a reportes ni catálogos.

---

## Mensajes de error y cómo interpretarlos

- **"Nombre requerido" / "Teléfono requerido":** Completa los datos obligatorios.
- **"El teléfono debe tener exactamente 8 dígitos":** Verifica el número ingresado.
- **"Año no válido":** Ingresa un año correcto (ejemplo: 2022).
- **"Placa no válida":** Revisa el formato de la placa (ejemplo: ABC123).
- **"Correo o contraseña incorrectos":** Verifica tus credenciales.
- **"Acceso no permitido fuera del horario laboral":** Intenta ingresar en el horario autorizado.
- **"Error al subir archivo":** Revisa tu conexión o intenta con otra imagen.

Si ves un mensaje de error no listado, intenta recargar la página o contacta a soporte.

---

## Preguntas frecuentes (FAQ)

**¿Puedo registrar varios vehículos para un cliente?**
Sí, cada cliente puede tener varios vehículos asociados.

**¿Puedo agregar servicios personalizados?**
Sí, en el paso de servicios puedes agregar nuevos servicios al catálogo.

**¿Qué hago si olvidé mi contraseña o PIN?**
Contacta al administrador del taller para restablecer tus datos de acceso.

**¿Puedo usar el sistema desde el celular?**
Sí, la aplicación es compatible con dispositivos móviles y tabletas.

**¿Puedo adjuntar fotos a una orden?**
Sí, si la función está habilitada. Si ves un candado, consulta con el administrador.

---

## Contacto o soporte

Para soporte técnico, dudas o sugerencias, contacta a:

- Nombre: Henry Tercero
- Teléfono: +502 4070-5002
- WhatsApp: [Ir a WhatsApp](https://wa.me/50240705002)

---

*Este manual está basado en la versión actual del sistema. Si tienes sugerencias de mejora, comunícalo a soporte.*

---

Suposición: Si alguna función no aparece en tu menú, puede estar deshabilitada o requerir permisos especiales. Consulta con tu administrador.
