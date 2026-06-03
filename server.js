// server.js
const express = require('express');
const cors = require('cors');
const conexion = require('./db'); // Conecta con tu archivo db.js

const app = express();
const puerto = 3000;

app.use(cors());
app.use(express.json()); 

// ==========================================
// 1. INSERCIÓN: Registrar un nuevo pago (POST)
// ==========================================
app.post('/api/pagos', (req, res) => {
    const { nombrePago, cantidadPago, metodoPago, codigoConjunto, idResidente } = req.body;

    const sqlQuery = `
        INSERT INTO Pagos_Recibidos (nombre_pago, cantidad_pago, metodo_pago, codigo_conjunto, id_residente) 
        VALUES (?, ?, ?, ?, ?)
    `;

    conexion.query(sqlQuery, [nombrePago, cantidadPago, metodoPago, codigoConjunto, idResidente], (error, resultado) => {
        if (error) {
            console.error('Error al insertar el pago:', error);
            return res.status(500).json({ mensaje: 'Error al registrar el pago' });
        }
        res.status(201).json({ 
            mensaje: 'Pago registrado con éxito', 
            idPago: resultado.insertId 
        });
    });
});

// ==========================================
// 2. CONSULTA: Obtener todos los pagos (GET)
// ==========================================
app.get('/api/pagos', (req, res) => {
    const sqlQuery = `
        SELECT p.id_pago, p.nombre_pago, p.cantidad_pago, p.fecha_pago, p.metodo_pago, c.nombre_conjunto 
        FROM Pagos_Recibidos p
        JOIN Conjuntos c ON p.codigo_conjunto = c.codigo_conjunto
        ORDER BY p.fecha_pago DESC
    `;

    conexion.query(sqlQuery, (error, resultados) => {
        if (error) {
            console.error('Error al consultar los pagos:', error);
            return res.status(500).json({ mensaje: 'Error al obtener los pagos' });
        }
        res.status(200).json(resultados);
    });
});

// ==========================================
// 3. ACTUALIZACIÓN: Modificar un pago existente (PUT)
// ==========================================
app.put('/api/pagos/:id', (req, res) => {
    const idPago = req.params.id;
    const { cantidadPago, metodoPago } = req.body;

    const sqlQuery = `
        UPDATE Pagos_Recibidos 
        SET cantidad_pago = ?, metodo_pago = ? 
        WHERE id_pago = ?
    `;

    conexion.query(sqlQuery, [cantidadPago, metodoPago, idPago], (error, resultado) => {
        if (error) {
            console.error('Error al actualizar el pago:', error);
            return res.status(500).json({ mensaje: 'Error al actualizar' });
        }
        res.status(200).json({ mensaje: 'Pago actualizado correctamente' });
    });
});

// ==========================================
// 4. ELIMINACIÓN: Borrar un pago (DELETE)
// ==========================================
app.delete('/api/pagos/:id', (req, res) => {
    const idPago = req.params.id;
    const sqlQuery = 'DELETE FROM Pagos_Recibidos WHERE id_pago = ?';

    conexion.query(sqlQuery, [idPago], (error, resultado) => {
        if (error) {
            console.error('Error al eliminar el pago:', error);
            return res.status(500).json({ mensaje: 'Error al eliminar' });
        }
        res.status(200).json({ mensaje: 'Pago eliminado' });
    });
});

// Inicializar el servidor
app.listen(puerto, () => {
    console.log(`Servidor de Appmin corriendo en http://localhost:${puerto}`);
});