/***********************
 * Credenciales de accesos al login
 ***********************/
const USER = 'Rosa Mata';
const PASSWORD = '0874';
const SESSION_KEY = 'usuarioLogueado';

/************************
 * VARIABLES GLOBALES
 **********************/
let prestamos = [];
let prestamoActivo = null;

const STORAGE_KEY = 'controlPrestamos';

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

    // Seleccionar automaticamente el último prestamo
    if (prestamos.length > 0) {
      prestamoActivo = prestamos[prestamos.length - 1];
    }
  }

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

  if (prestamos.length === 0) {
    lista.innerHTML = '<p>No hay préstamos registrados</p>';
    return;
  }

  prestamos.forEach(p => {
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
    mensajeSinPrestamo.classList.remove('hidden');
    btnEliminar.classList.add('hidden');
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

  const nuevoPrestamo = {
    id: Date.now(),
    nombre: document.getElementById('nombre').value,
    capitalInicial: Number(document.getElementById('capital').value.replace(/\./g, '')),
    capitalActual: Number(document.getElementById('capital').value.replace(/\./g, '')),
    interes: Number(document.getElementById('interes').value),
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

  if (logueado === 'true') {
    loginSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    cargarDatos();
  } else {
    loginSection.classList.remove('hidden');
    appSection.classList.add('hidden');
  }
}

document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const user = document.getElementById('loginUser').value;
  const pass = document.getElementById('loginPass').value;

  if (user === USER && pass === PASSWORD) {
    localStorage.setItem(SESSION_KEY, 'true');
    verificarSesion();
  } else {
    alert('❌ Usuario o contraseña incorrectos');
  }
});

document.getElementById('btnLogout').addEventListener('click', () => {
  localStorage.removeItem(SESSION_KEY);
  location.reload();
});

/***********************
 * SERVICE WORKER (PWA)
 ***********************/
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

/***********************
 * INICIALIZACIÓN
 ***********************/
verificarSesion();




