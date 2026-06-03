// conexion entre la databasr
const mysql = require('mysql2');

// Configuración de la conexión a XAMPP/MySQL
const conexion = mysql.createConnection({
    host: 'localhost',
    user: 'root',      
    password: '',      
    database: 'appmin' 
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