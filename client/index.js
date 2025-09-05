let cart = [];
let currentStore = null;
let deliveryFee = 0;

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const greeting = document.querySelector("h1");

  if (!user || user.role !== "client") {
    greeting.textContent = "Acceso no autorizado";
    setTimeout(() => (window.location.href = "/login"), 2000);
    return;
  }

  greeting.textContent = `¡Hola, ${user.name}! Bienvenido(a), cliente`;
  getStores();

  const cartBtn = document.getElementById("cart-btn");
  if (cartBtn) {
    cartBtn.addEventListener("click", handleOrder);
  }
});

async function getStores() {
  try {
    const res = await fetch("http://localhost:5050/stores");
    const data = await res.json();

    const container = document.getElementById("restaurants-container");
    container.innerHTML = "";

    if (!data.stores || data.stores.length === 0) {
      container.innerHTML = "<p>No hay restaurantes disponibles</p>";
      return;
    }

    data.stores.forEach(store => {
      const div = document.createElement("div");
      div.classList.add("restaurant-card");
      div.innerHTML = `
        <img src="${store.img}" alt="${store.name}" />
        <h4>${store.name}</h4>
        <p>${store.category}</p>
        <p>Domicilio: $${store.deliveryFee}</p>
        <p>Barrio: ${store.address?.neighborhood || 'No especificado'}</p>
        <p>🌟: ${store.rating}</p>
        <button class="menu-btn" data-id="${store.id}" data-delivery="${store.deliveryFee}" data-name="${store.name}">
          Ver Menú
        </button>
      `;
      container.appendChild(div);
    });

    document.querySelectorAll(".menu-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const storeId = e.target.getAttribute("data-id");
        deliveryFee = parseInt(e.target.getAttribute("data-delivery"), 10) || 0;
        currentStore = storeId;
        cart = [];
        renderCart();
        getMenu(storeId);
      });
    });

  } catch (error) {
    console.error("Error obteniendo restaurantes:", error);
  }
}

async function getMenu(storeId) {
  try {
    const res = await fetch(`http://localhost:5050/stores/${storeId}/menu`);
    const data = await res.json();

    const container = document.getElementById("menu-container");
    container.innerHTML = "";

    if (!data.menu || data.menu.length === 0) {
      container.innerHTML = "<p>Este restaurante no tiene menú disponible.</p>";
      return;
    }

    data.menu.forEach(menu => {
      const div = document.createElement("div");
      div.classList.add("menu-item-card");
      div.innerHTML = `
        <img src="${menu.img}" alt="${menu.name}" />
        <h4>${menu.name}</h4>
        <p>${menu.description}</p>
        <p>$${menu.price}</p>
        <button class="add-to-cart-btn">Agregar al Carrito</button>
      `;
      div.querySelector(".add-to-cart-btn").addEventListener("click", () => {
        addToCart(menu);
      });
      container.appendChild(div);
    });
  } catch (error) {
    console.error("Error obteniendo el menú:", error);
  }
}

function addToCart(product) {
  cart.push(product);
  renderCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  renderCart();
}

function renderCart() {
  const cartContainer = document.getElementById("cart-container");
  const emptyMessage = document.getElementById("empty-cart");
  const totalPriceElement = document.getElementById("total-price");

  cartContainer.querySelectorAll(".cart-item").forEach(el => el.remove());
  cartContainer.querySelectorAll(".delivery-fee").forEach(el => el.remove());

  if (cart.length === 0) {
    emptyMessage.style.display = "block";
  } else {
    emptyMessage.style.display = "none";

    cart.forEach((item, index) => {
      const div = document.createElement("div");
      div.classList.add("cart-item");
      div.innerHTML = `
        <img src="${item.img}" alt="${item.name}" />
        <div class="cart-info">
          <p class="cart-name">${item.name}</p>
          <p class="cart-price">$${item.price}</p>
        </div>
        <button class="remove-btn">❌</button>
      `;
      div.querySelector(".remove-btn").addEventListener("click", () => {
        removeFromCart(index);
      });
      cartContainer.insertBefore(div, totalPriceElement);
    });

    const deliveryDiv = document.createElement("div");
    deliveryDiv.classList.add("delivery-fee");
    deliveryDiv.innerHTML = `
      <p><strong>Domicilio:</strong> $${deliveryFee}</p>
      <p><strong>Método de pago:</strong></p>
      <input type="radio" id="cash" name="opciones" value="Efectivo" checked>
      <label for="cash">Efectivo</label><br>
      <input type="radio" id="card" name="opciones" value="Tarjeta">
      <label for="card">Tarjeta</label><br><br>
      <label for="adress">Dirección de entrega</label><br>
      <input type="text" id="adress" required placeholder="Ingresa tu dirección completa"><br>
    `;
    cartContainer.insertBefore(deliveryDiv, totalPriceElement);
  }

  const productsTotal = cart.reduce((acc, item) => acc + (item.price || 0), 0);
  const total = cart.length > 0 ? productsTotal + deliveryFee : 0;
  totalPriceElement.textContent = `Total: $${total}`;
}

// ✅ Mostrar última orden en una card
function renderMyOrder(order) {
  const container = document.getElementById("my-order-container");
  const noOrdersMsg = document.getElementById("no-orders");
  container.innerHTML = "";

  if (!order) {
    noOrdersMsg.style.display = "block";
    return;
  }

  noOrdersMsg.style.display = "none";

  const div = document.createElement("div");
  div.classList.add("order-card");
  div.innerHTML = `
    <h4>🍔 Pedido en ${order.storeName}</h4>
    <p><strong>Total:</strong> $${order.total}</p>
    <p><strong>Pago:</strong> ${order.payMethod}</p>
    <p><strong>Dirección:</strong> ${order.adress}</p>
    <ul>
      ${order.items.map(item => `<li>${item.name} - $${item.price}</li>`).join("")}
    </ul>
  `;
  container.appendChild(div);
}

// En la función handleOrder(), modificar la creación de la orden:

async function handleOrder() {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (!user || user.role !== "client") {
    alert("⚠️ Debes iniciar sesión como cliente");
    return;
  }
  if (cart.length === 0) {
    alert("El carrito está vacío");
    return;
  }

  const addressInput = document.getElementById("adress");
  if (!addressInput || addressInput.value.trim() === "") {
    alert("⚠️ Ingresa una dirección");
    return;
  }

  const selectedPayMethod = document.querySelector('input[name="opciones"]:checked');
  if (!selectedPayMethod) {
    alert("⚠️ Selecciona un método de pago");
    return;
  }

  const total = cart.reduce((acc, item) => acc + item.price, 0) + deliveryFee;
  const order = {
    id: Date.now(),
    clientId: user.id,
    storeId: currentStore,
    storeName: document.querySelector(`.menu-btn[data-id="${currentStore}"]`)?.getAttribute("data-name") || "Restaurante",
    items: cart.map(item => ({ name: item.name, price: item.price })),
    deliveryFee,
    total,
    payMethod: selectedPayMethod.value,
    adress: addressInput.value.trim(),
    status: "pendiente", // ✅ AGREGAR ESTA LÍNEA
    createdAt: new Date().toISOString()
  };

  try {
    const res = await fetch("http://localhost:5050/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });

    if (res.ok) {
      alert("✅ Pedido realizado con éxito");
      cart = [];
      currentStore = null;
      deliveryFee = 0;
      renderCart();
      addressInput.value = "";
      renderMyOrder(order);
    } else {
      alert("❌ Error al realizar el pedido");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("❌ Error de conexión");
  }
}
