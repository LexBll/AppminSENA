// server.js

// La unión se hace por tres capas: primero el front, luego el servidor y por último la base de datos

// Importación de frameworks y librerías externas requeridas
const express = require('express'); // framework web para la creación de rutas y manejo de HTTP
const cors = require('cors'); // Librería para habilitar el intercambio de recursos de origen cruzado (Seguridad)
const conexion = require('./db'); // conecta a la base de datos de mysql

// Inicialización de la aplicación Express y definición del puerto del servidor
const app = express();
const puerto = 3000;

// Configuración de Middlewares (Software intermedio de procesamiento)
app.use(cors()); // Habilita peticiones desde el frontend (puertos distintos) es la solución al server local que estamos haciendo. 
app.use(express.json()); // Permite al servidor usar el JSON
app.use(express.static('public')); // Esto le dice a express que busque mi front files en la carpeta public

// =========================================================================
// 1. INSERCIÓN: Registrar un nuevo pago (POST)
// =========================================================================
app.post('/api/pagos', (req, res) => {
    // Captura de datos desde el formulario
    const { nombrePago, cantidadPago, metodoPago, codigoConjunto, idResidente } = req.body;

    // 🚀 CONSOLE.LOG CLAVE: Para auditar en la terminal si los datos entran correctamente desde el navegador
    console.log("➡️ Datos de pago recibidos en el backend:", req.body);

    const sqlQuery = `
        INSERT INTO Pagos_Recibidos (nombre_pago, cantidad_pago, metodo_pago, codigo_conjunto, id_residente) 
        VALUES (?, ?, ?, ?, ?)
    `;

    // 🛡️ CORRECCIÓN DE ORDEN: Sincronizado exactamente con la secuencia que envía tu script.js
    conexion.query(sqlQuery, [nombrePago, cantidadPago, metodoPago, codigoConjunto, idResidente], (error, resultado) => {
        if (error) {
            // 🚀 Si MySQL rechaza el pago, aquí verás el porqué detallado en letras blancas/rojas en VS Code
            console.error('❌ Error detallado al insertar el pago en MySQL:', error);
            return res.status(500).json({ mensaje: 'Error interno al registrar el pago en la base de datos' });
        }
        
        console.log("✅ Pago guardado con éxito en la Base de Datos! ID generado:", resultado.insertId);
        res.status(201).json({ 
            mensaje: 'Pago registrado con éxito', 
            idPago: resultado.insertId 
        });
    });
});

// =========================================================================
// 2. CONSULTA: Obtener todos los pagos (GET)
// =========================================================================
app.get('/api/pagos', (req, res) => {
    // Sentencia SQL con Cláusula JOIN esto debe unir o relacionar el pago con el nombre del conjunto
    const sqlQuery = `
        SELECT p.id_pago, p.nombre_pago, p.cantidad_pago, p.fecha_pago, p.metodo_pago, c.nombre_conjunto 
        FROM Pagos_Recibidos p
        JOIN Conjuntos c ON p.codigo_conjunto = c.codigo_conjunto
        ORDER BY p.fecha_pago DESC
    `;

    // Hace que se lean los datos y si salen bien
    conexion.query(sqlQuery, (error, resultados) => {
        if (error) {
            console.error('❌ Error al consultar los pagos:', error);
            return res.status(500).json({ mensaje: 'Error al obtener los pagos de la base de datos' });
        }
        // Retorna un código 200 (OK) enviando la lista completa en formato JSON al cliente
        res.status(200).json(resultados);
    });
});

// =========================================================================
// 3. ACTUALIZACIÓN: Modificar un pago existente (PUT)
// =========================================================================
app.put('/api/pagos/:id', (req, res) => {
    const idPago = req.params.id;
    const { cantidadPago, metodoPago } = req.body; // Captura de nuevos valores modificados

    const sqlQuery = `
        UPDATE Pagos_Recibidos 
        SET cantidad_pago = ?, metodo_pago = ? 
        WHERE id_pago = ?
    `;

    conexion.query(sqlQuery, [cantidadPago, metodoPago, idPago], (error, resultado) => {
        if (error) {
            console.error('❌ Error al actualizar el pago:', error);
            return res.status(500).json({ mensaje: 'Error al actualizar el registro' });
        }
        res.status(200).json({ mensaje: 'Pago actualizado correctamente' });
    });
});

// =========================================================================
// 4. ELIMINACIÓN: Borrar un pago (DELETE)
// =========================================================================
app.delete('/api/pagos/:id', (req, res) => {
    const idPago = req.params.id; // Toma los datos del idpago para dar un parámetro de registro a eliminar
    const sqlQuery = 'DELETE FROM Pagos_Recibidos WHERE id_pago = ?';

    conexion.query(sqlQuery, [idPago], (error, resultado) => {
        if (error) {
            console.error('❌ Error al eliminar el pago:', error);
            return res.status(500).json({ mensaje: 'Error al eliminar el registro' });
        }
        res.status(200).json({ mensaje: 'Pago eliminado correctamente' });
    });
});

// =========================================================================
// 5. MÓDULO DE AUTENTICACIÓN: Registro de Administradores (POST)
// =========================================================================
app.post('/api/auth/registro', (req, res) => {
    const { usuario, contrasena, nombreCompleto, codigoConjunto } = req.body;

    const sqlQuery = `
        INSERT INTO Administradores (usuario, contrasena, nombre_completo, codigo_conjunto) 
        VALUES (?, ?, ?, ?)
    `;

    // NOTA: supongo que falta encriptar la contraseña
    conexion.query(sqlQuery, [usuario, contrasena, nombreCompleto, codigoConjunto], (error, resultado) => {
        if (error) {
            console.error('❌ Error al registrar administrador:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ mensaje: 'El nombre de usuario ya está en uso' });
            }
            return res.status(500).json({ mensaje: 'Error interno al crear la cuenta' });
        }
        res.status(201).json({ mensaje: 'Cuenta de administrador creada con éxito' });
    });
});

// =========================================================================
// 6. MÓDULO DE AUTENTICACIÓN: Inicio de Sesión / Login (POST)
// =========================================================================
app.post('/api/auth/login', (req, res) => {
    const { usuario, contrasena } = req.body;

    // Usamos CONCAT_WS para unir nombres y apellidos con un espacio desde MySQL
    const sqlQuery = `
        SELECT codigo_admin, CONCAT_WS(' ', nombres, apellidos) AS nombre_completo 
        FROM administradores 
        WHERE usuario = ? AND contrasena = ?
    `;

    conexion.query(sqlQuery, [usuario, contrasena], (error, resultados) => {
        if (error) {
            console.error('❌ Error crítico en el login:', error);
            return res.status(500).json({ mensaje: 'Error interno en el servidor de autenticación' });
        }

        if (resultados.length === 0) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        const adminLogueado = resultados; // Extraemos el primer registro del array
        
        // Ahora el dato viaja limpio bajo la propiedad "nombreAdmin"
        res.status(200).json({
            mensaje: 'Ingreso autorizado',
            idAdmin: adminLogueado.codigo_admin,
            nombreAdmin: adminLogueado.nombre_completo
        });
    });
});

// Inicializar el servidor
app.listen(puerto, () => {
    console.log(`Servidor de Appmin corriendo en http://localhost:${puerto}`);
});