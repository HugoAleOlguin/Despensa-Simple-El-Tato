import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// DISABLE CACHE
app.disable('etag');
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

// HELPER: TIMEZONE ARGENTINA (UTC-3)
const getArgentinaDate = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset() - 180); // Adjust to UTC then -180 (UTC-3)
    // Actually, simple trick:
    // new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }) -> YYYY-MM-DD
    // But for full ISO we need more.

    // Robust manual shift:
    // 1. Get UTC ms
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    // 2. Client is -3 hours (Summer time? No AR is constant -3)
    const nd = new Date(utc - (3600000 * 3));
    return nd;
};

const getTodayString = () => getArgentinaDate().toISOString().split('T')[0];
const getNowISO = () => getArgentinaDate().toISOString(); // Local ISO time

// --- BACKUP SYSTEM ---
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'Data', 'despensa.db');
const BACKUP_DIR = path.join(__dirname, '..', 'Data', 'Backups');

// Ensure Backup Dir Exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const performBackup = () => {
    try {
        // Use Argentina Time for filename
        const now = getArgentinaDate();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');

        const timestamp = `${yyyy}-${mm}-${dd}_${hh}-${min}`;
        const backupName = `Respaldo_Tato_${timestamp}.db`;

        const dest = path.join(BACKUP_DIR, backupName);
        fs.copyFileSync(DB_PATH, dest);
        console.log(`✅ Backup realizado: ${backupName}`);
    } catch (err) {
        console.error("❌ Error en backup:", err);
    }
};

// Run Backup on Startup
performBackup();

// --- ENDPOINTS ---

