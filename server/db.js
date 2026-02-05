import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DEFINICIÓN DE LA RUTA DE DATOS (FUERA DEL CÓDIGO)
const DATA_DIR = path.resolve(__dirname, '../../Data');
const DB_PATH = path.join(DATA_DIR, 'despensa.db');

// Asegurar que existe el directorio
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

console.log('🔌 Conectando a Base de Datos en:', DB_PATH);
const db = new Database(DB_PATH, { verbose: console.log });

// Inicialización de Tablas
const initDB = () => {
    // Tabla: Movimientos
    db.exec(`
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

    // Tabla: Clientes
    db.exec(`
        CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT UNIQUE NOT NULL,
            telefono TEXT,
            deuda_actual INTEGER DEFAULT 0
        )
    `);

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

    // Migración manual: Agregar columnas si no existen (para evitar borrar la DB)
    try { db.exec("ALTER TABLE deuda_log ADD COLUMN estado TEXT DEFAULT 'PENDIENTE'"); } catch (e) { }
    try { db.exec("ALTER TABLE movimientos ADD COLUMN fecha_op DATE"); } catch (e) { } // Por si acaso queramos fecha real vs log

    console.log('✅ Tablas inicializadas');
};

initDB();

export default db;
