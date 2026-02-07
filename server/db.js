import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DEFINICIÓN DE LA RUTA DE DATOS (FUERA DEL CÓDIGO)
const DATA_DIR = path.resolve(__dirname, '../Data');
const DB_PATH = path.join(DATA_DIR, 'despensa.db');

// Asegurar que existe el directorio
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

console.log('🔌 Conectando a Base de Datos en:', DB_PATH);

// Custom Logger para mejor orden
const logQuery = (query) => {
    // Limpiar espacios extra y saltos de línea
    const cleanQuery = query.replace(/\s+/g, ' ').trim();

    // Diferenciar lecturas de escrituras visualmente (Simple Check)
    const isWrite = /^(INSERT|UPDATE|DELETE)/i.test(cleanQuery);
    const prefix = isWrite ? '📝 [DB WRITE]' : '🔍 [DB READ] ';

    // (Opcional: Colores ANSI si la consola lo soporta, Windows 10+ sí)
    // Write: Amarillo/Dorado, Read: Gris Oscuro/Dim
    if (isWrite) {
        console.log(`\x1b[33m${prefix} ${cleanQuery}\x1b[0m`);
    } else {
        console.log(`\x1b[90m${prefix} ${cleanQuery.substring(0, 100)}${cleanQuery.length > 100 ? '...' : ''}\x1b[0m`);
    }
};

const db = new Database(DB_PATH, { verbose: logQuery });

// Inicialización de Tablas
const initDB = () => {
    // OPTIMIZACIÓN RENDIMIENTO: WAL Mode + Synchronous Normal
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');

    // Tabla: Movimientos
    db.exec(`.
        CREATE TABLE IF NOT EXISTS movimientos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT CHECK(tipo IN ('VENTA', 'SALIDA', 'PAGO_FIADO')),
            monto INTEGER NOT NULL,
            detalle TEXT,
            fecha DATE DEFAULT (date('now', 'localtime')),
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            cliente_id INTEGER
        )
    `);

    // INDEXES MOVIMIENTOS (Critical for performance on low-end PC)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos(fecha)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos(tipo)`);

    // Tabla: Clientes
    db.exec(`
        CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT UNIQUE NOT NULL,
            telefono TEXT,
            deuda_actual INTEGER DEFAULT 0
        )
    `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre)`);

    // TABLA: Historial Fiados (deuda_log)
    db.exec(`
        CREATE TABLE IF NOT EXISTS deuda_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente_id INTEGER NOT NULL,
            monto INTEGER NOT NULL,
            detalle TEXT,
            fecha DATE DEFAULT (date('now', 'localtime')),
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            estado TEXT DEFAULT 'PENDIENTE', -- PENDIENTE | PAGADO
            FOREIGN KEY(cliente_id) REFERENCES clientes(id)
        )
    `);
    // INDEXES DEUDA_LOG
    db.exec(`CREATE INDEX IF NOT EXISTS idx_deuda_cliente ON deuda_log(cliente_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_deuda_fecha ON deuda_log(fecha)`);

    // Migración manual: Agregar columnas si no existen (para evitar borrar la DB)
    try { db.exec("ALTER TABLE deuda_log ADD COLUMN estado TEXT DEFAULT 'PENDIENTE'"); } catch (e) { }
    try { db.exec("ALTER TABLE movimientos ADD COLUMN fecha_op DATE"); } catch (e) { } // Por si acaso queramos fecha real vs log

    console.log('✅ Tablas inicializadas e Índices optimizados');
};

initDB();

export default db;
