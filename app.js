/***********************
 * Credenciales de accesos al login
 ***********************/
const USERS = {
  "Rosa Mata": "0874",
  "Juan Mata": "2004",
  "Alex Ruiz": "1234"
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
  prestamoActivo = prestamos.find(p => p.id === id);

  document.getElementById('misPrestamos').classList.add('hidden');
  document.getElementById('detallePrestamo').classList.remove('hidden');

  render();
}

document.getElementById('btnVolver').addEventListener('click', () => {
  prestamoActivo = null;

  document.getElementById('detallePrestamo').classList.add('hidden');
  document.getElementById('misPrestamos').classList.remove('hidden');

  renderListaPrestamos();
});  

/*******************
 * RENDER PRINCIPAL
 ******************/
function render() {
  const resultado = document.getElementById('resultado');
  const seccionPagos = document.getElementById('seccionPagos');
  const btnEliminar = document.getElementById('btnEliminar');

  if (!prestamoActivo) {
    resultado.innerHTML = '';
    seccionPagos.classList.add('hidden');
    btnEliminar.classList.add('hidden');
    
    return;
  }

  seccionPagos.classList.remove('hidden');
  btnEliminar.classList.remove('hidden');

  const interesMensual = prestamoActivo.capitalActual * prestamoActivo.interes / 100;

  // Renderizar resumen del préstamo
  const capitalRecuperado = prestamoActivo.capitalInicial - prestamoActivo.capitalActual;
  const interesesRecibidos = prestamoActivo.pagos.reduce((total, pago) => total + pago.interes, 0);

  let html = `
  <div class="detalle-header">
    <h2>👤 ${prestamoActivo.nombre}</h2>
    <div class="capital-box">
      <span>Capital pendiente:</span>
      <h1>$${prestamoActivo.capitalActual.toLocaleString('es-CO')}</h1>
    </div>

    <div class="detalle-info">
      <p>📈 Interés mensual: 
      <strong>${prestamoActivo.interes}%</strong>
      </p>
      <p>💵 Valor interés:
      <strong>$${interesMensual.toLocaleString('es-CO')}</strong>
      </p>
      <p>📅 Fecha del préstamo:
      <strong>${prestamoActivo.fecha}</strong>
      </p>
    </div>

    <div class="resumen-financiero">
      <div class="card-resumen">
        <span>Total prestado</span>
        <h3>$${prestamoActivo.capitalInicial.toLocaleString('es-CO')}</h3>
      </div>

      <div class="card-resumen">
        <span>Capital recuperado</span>
        <h3>$${capitalRecuperado.toLocaleString('es-CO')}</h3>
      </div>

      <div class="card-resumen">
        <span>Intereses cobrados</span>
        <h3>$${interesesRecibidos.toLocaleString('es-CO')}</h3>
      </div>
    </div>

    <hr>
    <h3>Historial de Pagos</h3>
  </div>
  `;

  if (prestamoActivo.pagos.length === 0) {
    html += `<p class="mensaje">Aún no se han registrado pagos.</p>`;
  } else {

    html += `<div class="historial-pagos">`;
    prestamoActivo.pagos.forEach(pago => {
      html += `
        <div class="pago-card">
          <div class="pago-fecha">
            📅 ${pago.fecha}
          </div>

          <div class="pago-datos">
            <div>
              <small>Capital</small>
              <h4>$${pago.capital.toLocaleString('es-CO')}</h4>
            </div>

            <div>
              <small>Interés</small>
              <h4>$${pago.interes.toLocaleString('es-CO')}</h4>
            </div>
          </div>
        </div>
      `;
    });
    html += `</div>`;
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
const MODAL_KEY = 'update_v1.7_visto';

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




