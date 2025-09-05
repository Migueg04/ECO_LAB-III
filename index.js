const express = require("express")
const path = require("path")
const fs = require("fs")

const app = express()

app.use(express.json())
app.use("/client", express.static(path.join(__dirname, "client")))
app.use("/login", express.static(path.join(__dirname, "login")))
app.use("/store", express.static(path.join(__dirname, "store")))
app.use("/rider", express.static(path.join(__dirname, "rider")))
app.use("/menu", express.static(path.join(__dirname, "menu")))

const storesPath = path.join(__dirname, "db", "store.json")
const usersPath = path.join(__dirname, "db", "client.json")
const ridersPath = path.join(__dirname, "db", "driver.json")
const menusPath = path.join(__dirname, "db", "menu.json")
const ordersPath = path.join(__dirname, "db", "orders.json");

function readStores() {
  const storesData = fs.readFileSync(storesPath, "utf-8");
  return JSON.parse(storesData)
}

function readOrders() {
  const ordersData = fs.readFileSync(ordersPath, "utf-8");
  return JSON.parse(ordersData);
}

function readUsers() {
  const usersData = fs.readFileSync(usersPath, "utf-8");
  return JSON.parse(usersData)
}

function readRiders() {
  const ridersData = fs.readFileSync(ridersPath, "utf-8");
  return JSON.parse(ridersData)
}

function readMenus() {
  const menusData = fs.readFileSync(menusPath, "utf-8");
  return JSON.parse(menusData)
}

function writeOrders(data) {
  fs.writeFileSync(ordersPath, JSON.stringify(data, null, 2), "utf-8");
}

// NUEVO ENDPOINT PARA VALIDAR LOGIN
app.post("/login", (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    if (!username || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: "Todos los campos son requeridos" 
      });
    }

    let userData;
    let user;

    // Buscar en la base de datos correspondiente según el rol
    switch (role) {
      case "client":
        userData = readUsers();
        user = userData.users ? userData.users.find(u => u.email === username && u.password === password) : null;
        break;
      
      case "store":
        userData = readStores();
        user = userData.stores ? userData.stores.find(u => u.email === username && u.password === password) : null;
        break;
      
      case "rider":
        userData = readRiders();
        user = userData.drivers ? userData.drivers.find(u => u.email === username && u.password === password) : null;
        break;
      
      default:
        return res.status(400).json({ 
          success: false, 
          message: "Rol no válido" 
        });
    }

    if (user) {
      // Login exitoso
      res.status(200).json({
        success: true,
        message: "Login exitoso",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: role
        }
      });
    } else {
      // Credenciales incorrectas
      res.status(401).json({
        success: false,
        message: "Correo electrónico o contraseña incorrectos"
      });
    }

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
});

// Tus endpoints existentes...
app.patch("/orders/:id", (req, res) => {
  try {
    const orders = readOrders();
    const orderId = parseInt(req.params.id);
    const { status } = req.body;

    const orderIndex = orders.orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    orders.orders[orderIndex].status = status;
    writeOrders(orders);

    res.status(200).json({ message: "Orden actualizada", order: orders.orders[orderIndex] });
  } catch (error) {
    console.error("Error actualizando orden:", error);
    res.status(500).json({ error: "Error actualizando orden" });
  }
});

// función para escribir el menú
function writeMenus(data) {
  fs.writeFileSync(menusPath, JSON.stringify(data, null, 2), "utf-8");
}

// NUEVO ENDPOINT PARA AGREGAR PRODUCTO
app.post("/stores/:id/menu", (req, res) => {
  try {
    const menus = readMenus();
    const storeId = parseInt(req.params.id);

    const { name, description, price, img } = req.body;

    if (!name || !description || !price) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    // Generar nuevo ID para el producto
    const newId = Math.floor(1000 + Math.random() * 9000);


    const newProduct = {
      id: newId,
      storeId: storeId,
      name,
      description,
      price,
      img: img || "default.png" // en caso de no mandar imagen
    };

    // Guardar en la base de datos
    menus.menu.push(newProduct);
    writeMenus(menus);

    res.status(201).json({
      message: "Producto agregado con éxito",
      product: newProduct
    });

  } catch (error) {
    console.error("Error agregando producto:", error);
    res.status(500).json({ error: "Error agregando producto" });
  }
});


// Reemplazar el endpoint PUT /orders en server.js:

app.put("/orders", (req, res) => {
  try {
    const orders = readOrders();
    const newOrder = req.body;

    // ✅ Asegurar que la orden tenga un estado por defecto
    if (!newOrder.status) {
      newOrder.status = "pendiente";
    }

    // ✅ Asegurar que tenga un ID único
    if (!newOrder.id) {
      newOrder.id = Date.now();
    }

    // ✅ Agregar timestamp si no existe
    if (!newOrder.createdAt) {
      newOrder.createdAt = new Date().toISOString();
    }

    orders.orders.push(newOrder);
    writeOrders(orders);

    console.log("Nueva orden guardada:", newOrder); // Para debug

    res.status(200).json({ 
      message: "Pedido guardado con éxito", 
      order: newOrder 
    });
  } catch (error) {
    console.error("Error guardando pedido:", error);
    res.status(500).json({ error: "Error guardando pedido" });
  }
});

app.get("/stores/:id/menu", (req, res) => {
  const menus = readMenus();
  const storeId = parseInt(req.params.id);

  const storeMenu = menus.menu.filter(m => m.storeId === storeId);

  res.status(200).json({ menu: storeMenu });
});

app.get("/orders", (req, res) => { 
  const orders = readOrders()
  res.status(200).send(orders)
})

app.get("/stores", (req, res) => { 
  const stores = readStores()
  res.status(200).send(stores)
})

app.listen(5050, ()=> {
  console.log("Server running on port 5050")
})