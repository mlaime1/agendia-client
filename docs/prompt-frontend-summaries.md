# Prompt — Frontend módulo Summaries

## Contexto general
App de gestión de viajes para un chofer. El flujo principal parte siempre desde un cliente seleccionado. Desde ese cliente se accede a todo: viajes, resúmenes, configuración. El módulo de summaries es el corazón de la facturación: agrupa los viajes de un período y genera un PDF para enviarle al cliente.

## Stack frontend
(Completar con el stack que uses: React, Next.js, Vue, etc.)
La API responde siempre con `{ success: true, data }` o `{ success: false, message }`.
Todos los IDs vienen como `string` (son BigInt en la BD).

---

## Pantallas a implementar

### 1. Lista de summaries del cliente
**Ruta sugerida:** `/clients/:clientId/summaries`

Muestra todos los resúmenes del cliente ordenados por fecha descendente.

**Qué mostrar por cada summary:**
- Período: `01/05/2026 — 31/05/2026`
- Tipo de ciclo: badge `Semanal` / `Quincenal` / `Mensual`
- Total de viajes y monto total: `25 viajes · $187.500`
- Status con color diferenciado:
  - `draft` → gris — Borrador
  - `sent` → azul — Enviado
  - `paid` → verde — Abonado
  - `archived` → gris oscuro — Archivado
- Acciones rápidas por fila: Ver detalle · Descargar PDF · Cambiar estado

**Endpoint:** `GET /summaries/client/:clientId`

---

### 2. Botón / modal "Generar resumen"
Desde la lista de summaries, un botón principal "Generar resumen".

**Flujo al hacer clic:**

**Paso 1 — Preview automático**
Llamar a `GET /summaries/preview/:clientId` antes de mostrar el modal.
Mostrar al usuario:
```
Período detectado: 01/05/2026 → 31/05/2026  (Mensual)
Viajes disponibles: 25
```
Si `available_trips === 0`, mostrar aviso: "No hay viajes sin resumen para este período" y deshabilitar la confirmación.

**Paso 2 — Confirmación**
El modal tiene:
- El período y viajes del preview (solo lectura)
- Campo opcional: Notas
- Toggle opcional: "Usar rango manual" → muestra dos datepickers (period_start / period_end)
- Botón "Generar"

**Paso 3 — Generación**
- Si es automático: `POST /summaries/auto/:clientId` con `{ driver_id, notes? }`
- Si es manual: `POST /summaries` con `{ client_id, driver_id, period_start, period_end, notes? }`
- Al éxito: cerrar modal, refrescar lista, mostrar toast "Resumen generado"

---

### 3. Detalle del summary
**Ruta sugerida:** `/clients/:clientId/summaries/:summaryId`

**Header:**
- Cliente, chofer, período, tipo de ciclo
- Status badge con botones de transición (ver sección de estados)
- Botón "Descargar PDF" → `GET /summaries/:id/pdf` (forzar descarga)

**Cuerpo — viajes agrupados por día:**
```
Lunes 05/05
  2 viajes — Ida             $15.000
  1 viaje  — Ida y vuelta     $4.500
                 Subtotal:   $19.500

Martes 06/05
  3 viajes — Ida             $22.500
  ...
```
Los datos vienen en `summary.trips[]`. El frontend debe agrupar por `trip_date` (solo fecha, ignorar hora) y dentro de cada día agrupar por `trip_type`. Sumar `final_price` por grupo.

**Footer:**
- Total de viajes
- Total a abonar (destacado)

---

### 4. Gestión de estados
El status fluye así:
```
draft → sent → paid
             ↘ archived
```

Mostrar acciones contextuales según el estado actual:

| Estado actual | Acciones disponibles |
|---|---|
| `draft` | "Marcar como enviado" / "Eliminar" |
| `sent` | "Marcar como abonado" / "Archivar" |
| `paid` | "Archivar" |
| `archived` | — (solo lectura) |

Cada acción llama a `PATCH /summaries/:id/status` con el status correspondiente.
Pedir confirmación antes de cualquier cambio de estado.

---

## Endpoints de la API

```
POST   /summaries                        → crear manual
POST   /summaries/auto/:clientId         → crear automático
GET    /summaries/preview/:clientId      → preview del período (?date=YYYY-MM-DD opcional)
GET    /summaries/client/:clientId       → listar por cliente
GET    /summaries/:id                    → detalle con trips incluidos
GET    /summaries/:id/pdf                → descargar PDF (response: application/pdf)
PATCH  /summaries/:id/status             → { status: "sent" | "paid" | "archived" }
DELETE /summaries/:id                    → eliminar (solo en draft)
```

---

## Tipos de respuesta relevantes

