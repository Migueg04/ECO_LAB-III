// ===== CÓDIGO REPARTIDOR CORREGIDO (rider.js) =====

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("currentDriver"));
  const greeting = document.querySelector("h1");

  if (!user || user.role !== "rider") {
    greeting.textContent = "Acceso no autorizado";
    setTimeout(() => (window.location.href = "/login"), 2000);
    return;
  }

  greeting.textContent = `¡Hola, ${user.name}! Bienvenido(a), repartidor`;
  
    // Event listeners
  const getBtn = document.getElementById("get-btn");
  if (getBtn) {
    getBtn.addEventListener("click", getOrders);
  }
  
  // Cargar órdenes automáticamente
  getOrders();
});


async function getOrders() {
  // ✅ Verificar que el repartidor esté logueado
  const user = JSON.parse(localStorage.getItem("currentDriver"));
  if (!user || user.role !== "rider") {
    alert("⚠️ Acceso no autorizado");
    window.location.href = '/login';
    return;
  }

  try {
    const res = await fetch("http://localhost:5050/orders");
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();

    const pendingContainer = document.getElementById("orders-container");
    const acceptedContainer = document.getElementById("accepted-orders-container");
    const completedContainer = document.getElementById("completed-orders-container");

    // Verificar que los contenedores existan
    if (!pendingContainer || !acceptedContainer || !completedContainer) {
      console.error("No se encontraron todos los contenedores de órdenes");
      return;
    }

    // Limpiar antes de volver a renderizar
    pendingContainer.innerHTML = "";
    acceptedContainer.innerHTML = "";
    completedContainer.innerHTML = "";

    let hasPending = false;
    let hasAccepted = false;
    let hasCompleted = false;

    if (!data.orders || data.orders.length === 0) {
      pendingContainer.innerHTML = "<p>No hay pedidos disponibles 📦</p>";
      acceptedContainer.innerHTML = "<p>No hay pedidos aceptados 🚫</p>";
      completedContainer.innerHTML = "<p>No hay pedidos completados 🚫</p>";
      return;
    }

    data.orders.forEach(order => {
      const div = document.createElement("div");
      div.classList.add("order-card");

      let itemsHTML = "";
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          itemsHTML += `
            <div class="order-item">
              <span class="item-name">${item.name || 'Producto'}</span>
              <span class="item-price">$${(item.price || 0).toLocaleString()}</span>
            </div>
          `;
        });
      } else {
        itemsHTML = "<div class='order-item'>Sin productos especificados</div>";
      }

      div.innerHTML = `
        <h3> ${order.storeName || 'Tienda desconocida'}</h3>
        <p><strong> Dirección de entrega:</strong> ${order.adress || 'No especificada'}</p>
        <div class="order-items">
          <strong>📦 Productos:</strong>
          ${itemsHTML}
        </div>
        <p><strong> Total:</strong> $${(order.total || 0).toLocaleString()}</p>
        <p><strong> Domicilio:</strong> $${(order.deliveryFee || 0).toLocaleString()}</p>
        <p><strong> Método de pago:</strong> ${order.payMethod || 'No especificado'}</p>
        <p><strong> Estado:</strong> <span class="status ${order.status}">${order.status}</span></p>
        <p><strong> Creado:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleString() : 'No especificado'}</p>
      `;

      // ---- Clasificación según estado ----
      if (order.status === "pendiente") {
        hasPending = true;
        const takeBtn = document.createElement("button");
        takeBtn.textContent = " Aceptar orden";
        takeBtn.classList.add("take-btn");
        takeBtn.style.cssText = "background: #28a745; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;";
        takeBtn.addEventListener("click", () => {
          if (confirm("¿Estás seguro de que quieres aceptar esta orden?")) {
            updateOrderStatus(order.id, "aceptada");
          }
        });
        div.appendChild(takeBtn);
        pendingContainer.appendChild(div);
      }

      if (order.status === "aceptada") {
        hasAccepted = true;
        const completeBtn = document.createElement("button");
        completeBtn.textContent = "✅ Marcar como completada";
        completeBtn.classList.add("complete-btn");
        completeBtn.style.cssText = "background: #007bff; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;";
        completeBtn.addEventListener("click", () => {
          if (confirm("¿Confirmas que has completado esta entrega?")) {
            updateOrderStatus(order.id, "completada");
          }
        });
        div.appendChild(completeBtn);
        acceptedContainer.appendChild(div);
      }

      if (order.status === "completada") {
        hasCompleted = true;
        div.style.opacity = "0.8";
        completedContainer.appendChild(div);
      }
    });

    // ---- Mensajes cuando no hay órdenes ----
    if (!hasPending) {
      pendingContainer.innerHTML = "<p>No hay pedidos pendientes 🚫</p>";
    }
    if (!hasAccepted) {
      acceptedContainer.innerHTML = "<p>No hay pedidos aceptados 🚫</p>";
    }
    if (!hasCompleted) {
      completedContainer.innerHTML = "<p>No hay pedidos completados 🚫</p>";
    }

    console.log(`Órdenes cargadas: ${data.orders.length} total`);

  } catch (error) {
    console.error("Error obteniendo órdenes:", error);
    
    // Mostrar error en los contenedores
    const containers = [
      document.getElementById("orders-container"),
      document.getElementById("accepted-orders-container"),
      document.getElementById("completed-orders-container")
    ];
    
    containers.forEach(container => {
      if (container) {
        container.innerHTML = "<p>❌ Error cargando pedidos. Verifica tu conexión.</p>";
      }
    });
  }
}

async function updateOrderStatus(orderId, newStatus) {
  // ✅ Verificar que el repartidor esté logueado
  const user = JSON.parse(localStorage.getItem("currentDriver"));
  if (!user || user.role !== "rider") {
    alert("⚠️ Acceso no autorizado");
    window.location.href = '/login';
    return;
  }

  if (!orderId) {
    alert("❌ ID de orden no válido");
    return;
  }

  try {
    const requestBody = { 
      status: newStatus,
      riderId: user.id,
      updatedAt: new Date().toISOString()
    };

    console.log("Actualizando orden:", orderId, "a estado:", newStatus);

    const res = await fetch(`http://localhost:5050/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log("Orden actualizada exitosamente:", data);

    // Mostrar mensaje de éxito
    const statusMessages = {
      'aceptada': '✅ Orden aceptada exitosamente',
      'completada': '🎉 Orden marcada como completada'
    };
    
    alert(statusMessages[newStatus] || '✅ Estado actualizado');

    // Refrescar vista
    getOrders();
    
  } catch (error) {
    console.error("❌ Error en updateOrderStatus:", error);
    alert(`❌ Error al actualizar la orden: ${error.message}`);
  }
}