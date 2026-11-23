# PATOTÓN 2026 · Sitio inicial

## Qué incluye
- Landing page con la imagen de identidad proporcionada.
- Dos jornadas destacadas: 25 de diciembre de 2026 y 6 de enero de 2027.
- Formulario público para propuestas de donación.
- Acceso de administrador privado.
- Panel admin con resumen, propuestas, voluntarios y publicaciones.
- SQL con tablas, RLS y permisos de administrador.

## Antes de publicar
1. Crea un proyecto Supabase independiente para PATOTÓN (recomendado para no mezclar datos con otros proyectos).
2. En SQL Editor ejecuta `patoton_setup.sql`.
3. En Authentication crea una cuenta para el adulto responsable/administrador.
4. Copia el UUID de esa cuenta y, desde SQL Editor, ejecuta:
   `insert into public.patoton_admins(user_id) values ('UUID-DE-TU-CUENTA');`
5. En Project Settings > API copia Project URL y la publishable/anon key.
6. Abre `supabase-config.js` y reemplaza los dos valores `PEGA_AQUI...`.
7. Sube el contenido de esta carpeta al repositorio GitHub Pages.
8. En Supabase > Authentication > URL Configuration configura Site URL con la URL pública final del sitio.

## Seguridad
- Nunca uses la service_role/secret key en archivos del sitio.
- RLS está activado. Los visitantes pueden enviar propuestas, pero no leer propuestas privadas.
- Solo cuentas registradas en `patoton_admins` pueden revisar y administrar registros.
- Como la campaña involucra a menores, un adulto de confianza debe gestionar contactos, entregas, donaciones económicas y datos personales.
- No publiques direcciones particulares ni información identificable de familias beneficiarias.

## Límites de esta primera versión
- El formulario de voluntariado se muestra como sección del plan, pero aún no tiene formulario conectado.
- La página no procesa pagos. Los apoyos económicos deben coordinarse con un adulto responsable por un medio seguro.
- La sección de configuración muestra las fechas fijas de la campaña; la edición dinámica de fechas y metas puede agregarse en la siguiente versión.
- El marcador de metas y los comprobantes de entrega todavía no están implementados.


## Actualización: PATOTÓN TV, cuenta regresiva y totales
Si ya habías ejecutado el SQL anterior, vuelve a ejecutar el `patoton_setup.sql` actualizado en Supabase SQL Editor. Las instrucciones usan `create table if not exists` y políticas `drop policy if exists`, por lo que amplían la instalación anterior.
- PATOTÓN TV: publicar enlaces de YouTube o subir MP4/WebM/MOV desde el panel. Límite de archivo: 50 MB.
- Cuenta regresiva: 25 dic 2026 y 6 ene 2027, zona horaria CDMX.
- Donaciones recaudadas: editar MXN, juguetes, prendas y alimentos desde el panel; Supabase Realtime refleja cambios en la web.
- Para activar Realtime, el SQL agrega las dos tablas a la publicación `supabase_realtime`.
