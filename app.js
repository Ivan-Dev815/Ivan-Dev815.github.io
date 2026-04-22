/***********************
 * Credenciales de accesos al login
 ***********************/
const USERS = {
  "Rosa Mata": "0874",
  "Juan Mata": "2004"
};

const SESSION_KEY = 'usuarioLogueado';
const CURRENT_USER_KEY = 'usuarioActual';

/************************
 * VARIABLES GLOBALES
 **********************/
let prestamos = [];
let prestamoActivo = null;

let STORAGE_KEY = '';

/*****************
 * LOCAL STORAGE
 ****************/

function guardarDatos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prestamos));
}

function cargarDatos() {
  const data = localStorage.getItem(STORAGE_KEY);
  
  if (data) {
    prestamos = JSON.parse(data).map(p => ({
      ...p,
      pagos: p.pagos || []
    }));
  }

  prestamoActivo = null;

  renderListaPrestamos();
  render();
}

/****************
 * UTILIDADES
 ***************/

// Formatea números con separador de miles
function formatearPesos(valor) {
  return valor
    .replace(/\D/g, '')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/****************
 * MENSAJES UX
 ***************/
function mostrarMensaje(texto, tipo = 'ok') {
  const mensaje = document.getElementById('mensajeApp');
  mensaje.textContent = texto;
  mensaje.classList.remove('hidden', 'error');

  if (tipo === 'error') mensaje.classList.add('error');

  setTimeout(() => {
    mensaje.classList.add('hidden');
  }, 3000);
}

/*******************
 * LISTA DE PRÉSTAMOS
 *******************/
function renderListaPrestamos() {
  const lista = document.getElementById('listaPrestamos');
  lista.innerHTML = '';

  const buscador = document.getElementById('buscarPrestamo');

  // Obtener texto del buscador
  const filtro = document.getElementById('buscarPrestamo')?.value?.toLowerCase() || '';

  if (prestamos.length === 0) {
    lista.innerHTML = '<p>No hay préstamos registrados.<br>Agrega tu primer préstamo para comenzar.</p>';

    // Ocultar buscador si no hay datos
    buscador.classList.add('hidden');

    return;
  }

  // Filtrar préstamos por nombre
  const prestamosFiltrados = prestamos.filter(p =>
    p.nombre.toLowerCase().includes(filtro)
  );

  // Sin resultados
  if (prestamosFiltrados.length === 0) {
    lista.innerHTML = '<p>No se encontraron resultados</p>';
    return
  }
  // Mostrar buscador si hay datos
  buscador.classList.remove('hidden');

  prestamosFiltrados.forEach(p => {
    const pagado = p.capitalActual <= 0;

    const div = document.createElement('div');
    const seleccionado = prestamoActivo && prestamoActivo.id === p.id;

    div.className = `
      card-prestamo
      ${pagado ? 'pagado' : 'activo'}
      ${seleccionado ? 'seleccionado' : ''}
    `;

    div.innerHTML = `
      <strong>${p.nombre}</strong>
      <span class="estado">${pagado ? 'Pagado' : 'Activo'}</span>
      <p>Capital pendiente: $${p.capitalActual.toLocaleString('es-CO')}</p>
      <p>Interés mensual: ${p.interes}%</p>
    `;

    div.addEventListener('click', () => seleccionarPrestamo(p.id));

    lista.appendChild(div);
  });
}

/*******************
 * SELECCIONAR PRÉSTAMO
 *******************/
function seleccionarPrestamo(id) {
  // Si hago clic en el mismo préstamo activo -> deseleccionar
  if (prestamoActivo && prestamoActivo.id === id) {
    prestamoActivo = null;
  } else {
    // Si es otro préstamo -> seleccionarlo
    prestamoActivo = prestamos.find(p => p.id === id);
  }
  
  renderListaPrestamos();
  render();
}

/*******************
 * RENDER PRINCIPAL
 ******************/
function render() {
  const resultado = document.getElementById('resultado');
  const seccionPagos = document.getElementById('seccionPagos');
  const mensajeSinPrestamo = document.getElementById('mensajeSinPrestamo');
  const btnEliminar = document.getElementById('btnEliminar');

  if (!prestamoActivo) {
    resultado.innerHTML = '';
    seccionPagos.classList.add('hidden');
    btnEliminar.classList.add('hidden');

    if (prestamos.length > 0) {
      mensajeSinPrestamo.classList.remove('hidden');
    } else {
      mensajeSinPrestamo.classList.add('hidden');
    }
    
    return;
  }

  seccionPagos.classList.remove('hidden');
  mensajeSinPrestamo.classList.add('hidden');
  btnEliminar.classList.remove('hidden');

  const interesMensual = prestamoActivo.capitalActual * prestamoActivo.interes / 100;

  let html = `
    <h3>Cliente: ${prestamoActivo.nombre}</h3>
    <p class="capital-pendiente">
      💼 Capital Pendiente: $${prestamoActivo.capitalActual.toLocaleString('es-CO')}
    </p>
    <p><strong>Interés mensual (${prestamoActivo.interes}%):</strong> 
      $${interesMensual.toLocaleString('es-CO')}
    </p>
    <p><strong>Fecha del préstamo:</strong> ${prestamoActivo.fecha}</p>

    <h4>Historial de pagos</h4>
  `;

  if (prestamoActivo.pagos.length === 0) {
    html += `<p class="mensaje">Aún no se han registrado pagos.</p>`;
  } else {
    html += '<ul>';
    prestamoActivo.pagos.forEach(pago => {
      html += `
        <li>
          Fecha: ${pago.fecha} |
          Interés: $${pago.interes.toLocaleString('es-CO')} |
          Capital: $${pago.capital.toLocaleString('es-CO')}
        </li>
      `;
    });
    html += '</ul>';
  }

  resultado.innerHTML = html;
}

/***********************
 * EVENTOS
 ***********************/

// Buscador
document.getElementById('buscarPrestamo').addEventListener('input', () => {
  renderListaPrestamos();
});
// Abrir formulario de prestamos con boton
document.getElementById('btnNuevoPrestamo').addEventListener('click', () => {
  const form = document.getElementById('loanForm');
  form.classList.toggle('hidden');

  if (!form.classList.contains('hidden')) {
    document.getElementById('nombre').focus();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// Formateo capital
document.getElementById('capital').addEventListener('input', function () {
  this.value = formatearPesos(this.value);
});

// NUEVO PRÉSTAMO
document.getElementById('loanForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const interesValor = Number(document.getElementById('interes').value);

  if (isNaN(interesValor) || interesValor < 1 || interesValor > 20) {
    mostrarMensaje('⚠️ El interés debe estar entre 1% y 20%', 'error');
    return;
  }

  const nuevoPrestamo = {
    id: Date.now(),
    nombre: document.getElementById('nombre').value,
    capitalInicial: Number(document.getElementById('capital').value.replace(/\./g, '')),
    capitalActual: Number(document.getElementById('capital').value.replace(/\./g, '')),
    interes: interesValor,
    fecha: document.getElementById('fecha').value,
    pagos: []
  };

  prestamos.push(nuevoPrestamo);
  prestamoActivo = nuevoPrestamo;

  guardarDatos();
  mostrarMensaje('✅ Préstamo creado');
  renderListaPrestamos();
  render();

  // Limpiar y ocultar formulario de prestamos
  document.getElementById('loanForm').reset(); 
  document.getElementById('loanForm').classList.add('hidden');
});

// REGISTRAR PAGO
document.getElementById('paymentForm').addEventListener('submit', function (e) {
  e.preventDefault();

  if (!prestamoActivo) return;

  if (prestamoActivo.capitalActual <= 0) {
    mostrarMensaje('✅ Este préstamo ya está pagado', 'error');
    return;
  }

  const pagoCapital = Number(document.getElementById('pagoCapital').value) || 0;
  const pagoInteres = Number(document.getElementById('pagoInteres').value) || 0;

  if (pagoCapital === 0 && pagoInteres === 0) {
    mostrarMensaje('⚠️ Debes ingresar un valor', 'error');
    return;
  }

  if (pagoCapital > prestamoActivo.capitalActual) {
    mostrarMensaje('❌ El pago supera el capital', 'error');
    return;
  }

  prestamoActivo.capitalActual -= pagoCapital;

  prestamoActivo.pagos.push({
    fecha: new Date().toISOString().split('T')[0],
    interes: pagoInteres,
    capital: pagoCapital
  });

  guardarDatos();
  mostrarMensaje('💰 Pago registrado');
  renderListaPrestamos();
  render();

  document.getElementById('pagoCapital').value = 0;
  document.getElementById('pagoInteres').value = 0;
  document.getElementById('pagoInteres').focus();
});

/*************************
 * ELIMINAR PRÉSTAMO
 *************************/
document.getElementById('btnEliminar').addEventListener('click', function () {
  if (!prestamoActivo) return;

  const confirmar = confirm('¿Estas seguro que deseas eliminar este préstamo?');
  if (!confirmar) return;

  prestamos = prestamos.filter(p => p.id !== prestamoActivo.id);
  prestamoActivo = null;

  guardarDatos();
  mostrarMensaje('🗑 Préstamo eliminado');
  renderListaPrestamos();
  render();
});

/***********************
 * LOGIN LOGIC
 ***********************/
const loginSection = document.getElementById('loginSection');
const appSection = document.getElementById('misPrestamos');

function verificarSesion() {
  const logueado = localStorage.getItem(SESSION_KEY);
  const usuarioActual = localStorage.getItem(CURRENT_USER_KEY);

  if (logueado === 'true' && usuarioActual) {
    STORAGE_KEY = `controlPrestamos_${usuarioActual}`;
    
    // MIGRACIÓN AUTOMÁTICA SI EXISTEN DATOS ANTIGUOS
    const datosAntiguos = localStorage.getItem('controlPrestamos');
    const datosNuevoUsuario = localStorage.getItem(STORAGE_KEY);

    if (datosAntiguos && !datosNuevoUsuario) {
    localStorage.setItem(STORAGE_KEY, datosAntiguos);
    }
    
    loginSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    cargarDatos();
    mostrarModalSiEsNecesario();
  } else {
    loginSection.classList.remove('hidden');
    appSection.classList.add('hidden');
  }
}

document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();

  // Ingresar al login
  const user = document.getElementById('loginUser').value;
  const pass = document.getElementById('loginPass').value;

  if (USERS[user] && USERS[user] === pass) {
    localStorage.setItem(SESSION_KEY, 'true');
    localStorage.setItem(CURRENT_USER_KEY, user);
    verificarSesion();
  } else {
    alert('❌ Usuario o contraseña incorrectos');
  }
});

document.getElementById('btnLogout').addEventListener('click', () => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
  location.reload();
});

/***********************
 * SERVICE WORKER (PWA)
 ***********************/
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

/***********************
 * MODAL ACTUALIZACIÓN
 ***********************/
const MODAL_KEY = 'update_v1.6_visto';

function mostrarModalSiEsNecesario() {
  const yaVisto = localStorage.getItem(MODAL_KEY);

  if (!yaVisto) {
    document.getElementById('modalUpdate').classList.remove('hidden');
  }
}

// Cerrar modal
function cerrarModal() {
  document.getElementById('modalUpdate').classList.add('hidden');
  localStorage.setItem(MODAL_KEY, 'true');
}

// Eventos
document.getElementById('cerrarModal').addEventListener('click', cerrarModal);
document.getElementById('btnEntendido').addEventListener('click', cerrarModal);

/***********************
 * INICIALIZACIÓN
 ***********************/
verificarSesion();




