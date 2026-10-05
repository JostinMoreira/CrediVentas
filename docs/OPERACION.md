# Operación de CrediVentas

## Estado verificado el 5 de octubre de 2026

- RLS de productos y Storage inspeccionada. Acceso anónimo limitado a SELECT; sin TRUNCATE para clientes.
- Pruebas con roles anónimo, autenticado común, metadatos de usuario falsificados y administrador aprobadas. Todos los datos de prueba se revirtieron.
- Un administrador de aplicación existente; ninguno tenía un factor MFA verificado en la inspección. No se le modificaron credenciales.
- El asesor remoto advierte que la protección contra contraseñas filtradas está deshabilitada.
- La tabla privada de auditoría tiene RLS sin políticas de cliente: es intencional, pues se escribe desde un trigger y solo la consulta un operador de base de datos.
- Los índices recién añadidos figuran aún sin uso en el asesor; el catálogo actual contiene dos productos y no ofrece carga representativa para medir su beneficio.

## Ajustes pendientes en el panel de Supabase

El conector disponible no expone la modificación de configuración de Auth. El navegador integrado solicitó iniciar sesión; no se introdujeron credenciales.

1. [Sign In / Providers](https://supabase.com/dashboard/project/gmzukzkyrburvhtjgfvb/auth/providers): deshabilitar **Allow new users to sign up**, dado que el catálogo solo usa cuentas administrativas.
2. Revisar política de contraseña (mínimo recomendado para este proyecto: 12 caracteres) y reautenticación para cambios.
3. [Protección de contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection): activarla si el plan lo permite. Supabase la ofrece en Pro y superiores; no se contrató un plan.
4. El titular debe activar MFA en su cuenta de Supabase y considerar MFA para el usuario administrador de la aplicación. La aplicación aún no incluye pantalla de enrolamiento/desafío TOTP, ni exige AAL2 en RLS. Debe implementarse ese flujo antes de imponer AAL2 para evitar bloquear el panel.
5. Revisar las URLs de Auth según el dominio real de producción y restringir las redirecciones a las necesarias.

La configuración de `supabase/config.toml` es local. Cambiar ese archivo **no actualiza** automáticamente Auth alojado.

## Entorno local verificado

La instalación desde cero se completó con Docker Desktop, localizado en AppData/Local/Programs/DockerDesktop. Las seis migraciones pasaron y también las pruebas SQL de roles. Se comprobaron además sesiones reales de Auth y cargas/borrados de Storage en el entorno local; se limpiaron las cuentas, productos e imágenes temporales.

La prueba detectó y corrigió la configuración local de correo: auth.enable_signup=false cierra el registro, mientras auth.email.enable_signup=true conserva el proveedor para iniciar sesión. Se verificó que las cuentas administrativas existentes pueden entrar y que el registro público sigue rechazado. Esta corrección de config.toml se aplica solo al entorno local.

Los servicios locales de CrediVentas se detuvieron conservando su almacenamiento. Las pruebas no cambiaron la configuración pública del frontend ni los ajustes de Auth alojado. Para repetirlas, consulta [el README](../README.md#entorno-local-aislado).

## Copias y recuperación

No se ha confirmado el plan, la retención de copias o PITR del proyecto. No se debe dar por disponible una copia sin revisar [los backups de Supabase](https://supabase.com/docs/guides/platform/backups).

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

## Revisión de publicación

Después de publicar en el dominio real:

- Comprobar catálogo, búsqueda, ficha directa, rutas protegidas y retorno al catálogo.
- Verificar HTTPS y cabeceras de `vercel.json`; revisar infracciones de CSP con cargas, fuentes y galería.
- Confirmar el número y texto del enlace de WhatsApp sin enviar pedidos de prueba a clientes.
- Revisar avisos de npm y asesores de Supabase después de nuevas dependencias o migraciones.
- La configuración de CI está versionada, pero debe ejecutarse en el repositorio remoto para demostrar su resultado allí.

La lista priorizada de trabajo restante y sus criterios de finalización están en [PENDIENTES.md](PENDIENTES.md).
