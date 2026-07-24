// server.js
// Capa de servidor: recibe peticiones HTTP del frontend, las procesa
// y se comunica con la base de datos MySQL a través de db.js.

const express = require('express');
const cors = require('cors');
// bcryptjs: librería para hashear contraseñas. Nunca se almacena la contraseña en texto plano; se guarda un hash irreversible generado con un "salt" aleatorio.
const bcrypt = require('bcryptjs');
// jsonwebtoken: genera y verifica tokens JWT (JSON Web Token), Un JWT es una verificacion firmada que prueba que el usuario inició sesión bien.
const jwt = require('jsonwebtoken');
const conexion = require('./db');

const app = express();
const puerto = process.env.PORT || 3000;

// Clave secreta para firmar y verificar los tokens JWT.
// Mover a una variable de entorno (.env) antes de desplegar en producción.
const JWT_SECRET = 'appmin_clave_secreta_2024';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// =========================================================================
// MIDDLEWARE: verificarToken
// Se ejecuta antes del handler de cada ruta protegida, Si el token es inválido o no existe, rechaza la petición con 401/403
// entonces no abre la base de datos.
function verificarToken(req, res, next) {
    // El cliente envía el token en el header: Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extrae solo el token

    if (!token) return res.status(401).json({ mensaje: 'Acceso denegado. Token requerido.' });

    // jwt.verify valida la firma del token usando JWT_SECRET.
    // Si el token fue alterado o ya expiró (8h), lanza un error.
    jwt.verify(token, JWT_SECRET, (error, admin) => {
        if (error) return res.status(403).json({ mensaje: 'Token inválido o expirado.' });
        // Adjunta los datos del admin (idAdmin, nombreAdmin) al request
        // para que las rutas puedan usarlos si los necesitan.
        req.admin = admin;
        next(); // Continúa al handler de la ruta
    });
}

// =========================================================================
// 1. INSERCIÓN: Registrar un nuevo pago (POST) — protegida con JWT
// =========================================================================
app.post('/api/pagos', (req, res) => {
    const { nombrePago, cantidadPago, metodoPago, codigoConjunto, idResidente } = req.body;
    console.log("➡️ Datos de pago recibidos:", req.body);

    const sqlQuery = `
        INSERT INTO Pagos_Recibidos (nombre_pago, cantidad_pago, metodo_pago, codigo_conjunto, id_residente)
        VALUES (?, ?, ?, ?, ?)
    `;
    // Los ? son parámetros preparados: mysql2 los escapa automáticamente
    // para prevenir inyección SQL.
    conexion.query(sqlQuery, [nombrePago, cantidadPago, metodoPago, codigoConjunto, idResidente], (error, resultado) => {
        if (error) {
            console.error('❌ Error al insertar el pago:', error);
            return res.status(500).json({ mensaje: 'Error interno al registrar el pago' });
        }
        console.log("✅ Pago guardado. ID:", resultado.insertId);
        res.status(201).json({ mensaje: 'Pago registrado con éxito', idPago: resultado.insertId });
    });
});

// =========================================================================
// 2. CONSULTA: Obtener todos los pagos (GET) — protegida con JWT
// =========================================================================
app.get('/api/pagos', verificarToken, (req, res) => {
    // JOIN con la tabla Conjuntos para mostrar el nombre del conjunto
    // en lugar del código numérico.
    const sqlQuery = `
        SELECT p.id_pago, p.nombre_pago, p.cantidad_pago, p.fecha_pago, p.metodo_pago, c.nombre_conjunto
        FROM Pagos_Recibidos p
        JOIN Conjuntos c ON p.codigo_conjunto = c.codigo_conjunto
        ORDER BY p.fecha_pago DESC
    `;

    conexion.query(sqlQuery, (error, resultados) => {
        if (error) {
            console.error('❌ Error al consultar los pagos:', error);
            return res.status(500).json({ mensaje: 'Error al obtener los pagos' });
        }
        res.status(200).json(resultados);
    });
});

// =========================================================================
// 3. ACTUALIZACIÓN: Modificar un pago (PUT) — protegida con JWT
// =========================================================================
app.put('/api/pagos/:id', verificarToken, (req, res) => {
    const idPago = req.params.id; // El ID viene en la URL: /api/pagos/5
    const { cantidadPago, metodoPago } = req.body;

    const sqlQuery = `
        UPDATE Pagos_Recibidos
        SET cantidad_pago = ?, metodo_pago = ?
        WHERE id_pago = ?
    `;

    conexion.query(sqlQuery, [cantidadPago, metodoPago, idPago], (error) => {
        if (error) {
            console.error('❌ Error al actualizar:', error);
            return res.status(500).json({ mensaje: 'Error al actualizar el registro' });
        }
        res.status(200).json({ mensaje: 'Pago actualizado correctamente' });
    });
});

// =========================================================================
// 4. ELIMINACIÓN: Borrar un pago (DELETE) — protegida con JWT
// =========================================================================
app.delete('/api/pagos/:id', verificarToken, (req, res) => {
    const idPago = req.params.id;
    const sqlQuery = 'DELETE FROM Pagos_Recibidos WHERE id_pago = ?';

    conexion.query(sqlQuery, [idPago], (error) => {
        if (error) {
            console.error('❌ Error al eliminar:', error);
            return res.status(500).json({ mensaje: 'Error al eliminar el registro' });
        }
        res.status(200).json({ mensaje: 'Pago eliminado correctamente' });
    });
});

