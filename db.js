const mysql = require('mysql2');

// En local usa XAMPP (localhost/root).
// En Railway lee las variables de entorno que se configuran en el dashboard.
const conexion = mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'appmin'
});

// Probando la conexión
conexion.connect((error) => {
    if (error) {
        console.error('Error conectando a la base de datos: ', error);
        return;
    }
    console.log('¡Conexión exitosa a la base de datos de Appmin!');
});

module.exports = conexion;