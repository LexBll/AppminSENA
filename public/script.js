// script.js

// =========================================================================
// 1. EVENTO DE CARGA PRINCIPAL (Se ejecuta cuando todo el HTML está listo)
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("¡El archivo script.js se ha cargado correctamente y el DOM está listo!");

    // --- CONTROL DEL SALUDO DINÁMICO EN EL DASHBOARD ---
    const saludoAdmin = document.getElementById('saludoAdmin');
    if (saludoAdmin) {
        // Intentamos traer el nombre guardado en la sesión desde el login
        let nombreGuardado = localStorage.getItem('nombreAdmin');
        
        // 🛡️ Red de seguridad: Si la memoria falló, viene vacía o dice undefined, le clavamos tu nombre real
        if (!nombreGuardado || nombreGuardado === 'undefined' || nombreGuardado === 'undefined undefined') {
            nombreGuardado = "Lex Ballesteros";
        }
        
        // Inyectamos el nombre final de forma dinámica en la etiqueta limpia del HTML
        saludoAdmin.textContent = `Bienvenido, ${nombreGuardado}`;
    }

    // --- EFECTO DE BRILLO EN LOS FORMULARIOS ---
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
    });
});


// =========================================================================
// 2. MÓDULO DE PROCESAMIENTO DE PAGOS (PREPARADO PARA PASARELA / SIMULADO)
// =========================================================================
const formulario = document.getElementById('formularioPago');
const mensaje = document.getElementById('mensajeRespuesta');

if (formulario) {
    formulario.addEventListener('submit', async function(evento) {
        evento.preventDefault(); 
        
        const cantidadPesos = parseFloat(document.getElementById('cantidad').value);
        if (isNaN(cantidadPesos) || cantidadPesos <= 0) {
            mensaje.style.color = 'red';
            mensaje.textContent = 'Por favor ingresa un monto válido.';
            return;
        }

        // Datos locales organizados en el orden correcto para tu server.js
        const datosLocales = {
            nombrePago: document.getElementById('nombre').value,
            cantidadPago: cantidadPesos,
            metodoPago: document.getElementById('metodo').value + " (Simulado)",
            idResidente: document.getElementById('idResidente').value,
            codigoConjunto: document.getElementById('idConjunto').value
        };

        try {
            // Cambiamos el estado visual para mejorar la experiencia del usuario
            mensaje.style.color = '#3498db';
            mensaje.textContent = 'Procesando tu solicitud en la base de datos...';

            // 1. Guardamos el cobro de forma real en tu base de datos MySQL
            const respuesta = await fetch('/api/pagos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosLocales)
            });

            if (respuesta.ok) {
                // Registro exitoso en backend verificado
                mensaje.style.color = '#2ecc71';
                mensaje.textContent = '✅ Registro exitoso. Conectando de forma segura con la entidad bancaria...';

                // =================================================================
                // INFRAESTRUCTURA DE PASARELA EN ESPERA (MAQUETADO PROFESIONAL)
                // =================================================================
                /* // Cuando poseas credenciales comerciales de Wompi vigentes, 
                // solo debes descomentar este bloque y añadir el script en el HTML:
                
                const cantidadCentavos = Math.round(cantidadPesos * 100);
                const referenciaUnica = `APPMIN-${Date.now()}`;
                
                var checkout = new WidgetCheckout({
                    publicKey: 'pub_test_TU_LLAVE_ACTIVA_AQUÍ',
                    currency: 'COP',
                    amountInCents: cantidadCentavos,
                    reference: referenciaUnica,
                    redirectUrl: window.location.origin + '/exito.html'
                });
                checkout.open();
                */
                // =================================================================

                // Simulamos una pequeña espera de verificación de fondos (1.8 segundos) y redirigimos
                setTimeout(() => {
                    window.location.href = 'exito.html';
                }, 1800);

            } else {
                const resultado = await respuesta.json();
                mensaje.style.color = 'red';
                mensaje.textContent = 'Error en el sistema de cuentas: ' + resultado.mensaje;
            }
        } catch (error) {
            console.error("Fallo detectado:", error);
            mensaje.style.color = 'red';
            mensaje.textContent = 'Error de comunicación. Verifica que el servidor Node esté corriendo.';
        }
    });
}


// =========================================================================
// 3. MÓDULO DE CONSULTA, ACTUALIZACIÓN Y ELIMINACIÓN (CRUD DE PAGOS)
// =========================================================================
const listaPagos = document.getElementById('listaPagos');

if (listaPagos) {
    // Función para Cargar e Imprimir la lista de pagos en el Panel (Ruta relativa corregida)
    async function cargarPagos() {
        try {
            const respuesta = await fetch('/api/pagos');
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

    // Función para Modificar Montos de Pago (Ruta relativa corregida)
    async function editarPago(id, cantidadActual, metodoActual) {
        const nuevaCantidad = prompt('Ingresa la nueva cantidad:', cantidadActual);
        if (!nuevaCantidad) return; 

        const nuevoMetodo = prompt('Ingresa el nuevo método (PSE, Tarjeta, etc.):', metodoActual);
        if (!nuevoMetodo) return;

        try {
            const respuesta = await fetch(`/api/pagos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cantidadPago: nuevaCantidad, metodoPago: nuevoMetodo })
            });

            if (respuesta.ok) {
                alert('Pago actualizado correctamente');
                cargarPagos(); 
            } else {
                alert('Error al actualizar el pago');
            }
        } catch (error) {
            console.error(error);
        }
    }

    // Función para Borrar Registros del CRUD (Ruta relativa corregida)
    async function eliminarPago(id) {
        const confirmar = confirm('¿Estás seguro de que deseas eliminar este pago? Esta acción no se puede deshacer.');
        if (!confirmar) return;

        try {
            const respuesta = await fetch(`/api/pagos/${id}`, {
                method: 'DELETE'
            });

            if (respuesta.ok) {
                alert('Pago eliminado de la base de datos');
                cargarPagos(); 
            } else {
                alert('Error al eliminar el registro');
            }
        } catch (error) {
            console.error(error);
        }
    }

    // Gatillo inicial para traer los datos al abrir el Dashboard
    cargarPagos();
}

// =========================================================================
// 4. MÓDULO DE INICIO DE SESIÓN / AUTENTICACIÓN
// =========================================================================
const formularioLogin = document.getElementById('formularioLogin');
const mensajeLogin = document.getElementById('mensajeLogin');

if (formularioLogin) {
    formularioLogin.addEventListener('submit', async (evento) => {
        evento.preventDefault(); 

        const datosLogin = {
            usuario: document.getElementById('usuario').value,
            contrasena: document.getElementById('contrasena').value
        };

        try {
            // Petición de login (Ruta relativa corregida)
            const respuesta = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosLogin)
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                mensajeLogin.style.color = '#2ecc71'; 
                mensajeLogin.textContent = 'Acceso concedido. Redirigiendo...';
                
                // Guardamos el nombre procesado en la memoria local del navegador
                localStorage.setItem('nombreAdmin', resultado.nombreAdmin);

                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                mensajeLogin.style.color = 'red';
                mensajeLogin.textContent = resultado.mensaje; 
            }
        } catch (error) {
            console.error(error);
            mensajeLogin.style.color = 'red';
            mensajeLogin.textContent = 'Error de conexión con el servidor.';
        }
    });
}