// =========================================================================
// 5. CONJUNTOS: Devuelve todos los conjuntos (GET) — ruta pública
// Usada por pago.html para llenar el dropdown con datos reales de la BD.
// =========================================================================
app.get('/api/conjuntos', (req, res) => {
    conexion.query('SELECT codigo_conjunto, nombre_conjunto FROM Conjuntos', (error, resultados) => {
        if (error) {
            console.error('❌ Error al obtener conjuntos:', error);
            return res.status(500).json({ mensaje: 'Error al obtener los conjuntos' });
        }
        res.status(200).json(resultados);
    });
});

// =========================================================================
// 6. REGISTRO de Administradores (POST) — ruta pública
// Accesible desde la página de login para que un nuevo admin pueda registrarse.
// =========================================================================
app.post('/api/auth/registro', (req, res) => {
    const { nombres, apellidos, telefono, usuario, contrasena } = req.body;
    const codigoConjunto = null;

    // bcrypt.hash genera un hash seguro con 10 rondas de salt.
    // El hash resultante tiene el formato: $2b$10$<salt><hash>
    // Se guarda el hash en la BD, nunca la contraseña en texto plano.
    bcrypt.hash(contrasena, 10, (error, hash) => {
        if (error) {
            console.error('❌ Error al hashear contraseña:', error);
            return res.status(500).json({ mensaje: 'Error al procesar la contraseña' });
        }

        // Columnas corregidas para coincidir con la estructura real de la tabla:
        // nombres, apellidos y telefono como campos separados.
        const sqlQuery = `
            INSERT INTO Administradores (nombres, apellidos, telefono, usuario, contrasena, codigo_conjunto)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        conexion.query(sqlQuery, [nombres, apellidos, telefono, usuario, hash, codigoConjunto], (error) => {
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
});

// =========================================================================
// 6. LOGIN (POST) — ruta pública, no requiere token
// =========================================================================
app.post('/api/auth/login', (req, res) => {
    const { usuario, contrasena } = req.body;

    // Busca al admin solo por usuario. La contraseña NO va en el WHERE porque se debe comparar con bcrypt, no directamente en SQL.
    // También se recupera el hash almacenado para la comparación.
    const sqlQuery = `
        SELECT codigo_admin, contrasena, CONCAT_WS(' ', nombres, apellidos) AS nombre_completo
        FROM administradores
        WHERE usuario = ?
    `;

    conexion.query(sqlQuery, [usuario], (error, resultados) => {
        if (error) {
            console.error('❌ Error en el login:', error);
            return res.status(500).json({ mensaje: 'Error interno en el servidor de autenticación' });
        }

        // Si no existe el usuario, se responde igual que si la contraseña fuera incorrecta para no revelar si el usuario existe o no.
        if (resultados.length === 0) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        const admin = resultados[0]; // resultados es un array; tomamos el primer registro

        // bcrypt.compare toma la contraseña que escribió el usuario y el hash guardado en MySQL, y determina si coinciden sin necesidad de desencriptar (el hash es de una sola vía).
        bcrypt.compare(contrasena, admin.contrasena, (error, match) => {
            if (error || !match) {
                return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
            }

            // Credenciales correctas: se genera un JWT firmado con JWT_SECRET. El payload lleva idAdmin y nombreAdmin (no la contraseña).
            // expiresIn: '8h' hace que el token expire en x horas, obligando al admin a iniciar sesión de nuevo después de ese tiempo.
            const token = jwt.sign(
                { idAdmin: admin.codigo_admin, nombreAdmin: admin.nombre_completo },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            // El token se envía al frontend, que lo guarda en localStorage
            // y lo adjunta en cada petición posterior como Bearer Token.
            res.status(200).json({
                mensaje: 'Autenticación satisfactoria',
                token,
                nombreAdmin: admin.nombre_completo
            });
        });
    });
});

// =========================================================================
// 7. REPORTE MENSUAL: Pagos del mes actual (GET) — protegida con JWT
// =========================================================================
app.get('/api/reporte/mensual', verificarToken, (req, res) => {
    // MONTH() y YEAR() filtran registros del mes y año actuales en MySQL.
    // CURRENT_DATE() devuelve la fecha del servidor sin hora.
    const sqlQuery = `
        SELECT
            p.id_pago,
            p.nombre_pago,
            p.cantidad_pago,
            p.fecha_pago,
            p.metodo_pago,
            c.nombre_conjunto
        FROM Pagos_Recibidos p
        JOIN Conjuntos c ON p.codigo_conjunto = c.codigo_conjunto
        WHERE MONTH(p.fecha_pago) = MONTH(CURRENT_DATE())
        AND YEAR(p.fecha_pago) = YEAR(CURRENT_DATE())
        ORDER BY p.fecha_pago DESC
    `;

    conexion.query(sqlQuery, (error, pagos) => {
        if (error) {
            console.error('❌ Error al generar reporte:', error);
            return res.status(500).json({ mensaje: 'Error al generar el reporte' });
        }

        // Los totales se calculan en el servidor para no exponer lógica de negocio al cliente.
        const totalRecaudado = pagos.reduce((sum, p) => sum + parseFloat(p.cantidad_pago), 0);
        const mes = new Date().toLocaleString('es-CO', { month: 'long', year: 'numeric' });

        res.status(200).json({
            mes,
            totalPagos: pagos.length,
            totalRecaudado,
            pagos
        });
    });
});

app.listen(puerto, () => {
    console.log(`Servidor de Appmin corriendo en http://localhost:${puerto}`);
});
