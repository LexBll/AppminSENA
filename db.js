const mysql = require('mysql2');

// Railway expone MYSQLHOST/MYSQLUSER/etc. automáticamente.
// En local (XAMPP) usa los valores por defecto.
const pool = mysql.createPool({
    host:     process.env.MYSQLHOST     || process.env.DB_HOST     || 'localhost',
    port:     process.env.MYSQLPORT     || process.env.DB_PORT     || 3306,
    user:     process.env.MYSQLUSER     || process.env.DB_USER     || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME     || 'appmin',
    waitForConnections: true,
    connectionLimit:    10
});

pool.getConnection((error, connection) => {
    if (error) {
        console.error('Error conectando a la base de datos:', error.message);
        return;
    }
    console.log('¡Conexión exitosa a la base de datos de Appmin!');
    connection.release();
});

module.exports = pool;
