const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcryptjs");

const dbPath = path.join(__dirname, "skillconnect.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log("Connected to SQLite database");
    }
});

db.serialize(() => {

    // =====================================================
    // BENEFICIARIES TABLE
    // =====================================================
    db.run(`
        CREATE TABLE IF NOT EXISTS beneficiaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            gender TEXT,
            age INTEGER,
            idNumber TEXT,
            sublocation TEXT,
            primarySkill TEXT,
            otherSkills TEXT,
            educationLevel TEXT,
            certificate TEXT,
            disability TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME
        )
    `);

    // =====================================================
    // ADMINS TABLE (WITH ROLE SUPPORT)
    // =====================================================
    db.run(`
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'viewer',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // =====================================================
    // AUTO ADD MISSING COLUMNS (SAFE MIGRATION)
    // Prevents DB deletion in future upgrades
    // =====================================================
    const addColumnIfNotExists = (table, column, definition) => {
        db.all(`PRAGMA table_info(${table})`, [], (err, columns) => {
            if (err) return;

            const exists = columns.some(col => col.name === column);

            if (!exists) {
                db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
                console.log(`Column '${column}' added to ${table}`);
            }
        });
    };

    addColumnIfNotExists("beneficiaries", "updated_at", "DATETIME");
    addColumnIfNotExists("admins", "role", "TEXT DEFAULT 'viewer'");

    // =====================================================
    // INSERT DEFAULT SUPER ADMIN (IF NOT EXISTS)
    // =====================================================
    const defaultUsername = "admin";
    const defaultPassword = bcrypt.hashSync("admin123", 10);

    db.get(
        "SELECT * FROM admins WHERE username = ?",
        [defaultUsername],
        (err, row) => {

            if (!row) {
                db.run(
                    "INSERT INTO admins (username, password, role) VALUES (?, ?, ?)",
                    [defaultUsername, defaultPassword, "superadmin"],
                    (err) => {
                        if (err) {
                            console.error("Error creating default admin:", err.message);
                        } else {
                            console.log("Default Super Admin created");
                        }
                    }
                );
            }
        }
    );

});

module.exports = db;