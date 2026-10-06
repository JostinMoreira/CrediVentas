# Operación de CrediVentas

## Estado verificado el 5 de octubre de 2026

- RLS de productos y Storage inspeccionada. Acceso anónimo limitado a SELECT; sin TRUNCATE para clientes.
- Pruebas con roles anónimo, autenticado común, metadatos de usuario falsificados y administrador aprobadas. Todos los datos de prueba se revirtieron.
- Un administrador de aplicación existente; ninguno tenía un factor MFA verificado en la inspección. No se le modificaron credenciales.
- El asesor remoto advierte que la protección contra contraseñas filtradas está deshabilitada.
- Auth alojado: registro público cerrado (`disable_signup=true` confirmado en el endpoint público), proveedor de correo activo y cambio seguro de contraseña habilitado. El inicio de sesión del administrador real no se probó sin sus credenciales.
- TOTP está habilitado en Auth; Supabase limita a 15 minutos las sesiones AAL1 que no completan un factor. El titular aún debe inscribir sus factores.
- El proyecto usa el plan Free; el panel de Database Backups indica que este plan no incluye copias programadas del proyecto.
- El inventario remoto mostró 2 objetos de Storage referenciados y 0 candidatos huérfanos; la auditoría privada tenía 0 eventos.
- La tabla privada de auditoría tiene RLS sin políticas de cliente: es intencional, pues se escribe desde un trigger y solo la consulta un operador de base de datos.
- Los índices recién añadidos figuran aún sin uso en el asesor; el catálogo actual contiene dos productos y no ofrece carga representativa para medir su beneficio.

## Ajustes pendientes en el panel de Supabase

El propietario inició sesión en el panel y se aplicaron los cambios de Auth indicados. El conector disponible no expone la modificación de esta configuración; `supabase/config.toml` sigue correspondiendo al entorno local.

