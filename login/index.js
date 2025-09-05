// ===== CÓDIGO DE LOGIN CORREGIDO (login.js) =====

document.addEventListener("DOMContentLoaded", () => {
  // Limpiar cualquier sesión previa al cargar la página de login
  clearAllSessions();
  
  // Event listeners para los botones de rol
  document.getElementById("client-btn").addEventListener("click", () => getUserForm("client"));
  document.getElementById("store-btn").addEventListener("click", () => getUserForm("store"));
  document.getElementById("rider-btn").addEventListener("click", () => getUserForm("rider"));
});

function getUserForm(role) {
  showLoginForm(role);
  console.log(`${role} form`);
}

function clearAllSessions() {
  localStorage.removeItem('currentUser');      // Cliente
  localStorage.removeItem('currentUserStore'); // Tienda  
  localStorage.removeItem('currentDriver');    // Repartidor
}

function showLoginForm(role) {
  const container = document.getElementById("form-container");
  if (!container) {
    console.error("No se encontró el contenedor del formulario.");
    return;
  }

  let roleTitle = "";
  switch(role) {
    case 'client': roleTitle = 'Cliente'; break;
    case 'store': roleTitle = 'Tienda'; break;
    case 'rider': roleTitle = 'Repartidor'; break;
  }

  container.innerHTML = `
    <form id="login-form">
      <h2>Iniciar Sesión (${roleTitle})</h2>
      <label for="username">Correo Electrónico:</label>
      <input type="email" id="username" name="username" required>
      <br>
      <label for="password">Contraseña:</label>
      <input type="password" id="password" name="password" required>
      <br>
      <input type="hidden" id="role" name="role" value="${role}">
      <button type="submit">Ingresar</button>
      <div id="error-message" style="color: red; display: none; margin-top: 10px;"></div>
      <div id="loading" style="display: none; margin-top: 10px;">Validando...</div>
    </form>
  `;

  document.getElementById("login-form").addEventListener("submit", handleLogin);
}

async function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;
  const errorMessage = document.getElementById("error-message");
  const loading = document.getElementById("loading");

  // Validaciones básicas
  if (!username || !password) {
    showError("Por favor completa todos los campos");
    return;
  }

  // Mostrar loading y ocultar errores
  loading.style.display = "block";
  errorMessage.style.display = "none";

  console.log("Intentando login - Usuario:", username, "Rol:", role);

  try {
    const response = await fetch("http://localhost:5050/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password, role })
    });

    const data = await response.json();
    loading.style.display = "none";
    
    if (data.success && data.user) {
      console.log("Login exitoso:", data);
      
      // ✅ LIMPIAR TODAS LAS SESIONES PREVIAS
      clearAllSessions();
      
      // ✅ GUARDAR USUARIO SEGÚN SU ROL CON LAS CLAVES CORRECTAS
      switch(data.user.role) {
        case 'client':
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          window.location.href = '/client';
          break;
        case 'store':
          localStorage.setItem('currentUserStore', JSON.stringify(data.user));
          window.location.href = '/store';
          break;
        case 'rider':
          localStorage.setItem('currentDriver', JSON.stringify(data.user));
          window.location.href = '/rider';
          break;
        default:
          showError("Rol de usuario no válido");
          return;
      }
    } else {
      showError(data.message || "Credenciales incorrectas");
    }
  } catch (error) {
    loading.style.display = "none";
    console.error("Error de conexión:", error);
    showError("Error de conexión. Verifica tu servidor y intenta nuevamente.");
  }
}

function showError(message) {
  const errorMessage = document.getElementById("error-message");
  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
  } else {
    alert(message);
  }
}