
document.addEventListener('DOMContentLoaded', () => {
    console.log("¡El archivo script.js se ha cargado correctamente!");

    // --- brillo en forms ---
    const formElements = document.querySelectorAll('input, select');

    formElements.forEach(element => {
        
        element.addEventListener('focus', () => {
            element.style.borderColor = '#2ecc71';
            element.style.outline = 'none';
            element.style.boxShadow = '0 0 10px rgba(46, 204, 113, 0.3)';
        });

        
        element.addEventListener('blur', () => {
            element.style.borderColor = '#ccc';
            element.style.boxShadow = 'none';
        });
    }); });

   const formulario = document.getElementById('formularioPago');
const mensaje = document.getElementById('mensajeRespuesta');

if (formulario) {
    formulario.addEventListener('submit', async function(evento) {
        evento.preventDefault(); // Detiene el comportamiento por defecto de recargar la página
        
        console.log("¡Botón presionado! Intentando enviar datos..."); // Para ver si el botón reacciona en consola

        // Recolectamos los valores. Fíjate que los 'id' deben coincidir con tu HTML
        const datos = {
            nombrePago: document.getElementById('nombre').value,
            cantidadPago: document.getElementById('cantidad').value,
            metodoPago: document.getElementById('metodo').value,
            idResidente: document.getElementById('idResidente').value,
            codigoConjunto: document.getElementById('idConjunto').value
        };

        try {
            const respuesta = await fetch('http://localhost:3000/api/pagos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                mensaje.style.color = 'green';
                mensaje.textContent = '¡Pago guardado! Redirigiendo...';
                setTimeout(() => window.location.href = 'exito.html', 1500);
            } else {
                mensaje.style.color = 'red';
                mensaje.textContent = 'Error de la base de datos: ' + resultado.mensaje;
            }
        } catch (error) {
            console.error(error);
            mensaje.style.color = 'red';
            mensaje.textContent = 'Error de conexión. ¿Está encendido tu servidor Node?';
        }
    });
}



// --- MDULO DE CONSULTA, ACTUALIZACIÓN Y ELIMINACIÓN ---
const listaPagos = document.getElementById('listaPagos');

if (listaPagos) {
    // 1. Función para cargar (Consultar)
    async function cargarPagos() {
        try {
            const respuesta = await fetch('http://localhost:3000/api/pagos');
            const pagos = await respuesta.json();
            listaPagos.innerHTML = '';

            if (pagos.length === 0) {
                listaPagos.innerHTML = '<li>No hay pagos registrados aún.</li>';
                return;
            }

            pagos.forEach(pago => {
                const item = document.createElement('li');
                item.innerHTML = `<strong>${pago.nombre_pago}</strong> - $${pago.cantidad_pago} (${pago.metodo_pago}) `;
                
                // Botón Editar
                const btnEditar = document.createElement('button');
                btnEditar.textContent = '✏️ Editar';
                btnEditar.style.padding = '5px 10px';
                btnEditar.style.margin = '0 5px';
                btnEditar.onclick = () => editarPago(pago.id_pago, pago.cantidad_pago, pago.metodo_pago);
                
                // Botón Eliminar
                const btnEliminar = document.createElement('button');
                btnEliminar.textContent = '🗑️ Eliminar';
                btnEliminar.style.padding = '5px 10px';
                btnEliminar.style.backgroundColor = '#ff4d4d';
                btnEliminar.style.color = 'white';
                btnEliminar.onclick = () => eliminarPago(pago.id_pago);

                item.appendChild(btnEditar);
                item.appendChild(btnEliminar);
                listaPagos.appendChild(item);
            });
        } catch (error) {
            console.error('Error al cargar:', error);
            listaPagos.innerHTML = '<li style="color:red;">Error al cargar la base de datos.</li>';
        }
    }

    // 2. Función para Editar (Actualizar)
    async function editarPago(id, cantidadActual, metodoActual) {
        // Pedimos los nuevos datos usando ventanas emergentes simples (prompts)
        const nuevaCantidad = prompt('Ingresa la nueva cantidad:', cantidadActual);
        if (!nuevaCantidad) return; // Si cancela, no hacemos nada

        const nuevoMetodo = prompt('Ingresa el nuevo método (PSE, Tarjeta, etc.):', metodoActual);
        if (!nuevoMetodo) return;

        try {
            const respuesta = await fetch(`http://localhost:3000/api/pagos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cantidadPago: nuevaCantidad, metodoPago: nuevoMetodo })
            });

            if (respuesta.ok) {
                alert('Pago actualizado correctamente');
                cargarPagos(); // Recargamos la lista para ver los cambios
            } else {
                alert('Error al actualizar el pago');
            }
        } catch (error) {
            console.error(error);
        }
    }

    // 3. Función para Eliminar
    async function eliminarPago(id) {
        const confirmar = confirm('¿Estás seguro de que deseas eliminar este pago? Esta acción no se puede deshacer.');
        if (!confirmar) return;

        try {
            const respuesta = await fetch(`http://localhost:3000/api/pagos/${id}`, {
                method: 'DELETE'
            });

            if (respuesta.ok) {
                alert('Pago eliminado de la base de datos');
                cargarPagos(); // Recargamos la lista
            } else {
                alert('Error al eliminar el registro');
            }
        } catch (error) {
            console.error(error);
        }
    }

    // Iniciamos la carga al abrir la página
    cargarPagos();
}