1. [Sign In / Providers](https://supabase.com/dashboard/project/gmzukzkyrburvhtjgfvb/auth/providers): **Allow new users to sign up** deshabilitado; correo y **Secure password change** habilitados y comprobados tras recargar el panel.
2. Revisar la contraseña de la cuenta administrativa real antes de subir la longitud mínima o exigir nuevas clases de caracteres. [Supabase documenta](https://supabase.com/docs/guides/auth/password-security#how-will-strengthened-password-requirements-affect-current-users) que el login de cuentas existentes con contraseñas débiles puede devolver `WeakPasswordError`; la aplicación ya muestra una indicación para contactar al propietario y recuperar la cuenta.
3. [Protección de contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection): no disponible en Free; el panel la reserva a Pro y superiores. No se cambió de plan.
4. El titular debe activar MFA en su cuenta de Supabase. La aplicación dispone de pantalla de enrolamiento/desafío TOTP y exige AAL2 en RLS a los administradores que ya tienen un factor verificado. El administrador real debe configurar un factor, añadir un dispositivo de respaldo y ensayar el acceso de recuperación.
5. Revisar las URLs de Auth según el dominio real de producción y restringir las redirecciones a las necesarias.

La configuración de `supabase/config.toml` es local. Cambiar ese archivo **no actualiza** automáticamente Auth alojado.

## Entorno local verificado

La instalación desde cero se completó con Docker Desktop, localizado en AppData/Local/Programs/DockerDesktop. Las siete migraciones pasaron y también las pruebas SQL de roles. Se comprobaron además sesiones reales de Auth, MFA y cargas/borrados de Storage en el entorno local; se limpiaron las cuentas, productos e imágenes temporales.

La prueba detectó y corrigió la configuración local de correo: auth.enable_signup=false cierra el registro, mientras auth.email.enable_signup=true conserva el proveedor para iniciar sesión. Se verificó que las cuentas administrativas existentes pueden entrar y que el registro público sigue rechazado. Esta corrección de config.toml se aplica solo al entorno local.

Los servicios locales de CrediVentas se detuvieron conservando su almacenamiento. Las pruebas no cambiaron la configuración pública del frontend ni los ajustes de Auth alojado. Para repetirlas, consulta [el README](../README.md#entorno-local-aislado).

## Copias y recuperación

Se confirmó en el panel que el proyecto está en **Free** y **no incluye copias programadas**. No se verificó PITR ni existe un ensayo de restauración. Antes de depender de este proyecto para producción, configurar una copia externa segura de base de datos y objetos de Storage, o elegir un plan con las copias necesarias y comprobar su alcance. Consulta [la documentación de backups de Supabase](https://supabase.com/docs/guides/platform/backups).

### Exportación manual en Windows (pendiente de definir destino seguro)

La copia debe quedar fuera del repositorio. El ejemplo crea una carpeta fechada en Documentos; después de generarla, copiarla a un destino externo cifrado y con acceso restringido. No guardar contraseñas, tokens ni archivos de respaldo en el proyecto.

En PowerShell, el propietario instala/ejecuta Supabase CLI, inicia sesión y enlaza el proyecto:

```powershell
npx supabase login
npx supabase link --project-ref gmzukzkyrburvhtjgfvb

$backupDir = Join-Path ([Environment]::GetFolderPath('MyDocuments')) ("CrediVentasBackups\" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backupDir
npx supabase db dump --linked --role-only -f (Join-Path $backupDir 'roles.sql')
npx supabase db dump --linked -f (Join-Path $backupDir 'schema.sql')
npx supabase db dump --linked --data-only --use-copy -f (Join-Path $backupDir 'data.sql')
npx supabase storage cp -r ss://productos (Join-Path $backupDir 'productos') --experimental --linked
```

Supabase CLI excluye esquemas administrados, como `auth` y `storage`, de los dumps normales. Las políticas, funciones y configuración del bucket de CrediVentas se recrean aplicando las migraciones versionadas; el comando Storage copia los archivos del bucket por separado. La base de datos guarda las referencias y metadatos del catálogo, por lo que no se debe restaurar un volcado SQL sin los archivos. Los usuarios de Auth no se exportan con estos dumps: hay que recrear la cuenta administrativa de forma segura en el proyecto de recuperación y volver a enrolar MFA.

Esta exportación manual no es todavía un sistema de respaldo periódico: faltan elegir destino externo, frecuencia, retención, responsable y prueba de restauración. Tampoco se debe restaurar sobre producción para ensayar. El procedimiento completo debe restaurar esquema/datos en un proyecto o entorno aislado, cargar los archivos a Storage, aplicar las migraciones necesarias y verificar productos, permisos, búsqueda, imágenes y MFA.

Procedimiento recomendado:

1. El propietario define cuánta información puede perder y cuánto tiempo tolera sin servicio.
2. Verifica copias automáticas y retención en el panel; si usas exportaciones, ejecútalas desde un entorno seguro con la CLI y credenciales de operador.
3. Conserva por separado esquema/historial de migraciones, datos y **objetos de Storage**. Una copia SQL no contiene los archivos de imagen.
4. Cifra las copias, restringe el acceso y mantenlas fuera del repositorio.
5. Restaura una copia en un entorno aislado; comprueba conteos, restricciones, búsqueda, roles y recuperación de imágenes.
6. Registra fecha, copia utilizada, duración y resultado. Solo un ensayo real permite afirmar que la recuperación funciona.

No se exportaron datos privados ni se ejecutó una restauración de producción durante estas correcciones. La recreación del esquema vacío y las pruebas de permisos son comprobaciones distintas de recuperar una copia real.

## Auditoría administrativa

Consultar desde una conexión de operador:

```sql
select product_id, actor_id, operation, occurred_at
from private.catalog_audit
order by occurred_at desc
limit 100;
```

No añadir políticas públicas a esta tabla para eliminar la advertencia informativa del asesor. Definir con el propietario la retención antes de programar una purga. El registro no guarda payloads, tokens, correos ni valores de formularios.

## Errores y alertas

La aplicación captura errores inesperados con `ErrorReporter`, muestra recuperación y guarda como máximo 20 eventos locales con fecha, tipo y pantalla. No registra mensajes, stack traces, parámetros, identificadores de productos ni datos introducidos.

La clave local es `crediventas:diagnostics`. Estos eventos **no se envían** a terceros y no sustituyen un servicio de monitorización. Para un recolector remoto se necesita elegir destino, retención y reglas de anonimización. Las solicitudes gestionadas muestran mensajes comprensibles y permiten reintentar.

La cola `crediventas:image-cleanup:<host>` conserva solo URLs del bucket para reintentar limpiezas desde ese navegador. Si se borran sus datos locales, se pierde la cola. Revisar el inventario de Storage periódicamente; no eliminar objetos por antigüedad sin comprobar referencias.

El [inventario de catálogo](../supabase/maintenance/catalog_inventory.sql) es de solo lectura. Ejecutarlo con una conexión de operador para contar objetos referenciados, investigar candidatos con más de 48 horas y revisar la antigüedad del registro de auditoría. No convierte los candidatos en borrados automáticos: verificar referencias, copias y una política de retención antes de usar la API de Storage. En la revisión del 5 de octubre hubo 2 objetos referenciados y 0 candidatos huérfanos.

## Rutina de mantenimiento

Responsable: el propietario o un operador designado con acceso al proyecto. Registrar fecha, resultado y acciones tomadas en un registro privado fuera del repositorio.

- En cada cambio de dependencias o despliegue: ejecutar `npm audit --audit-level=high`, revisar `npm outdated` y comprobar la compilación y pruebas locales.
- Semanalmente: consultar asesores de seguridad y rendimiento de Supabase, ejecutar el inventario de imágenes y revisar errores reportados.
- Mensualmente: revisar volumen y antigüedad de `private.catalog_audit`, confirmar que las copias siguen disponibles y documentar la retención acordada.
- Antes de borrar imágenes o eventos: comprobar referencias, copias y retención. El inventario por sí solo no autoriza una purga.

## Revisión de publicación

Después de publicar en el dominio real:

- Comprobar catálogo, búsqueda, ficha directa, rutas protegidas y retorno al catálogo.
- Verificar HTTPS y cabeceras de `vercel.json`; revisar infracciones de CSP con cargas, fuentes y galería.
- Confirmar el número y texto del enlace de WhatsApp sin enviar pedidos de prueba a clientes.
- Revisar avisos de npm y asesores de Supabase después de nuevas dependencias o migraciones.
- La configuración de CI está versionada, pero debe ejecutarse en el repositorio remoto para demostrar su resultado allí.

La lista priorizada de trabajo restante y sus criterios de finalización están en [PENDIENTES.md](PENDIENTES.md).