```ts
// GET /summaries/preview/:clientId
{
  client: string
  billing_cycle: "weekly" | "biweekly" | "monthly"
  period_start: string   // ISO date
  period_end: string     // ISO date
  period_type: string
  available_trips: number
}

// GET /summaries/:id  (y resto de endpoints que devuelven summary)
{
  id: string
  period_start: string
  period_end: string
  period_type: string
  total_trips: number
  total_amount: string   // Decimal viene como string
  status: "draft" | "sent" | "paid" | "archived"
  sent_at: string | null
  paid_at: string | null
  archived_at: string | null
  notes: string | null
  clients: { id: string, nombre: string }
  users: { id: string, name: string }
  trips: Trip[]
}

// Trip dentro del summary
{
  id: string
  trip_date: string      // ISO datetime — usar solo la fecha para agrupar
  trip_type: string      // "ida" | "vuelta" | "ida y vuelta" | (special_type si aplica)
  final_price: string    // Decimal como string
  has_surcharge: boolean
  surcharge_reason: string | null
  special_type: string | null
  routes: { id: string, name: string | null }
}
```

---

## Notas de UX

- El PDF se descarga directo desde el navegador: hacer `window.open('/summaries/:id/pdf')` o un `<a href=... download>`.
- Los montos vienen como string (Decimal de Prisma). Parsear con `parseFloat` para operar y formatear con `toLocaleString('es-AR')` para mostrar.
- Las fechas vienen en ISO. Mostrar siempre en formato `DD/MM/YYYY`.
- El agrupamiento de trips por día debe hacerse en el frontend: tomar `trip_date`, extraer solo la fecha (sin hora), agrupar y sumar.
- Si `special_type` tiene valor, mostrar `Especial (${special_type})` en lugar de `trip_type`.
- En mobile, la lista de summaries puede ser una lista de cards en lugar de tabla.


## Cómo funciona billing_cycle de punta a punta
1. Se guarda en el cliente
Cada cliente tiene su ciclo configurado en la BD:

client id:1  →  billing_cycle: "weekly",   billing_day: 1        (factura cada lunes)
client id:2  →  billing_cycle: "biweekly", billing_start_date: "2026-05-01"
client id:3  →  billing_cycle: "monthly",  billing_day: 1        (factura el 1 de cada mes)
2. Al generar un summary automático
Cuando llamás a POST /summaries/auto/:clientId, el service hace esto:

1. Busca el cliente en la BD → lee billing_cycle, billing_day, billing_start_date
2. Pasa esos datos a calculateBillingPeriod(client, hoy)
3. El helper devuelve { period_start, period_end, period_type }
4. Con ese rango busca los trips del cliente que no tengan summary_id
5. Crea el summary y vincula esos trips
3. Qué calcula calculateBillingPeriod según el ciclo
weekly — billing_day: 1 (lunes)

Hoy: miércoles 14/05
↓
Último lunes que pasó: 12/05  → ese es el period_end
period_start: 06/05 (7 días antes)
Resultado: 06/05 → 12/05
Siempre devuelve la semana ya cerrada. Si hoy es lunes (el día de corte), devuelve la semana anterior porque la actual acaba de empezar.

biweekly — billing_start_date: 01/05

Hoy: 16/05
Días desde el ancla: 15 días → 1 ciclo completo de 14 días cerrado
Resultado: 01/05 → 14/05

Hoy: 30/05
Días desde el ancla: 29 días → 2 ciclos completos
Resultado: 15/05 → 28/05
monthly — billing_day: 1

Hoy: 14/05
El ciclo actual empezó el 01/05 y cierra el 31/05 → todavía no cerró
Devuelve el anterior: 01/04 → 30/04
4. Impacto directo en el summary
El rango que devuelve el helper determina qué trips se incluyen:

ts
trips = await prisma.trips.findMany({
  where: {
    client_id: clientId,
    summary_id: null,        // ← solo trips sin resumen aún
    trip_date: {
      gte: period_start,
      lte: period_end,       // ← acotado por el período calculado
    }
  }
})
Entonces si un trip quedó fuera del rango (por fecha) o ya tiene summary_id, no se incluye.

5. El caso edge más importante
¿Qué pasa si generás el summary antes de que cierre el período? No pasa porque el helper siempre devuelve el período ya cerrado. Si el mes actual todavía no terminó, te da el mes anterior. Nunca te da el período en curso.

¿Qué pasa si hay trips del período pero ya tienen summary_id? Se ignoran. Eso evita duplicar trips en dos summaries distintos.

¿Qué pasa si generás dos veces el mismo período? El service tiene una validación que busca si ya existe un summary con el mismo client_id + period_start + period_end y tira error antes de crear.

Resumen visual
billing_cycle + billing_day/billing_start_date
        ↓
calculateBillingPeriod(client, hoy)
        ↓
{ period_start, period_end }
        ↓
trips WHERE client_id = X AND summary_id IS NULL AND trip_date BETWEEN start AND end
        ↓
summary creado con esos trips vinculados