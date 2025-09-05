
document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("currentUserStore"));
  const menuContainer = document.getElementById("current-menu");
  const greeting = document.querySelector("h1");

  if (!user || user.role !== "store") {
    greeting.textContent = "Acceso no autorizado";
    setTimeout(() => (window.location.href = "/login"), 2000);
    return;
  }

  greeting.textContent = `¡Hola, ${user.name}! Bienvenido(a), tienda`;
  

  await loadCurrentMenu(user.id, menuContainer);
  
  // Event listener para agregar productos
  const addProductForm = document.getElementById("add-product-form");
  if (addProductForm) {
    addProductForm.addEventListener("submit", handleAddProduct);
  }

  // Vista previa de imagen
  setupImagePreview();
});

document.addEventListener("DOMContentLoaded", () => {
  const openBtn = document.getElementById("open-btn");
  const closeBtn = document.getElementById("close-btn");
  const statusText = document.getElementById("store-status");

  // Estado inicial
  let isOpen = false;

  // Abrir negocio
  openBtn.addEventListener("click", () => {
    isOpen = true;
    statusText.textContent = "✅ El negocio está ABIERTO";
    statusText.classList.add("status-open");
    statusText.classList.remove("status-closed");
  });

  // Cerrar negocio
  closeBtn.addEventListener("click", () => {
    isOpen = false;
    statusText.textContent = "❌ El negocio está CERRADO";
    statusText.classList.add("status-closed");
    statusText.classList.remove("status-open");
  });
});



async function loadCurrentMenu(storeId, menuContainer) {
  if (!menuContainer) {
    console.error("Contenedor de menú no encontrado");
    return;
  }

  try {
    
    const res = await fetch(`http://localhost:5050/stores/${storeId}/menu`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    menuContainer.innerHTML = "";

    if (data.menu && data.menu.length > 0) {
      data.menu.forEach((item, index) => {
        const div = document.createElement("div");
        div.classList.add("menu-item");
        div.innerHTML = `
          <img src="${item.img || 'https://via.placeholder.com/150'}" alt="${item.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;" />
          <div class="menu-item-info">
            <h4>${item.name}</h4>
            <p>${item.description}</p>
            <p class="price">$ ${(item.price || 0).toLocaleString()}</p>
          </div>
        `;
        
        
        menuContainer.appendChild(div);
      });
    } else {
      menuContainer.innerHTML = "<p>No tienes productos aún. ¡Agrega tu primer producto!</p>";
    }
  } catch (error) {
    console.error("Error cargando menú:", error);
    menuContainer.innerHTML = "<p>❌ Error cargando menú. Verifica tu conexión.</p>";
  }
}


async function handleAddProduct(e) {
  e.preventDefault();

  const user = JSON.parse(localStorage.getItem("currentUserStore"));
  if (!user || user.role !== "store") {
    alert("⚠️ Acceso no autorizado");
    return;
  }

  const name = document.getElementById("product-name")?.value?.trim();
  const description = document.getElementById("product-description")?.value?.trim();
  const priceInput = document.getElementById("product-price")?.value;
  const imageUrl = document.getElementById("product-image-url")?.value?.trim();

  // Validaciones
  if (!name || name.length < 2) {
    alert("⚠️ El nombre del producto debe tener al menos 2 caracteres");
    return;
  }

  if (!description || description.length < 5) {
    alert("⚠️ La descripción debe tener al menos 5 caracteres");
    return;
  }

  const price = parseFloat(priceInput);
  if (!price || price <= 0 || isNaN(price)) {
    alert("⚠️ El precio debe ser un número mayor a 0");
    return;
  }

  if (!imageUrl || !isValidUrl(imageUrl)) {
    alert("⚠️ Ingresa una URL válida para la imagen");
    return;
  }

  const productData = {
    name,
    description,
    price,
    img: imageUrl,
    storeId: user.id,
    createdAt: new Date().toISOString()
  };

  try {
    const res = await fetch(`http://localhost:5050/stores/${user.id}/menu`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData)
    });

    const data = await res.json();

    if (res.ok) {
      alert("✅ Producto agregado exitosamente");
      
      // Limpiar formulario
      document.getElementById("add-product-form").reset();
      const preview = document.getElementById("image-preview");
      if (preview) preview.innerHTML = "";
      
      // Recargar menú
      const menuContainer = document.getElementById("current-menu");
      await loadCurrentMenu(user.id, menuContainer);
      
    } else {
      alert(data.error || "❌ Error al agregar producto");
    }
  } catch (error) {
    console.error("Error agregando producto:", error);
    alert("❌ Error de conexión al agregar producto");
  }
}

function setupImagePreview() {
  const urlInput = document.getElementById("product-image-url");
  const preview = document.getElementById("image-preview");

  if (urlInput && preview) {
    urlInput.addEventListener("input", () => {
      const url = urlInput.value.trim();
      if (url && isValidUrl(url)) {
        preview.innerHTML = `
          <img src="${url}" alt="Vista previa" 
               style="max-width: 200px; max-height: 200px; border-radius: 8px; margin-top: 10px; object-fit: cover;"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
          <p style="display: none; color: red; margin-top: 10px;">❌ Error cargando imagen</p>
        `;
      } else {
        preview.innerHTML = "";
      }
    });
  }
}

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}