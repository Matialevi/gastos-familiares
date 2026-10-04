# Gastos Familiares

Interfaz mobile-first sin dependencias externas. Incluye login con Supabase Auth, dashboard, alta rápida de gastos, reglas locales de categorización y base PWA.

## Ejecutar

1. Copiar `config.example.js` como `config.js`.
2. Completar únicamente la URL del proyecto y la clave pública `anon`/`publishable` de Supabase. Nunca usar `service_role` en este archivo.
3. Ejecutar `npm run dev` y abrir `http://localhost:4173`.

Sin `config.js`, usar **Ver demo sin iniciar sesión** para recorrer toda la interfaz.

## Integración de datos

El login usa Supabase Auth directamente. El alta real apunta a `public.gastos`; como el esquema SQL exacto no estaba disponible en este espacio de trabajo, el adaptador está aislado en `app.js` para alinear los nombres (`monto`, `concepto`, `fecha`, `ambito`, etc.) con la tabla real. Las reglas automáticas de proveedor están en `rules` y pueden migrarse luego a una tabla administrable.

La clave pública del cliente es segura solo junto con RLS bien configurado. Los secretos administrativos deben vivir exclusivamente en un backend o función server-side.