// 1. REGISTRAR MOVIMIENTO (Venta / Salida)
app.post('/api/movimiento', (req, res) => {
    const { tipo, monto, detalle, fecha } = req.body;

    // Validation (Relaxed to allow 0 or strict number check)
    if (monto === undefined || monto === null || isNaN(monto)) return res.status(400).json({ error: 'Monto inválido' });
    if (!['VENTA', 'SALIDA', 'PAGO_FIADO', 'INGRESO_DEUDA'].includes(tipo)) return res.status(400).json({ error: 'Tipo inválido' });

    try {
        const queryDate = fecha ? fecha : getTodayString();
        // Use local time for timestamp so it matches the day logically in DB text view if inspected,
        // though standard is UTC. Let's send ISO string of the Local Time to keep it simple and consistent.
        const stmt = db.prepare('INSERT INTO movimientos (tipo, monto, detalle, fecha, timestamp) VALUES (?, ?, ?, ?, ?)');

        // Note: db.js creates table with default CURRENT_TIMESTAMP? We should override it or update schema.
        // If schema has default, we can let it be, but user reported issues. Let's be explicit if possible, 
        // OR rely on the fact that `queryDate` is what separates the "Ticket".
        // Let's passed explicit local timestamp for ordering.
        const info = stmt.run(tipo, Number(monto), detalle || '', queryDate, getNowISO());
        res.json({ success: true, id: info.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. OBTENER RESUMEN DEL DÍA (Personalizado)
app.get('/api/resumen-dia', (req, res) => {
    const { fecha } = req.query;
    const queryDate = fecha ? fecha : getTodayString();

    try {
        const totalVentas = db.prepare("SELECT SUM(monto) as total FROM movimientos WHERE tipo = 'VENTA' AND fecha = ?").get(queryDate);
        const totalSalidas = db.prepare("SELECT SUM(monto) as total FROM movimientos WHERE tipo = 'SALIDA' AND fecha = ?").get(queryDate);
        // Fiados del día (Registrados en deuda_log)
        const totalFiado = db.prepare("SELECT SUM(monto) as total FROM deuda_log WHERE monto > 0 AND fecha = ?").get(queryDate);

        res.json({
            ventas: totalVentas.total || 0,
            salidas: totalSalidas.total || 0,
            fiado_hoy: totalFiado.total || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. CLIENTES - Buscar (Ordenado por ÚLTIMA ACTIVIDAD)
app.get('/api/clientes', (req, res) => {
    const { q } = req.query;

    // Query Base: Traer clientes y su fecha más reciente de deuda (o pago) para ordenar por "Últimos usados"
    // Esto hace que los clientes frecuentes aparezcan arriba
    const queryBase = `
        SELECT c.*, MAX(d.timestamp) as last_activity 
        FROM clientes c 
        LEFT JOIN deuda_log d ON c.id = d.cliente_id 
    `;
    const queryGroup = ` GROUP BY c.id ORDER BY last_activity DESC, c.nombre ASC`;

    if (q) {
        const stmt = db.prepare(`${queryBase} WHERE c.nombre LIKE ? ${queryGroup}`);
        return res.json(stmt.all(`%${q}%`));
    }

    // Si no hay búsqueda, traer todos ordenados por uso reciente
    const stmt = db.prepare(`${queryBase} ${queryGroup}`);
    res.json(stmt.all());
});

// 4. FIADOS - Anotar Deuda
app.post('/api/fiado/nuevo', (req, res) => {
    const { cliente_id, monto, detalle, crear_cliente, nombre_nuevo, fecha } = req.body;

    // Validations (Relaxed)
    if (monto === undefined || monto === null || isNaN(monto)) return res.status(400).json({ error: 'Monto inválido' });
    if (!crear_cliente && !cliente_id) return res.status(400).json({ error: 'Falta cliente' });
    if (crear_cliente && !nombre_nuevo) return res.status(400).json({ error: 'Falta nombre nuevo' });

    const queryDate = fecha ? fecha : getTodayString();

    const registrarDeuda = (idC, m, d) => {
        const transaction = db.transaction(() => {
            // 1. Log deuda (PENDIENTE)
            const timestamp = getNowISO();
            db.prepare('INSERT INTO deuda_log (cliente_id, monto, detalle, fecha, estado, timestamp) VALUES (?, ?, ?, ?, ?, ?)').run(idC, m, d, queryDate, 'PENDIENTE', timestamp);
            // 2. Actualizar saldo cliente
            db.prepare('UPDATE clientes SET deuda_actual = deuda_actual + ? WHERE id = ?').run(m, idC);
        });
        transaction();
    };

    try {
        let finalClienteId = cliente_id;

        if (crear_cliente && nombre_nuevo) {
            // Chequear duplicados antes
            const existe = db.prepare('SELECT id FROM clientes WHERE nombre = ?').get(nombre_nuevo);
            if (existe) return res.status(400).json({ error: 'El cliente ya existe' });

            const info = db.prepare('INSERT INTO clientes (nombre) VALUES (?)').run(nombre_nuevo);
            finalClienteId = info.lastInsertRowid;
        }

        registrarDeuda(finalClienteId, Number(monto), detalle);
        res.json({ success: true, cliente_id: finalClienteId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. DEUDORES - Pagar Item Individual
app.post('/api/fiado/pagar-item', (req, res) => {
    const { item_id, fecha_pago } = req.body;
    if (!item_id) return res.status(400).json({ error: 'ID Item requerido' });

    const queryDate = fecha_pago ? fecha_pago : getTodayString();

    try {
        const transaction = db.transaction(() => {
            const item = db.prepare('SELECT * FROM deuda_log WHERE id = ?').get(item_id);
            if (!item) throw new Error("Item no encontrado");
            if (item.estado === 'PAGADO') throw new Error("Ya está pagado");

            // 1. Marcar como PAGADO
            db.prepare("UPDATE deuda_log SET estado = 'PAGADO' WHERE id = ?").run(item_id);

            // 2. Actualizar saldo cliente (Resta)
            db.prepare('UPDATE clientes SET deuda_actual = deuda_actual - ? WHERE id = ?').run(item.monto, item.cliente_id);

            // 3. Registrar INGRESO PAGO (movimiento)
            db.prepare('INSERT INTO movimientos (tipo, monto, detalle, cliente_id, fecha, timestamp) VALUES (?, ?, ?, ?, ?, ?)').run('PAGO_FIADO', item.monto, `Pago: ${item.detalle}`, item.cliente_id, queryDate, getNowISO());
        });
        transaction();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. DEUDORES - Pagos (Baja Deuda / Entrega)
app.post('/api/fiado/pagar', (req, res) => {
    const { cliente_id, monto } = req.body;
    if (monto === undefined || monto === null || isNaN(monto) || !cliente_id) return res.status(400).json({ error: 'Datos inválidos' });

    try {
        const transaction = db.transaction(() => {
            // 1. Log deuda (Pago = monto negativo)
            const timestamp = getNowISO();
            db.prepare('INSERT INTO deuda_log (cliente_id, monto, detalle, estado, timestamp) VALUES (?, ?, ?, ?, ?)').run(cliente_id, -Number(monto), 'Entrega Dinero', 'PAGADO', timestamp);
            // 2. Actualizar saldo cliente (Resta)
            db.prepare('UPDATE clientes SET deuda_actual = deuda_actual - ? WHERE id = ?').run(Number(monto), cliente_id);
            // 3. Registrar INGRESO PAGO (movimiento de caja)
            const today = getTodayString();
            db.prepare('INSERT INTO movimientos (tipo, monto, detalle, fecha, timestamp) VALUES (?, ?, ?, ?, ?)').run('INGRESO_DEUDA', Number(monto), 'Entrega Cliente', today, timestamp);
        });
        transaction();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. ACTUALIZAR CLIENTE (Teléfono)
app.put('/api/clientes/:id', (req, res) => {
    const { id } = req.params;
    const { telefono } = req.body;
    try {
        db.prepare('UPDATE clientes SET telefono = ? WHERE id = ?').run(telefono, id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8. OBTENER MOVIMIENTOS DEL DÍA (Ticket Persistente + Fiados)
app.get('/api/movimientos-dia', (req, res) => {
    const { fecha } = req.query;
    const queryDate = fecha ? fecha : getTodayString();
    try {
        // 1. Movimientos de Caja (Venta, Salida, Ingreso Pago)
        const caja = db.prepare('SELECT id, tipo, monto, detalle, timestamp, NULL as cliente_nombre FROM movimientos WHERE fecha = ?').all(queryDate);

        // 2. Movimientos de Fiado (Nuevas Deudas)
        const fiados = db.prepare(`
            SELECT d.id, 'NUEVO_FIADO' as tipo, d.monto, d.detalle, d.timestamp, c.nombre as cliente_nombre 
            FROM deuda_log d
            JOIN clientes c ON d.cliente_id = c.id
            WHERE d.fecha = ? AND d.monto > 0
        `).all(queryDate);

        // 3. Fusionar y Ordenar
        const combined = [...caja, ...fiados].sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        res.json(combined);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9. BORRAR TRANSACCIÓN (Corrección de Errores)
app.delete('/api/transaccion', (req, res) => {
    const { id, tipo } = req.body;

    try {
        const transaction = db.transaction(() => {
            if (tipo === 'NUEVO_FIADO') {
                // Es un registro en deuda_log
                const item = db.prepare('SELECT * FROM deuda_log WHERE id = ?').get(id);
                if (!item) throw new Error("Item no encontrado");

                // Revertir deuda en cliente
                db.prepare('UPDATE clientes SET deuda_actual = deuda_actual - ? WHERE id = ?').run(item.monto, item.cliente_id);

                // Borrar log
                db.prepare('DELETE FROM deuda_log WHERE id = ?').run(id);

            } else if (tipo === 'VENTA' || tipo === 'SALIDA') {
                // Es un registro en movimientos
                db.prepare('DELETE FROM movimientos WHERE id = ?').run(id);
            } else {
                // Pagos y otros complejos: Por seguridad, por ahora solo borramos el registro visual
                // si es un movimiento simple. Si es pago complejo, mejor no tocar para no romper consistencia
                // sin lógica de reversión estricta.
                // PERO el usuario quiere corregir tipeo. Si anotó un pago mal, también querrá borrarlo.
                // Riesgo: Desincronización. Bloqueemos por ahora o permitamos solo borrado simple.
                // Decisión: Permitir borrar MOVIMIENTO de pago, pero advertir que no restaura deuda (complicado).
                // Mejor: Bloquear en frontend. Aquí solo manejar lo seguro.
                throw new Error("No se puede borrar este tipo de movimiento automáticamente.");
            }
        });
        transaction();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 10. DEUDORES - Ver Historial Detallado
app.get('/api/deudores/:id/historial', (req, res) => {
    const { id } = req.params;
    try {
        // Ordenado del más reciente al antiguo
        const historial = db.prepare('SELECT * FROM deuda_log WHERE cliente_id = ? ORDER BY timestamp DESC').all(id);
        res.json(historial);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 11. HISTORIAL GENERAL DE DÍAS (Cierres pasados)
app.get('/api/historial-dias', (req, res) => {
    try {
        // Agrupar movimientos por FECHA
        const dias = db.prepare(`
            SELECT 
                fecha,
                SUM(CASE WHEN tipo = 'VENTA' THEN monto ELSE 0 END) as ventas,
                SUM(CASE WHEN tipo = 'SALIDA' THEN monto ELSE 0 END) as salidas,
                SUM(CASE WHEN tipo = 'PAGO_FIADO' THEN monto ELSE 0 END) as pagos_fiados
            FROM movimientos
            GROUP BY fecha
            ORDER BY fecha DESC
            LIMIT 30
        `).all();

        // Para saber cuánto se fío cada día, consultamos deuda_log
        const fiadosPorDia = db.prepare(`
            SELECT fecha, SUM(monto) as total_fiado 
            FROM deuda_log 
            WHERE monto > 0 
            GROUP BY fecha
            ORDER BY fecha DESC
            LIMIT 30
        `).all();

        // Combinar datos
        const reporte = dias.map(d => {
            const fiadoData = fiadosPorDia.find(f => f.fecha === d.fecha);
            return {
                ...d,
                fiado: fiadoData ? fiadoData.total_fiado : 0
            };
        });

        res.json(reporte);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🔥 Servidor corriendo en http://localhost:${PORT}`);
});
