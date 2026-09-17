const SHEET_ID = '1ihLGVsj-uJicHhdz5MlWVxrjROE7qLAowX8Ce2kI9Ig';
const SCRIPT_STOCK_URL = 'https://script.google.com/macros/s/AKfycbxRBesk9cmej8w6Rn0n1j_1i3ZvppTDgCPF863_azxEOdYFgGLgfDUsRNvi6u87kYYJDA/exec';

function obtenerUrlDinamica() {
    return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=0`;
}

let productos = [];
let carrito = [];
let categoriaActiva = "inicio";

async function fetchProductos() {
    try {
        const url = obtenerUrlDinamica();
        const res = await fetch(url);
        const text = await res.text();
        const json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
        const rows = json.table.rows;

        const bannerCell = rows[0] && rows[0].c[8];
        if (bannerCell && bannerCell.v) {
            document.getElementById('main-banner').style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${bannerCell.v}')`;
        }

        productos = rows.map((row, index) => {
            const getV = (i) => (row.c[i] && row.c[i].v !== null) ? row.c[i].v : "";
            return {
                id: getV(0) || `prod-${index}`,
                nombre: getV(1) || "Producto",
                precio: parseFloat(getV(2)) || 0,
                categoria: getV(3) || "Varios",
                stock: parseInt(getV(4)) || 0,
                imagen: getV(5) || 'https://via.placeholder.com/400',
                precioTarjeta: parseFloat(getV(6)) || 0,
                precioAnterior: parseFloat(getV(7)) || 0
            };
        }).filter(p => p.nombre !== "Producto");

        generarMenuCategorias();
        mostrarProductos(productos);
    } catch (e) { 
        console.error("Error cargando stock", e); 
    }
}

function generarMenuCategorias() {
    const menu = document.getElementById('menu-categorias');
    menu.innerHTML = '<li><a href="#" data-categoria="inicio">INICIO</a></li>';
    const cats = [...new Set(productos.map(p => p.categoria.toLowerCase()))].filter(c => c !== "");
    cats.forEach(cat => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#" data-categoria="${cat}">${cat.toUpperCase()}</a>`;
        menu.appendChild(li);
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            const cat = link.getAttribute('data-categoria');
            categoriaActiva = cat;

            if (cat === "inicio") { 
                volverTienda(); 
            } else {
                const filtrados = productos.filter(p => p.categoria.toLowerCase() === cat);
                mostrarProductos(filtrados);
                window.scrollTo({ top: document.getElementById('productos').offsetTop - 120, behavior: 'smooth' });
            }
            document.getElementById('filterPrice').value = "default";
        };
    });
}

function mostrarProductos(lista) {
    const grid = document.getElementById('grid-productos');
    grid.innerHTML = "";
    lista.forEach(p => {
        const sinStock = p.stock <= 0;
        const tieneDescuento = p.precioAnterior > p.precio;
        const precioConRecargo = p.precio * 1.25;
        const valorCuota = precioConRecargo / 3;

        const div = document.createElement('div');
        div.className = 'product-card';
        div.innerHTML = `
            <div class="product-img-container"><img src="${p.imagen}" class="product-img-tag" onerror="this.src='https://via.placeholder.com/400'"></div>
            <h3>${p.nombre.toUpperCase()}</h3>
            <div class="price-container">
                ${tieneDescuento ? `<span class="old-price">$${p.precioAnterior.toLocaleString('es-AR')}</span>` : ''}
                <span class="current-price">$${p.precio.toLocaleString('es-AR')}</span>
            </div>
            <p class="card-price">3 cuotas sin interés de $${valorCuota.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            <button class="btn-add" ${sinStock ? 'disabled style="background:#888;"' : ''} onclick="agregar('${p.id}')">
                ${sinStock ? 'SIN STOCK' : 'AGREGAR'}
            </button>`;
        const img = div.querySelector('.product-img-tag');
        img.onclick = () => verImagen(p.imagen, p.nombre);
        grid.appendChild(div);
    });
}

function ordenarProductos(criterio, lista) {
    let copia = [...lista];
    if (criterio === "low") {
        copia.sort((a, b) => a.precio - b.precio);
    } else if (criterio === "high") {
        copia.sort((a, b) => b.precio - a.precio);
    }
    mostrarProductos(copia);
}

function verImagen(src, title) {
    const modal = document.getElementById('image-modal');
    document.getElementById('modal-image').src = src;
    document.getElementById('modal-image-title').innerText = title;
    modal.classList.add('open');
}

function cerrarImagen() {
    document.getElementById('image-modal').classList.remove('open');
}

function agregar(id) {
    const p = productos.find(x => x.id == id);
    if (!p || p.stock <= 0) return;
    carrito.push(p);
    actualizarCarrito();
    const t = document.getElementById('toast-notification');
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
}

function actualizarCarrito() {
    document.getElementById('cart-count').innerText = carrito.length;
    const list = document.getElementById('cartItems');
    const totalS = document.getElementById('total-price-sidebar');
    list.innerHTML = "";
    let total = 0;
    carrito.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `<div><b>${item.nombre}</b><br><small>$${item.precio.toLocaleString('es-AR')}</small></div><span onclick="quitar(${index})" style="color:red; cursor:pointer; font-weight:bold; font-size:1.2rem;">&times;</span>`;
        list.appendChild(div);
        total += item.precio;
    });
    totalS.innerText = `$${total.toLocaleString('es-AR')}`;
}

function quitar(idx) { 
    carrito.splice(idx, 1); 
    actualizarCarrito(); 
}

function vaciarCarrito() {
    if (carrito.length > 0 && confirm("¿Vaciar todo el carrito?")) {
        carrito = [];
        actualizarCarrito();
    }
}

function volverTienda() {
    document.getElementById('checkout-section').style.display = 'none';
    document.getElementById('tienda-content').style.display = 'block';
    mostrarProductos(productos);
}

function irAlCheckout() {
    if (carrito.length === 0) return alert("Carrito vacío");
    document.getElementById('tienda-content').style.display = 'none';
    document.getElementById('checkout-section').style.display = 'block';
    document.getElementById('side-cart').classList.remove('open');
    window.scrollTo(0,0);
}

// Envío del pedido con validación anti-trolls y protección anti-spam
document.getElementById('checkout-form').onsubmit = function (e) {
    e.preventDefault();

    // 1. Filtro Anti-Spam (cooldown de 5 minutos entre pedidos del mismo dispositivo)
    const ultimoPedido = localStorage.getItem('ultimo_pedido_timestamp');
    const ahora = new Date().getTime();
    if (ultimoPedido && (ahora - parseInt(ultimoPedido)) < 300000) {
        const segundosRestantes = Math.ceil((300000 - (ahora - parseInt(ultimoPedido))) / 1000);
        alert(`Ya registramos un pedido reciente desde este dispositivo. Por favor aguardá ${segundosRestantes} segundos antes de enviar otro.`);
        return;
    }

    const nombre = document.getElementById('check-name').value.trim();
    const tel = document.getElementById('check-phone').value.trim().replace(/[\s\-\(\)]/g, '');
    const direccion = document.getElementById('check-address').value.trim();
    const pago = document.getElementById('check-payment').value;

    // 2. Validación de Nombre (al menos 2 palabras)
    if (nombre.length < 4 || !nombre.includes(' ')) {
        alert('Por favor ingresá tu nombre y apellido completo.');
        document.getElementById('check-name').focus();
        return;
    }

    // 3. Validación de Teléfono Argentino (mínimo 10 dígitos)
    const regexTel = /^[0-9]{10,13}$/;
    if (!regexTel.test(tel)) {
        alert('Por favor ingresá un número de teléfono válido (código de área + número, ej: 3814567890).');
        document.getElementById('check-phone').focus();
        return;
    }

    if (carrito.length === 0) {
        alert('El carrito está vacío.');
        return;
    }

    // Agrupar items repetidos
    const conteo = {};
    carrito.forEach(item => {
        if (!conteo[item.nombre]) {
            conteo[item.nombre] = { ...item, cantidad: 0 };
        }
        conteo[item.nombre].cantidad += 1;
    });
    const itemsAgrupados = Object.values(conteo);

    // Armar detalle y total
    let detalle = '';
    let total = 0;

    itemsAgrupados.forEach(item => {
        const sub = item.precio * item.cantidad;
        total += sub;
        detalle += `• ${item.nombre} x${item.cantidad} - $${sub.toLocaleString('es-AR')}\n`;
    });

    let msg = `*NUEVO PEDIDO - BYMARI*\n\n`;
    msg += `*Cliente:* ${nombre}\n`;
    msg += `*Teléfono:* ${tel}\n`;
    if (direccion) msg += `*Dirección:* ${direccion}\n`;
    msg += `*Método de Pago:* ${pago}\n\n`;
    msg += `*Detalle:*\n${detalle}\n`;
    msg += `*Total:* $${total.toLocaleString('es-AR')}`;

    // Disparar actualización de stock y registro en Sheet
    fetch(SCRIPT_STOCK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            cliente: nombre,
            telefono: tel,
            direccion: direccion,
            pago: pago,
            total: total,
            items: itemsAgrupados.map(item => ({
                id: item.id || '',
                nombre: item.nombre,
                cantidad: item.cantidad
            }))
        })
    }).catch(err => console.error('Error al actualizar stock:', err));

    // Guardar marca de tiempo para evitar spam
    localStorage.setItem('ultimo_pedido_timestamp', ahora.toString());

    // Abrir WhatsApp
    const encodedMsg = encodeURIComponent(msg);
    window.location.href = `https://wa.me/5493813634653?text=${encodedMsg}`;

    // Limpiar carrito
    carrito = [];
    actualizarCarrito();
};

document.addEventListener('DOMContentLoaded', () => {
    fetchProductos();
    document.getElementById('cart-btn').onclick = () => document.getElementById('side-cart').classList.add('open');
    document.getElementById('close-sidebar').onclick = () => document.getElementById('side-cart').classList.remove('open');
    document.getElementById('btn-vaciar-carrito').onclick = vaciarCarrito;
    document.getElementById('btn-to-checkout').onclick = irAlCheckout;
    document.getElementById('close-image-modal').onclick = cerrarImagen;
    document.getElementById('image-modal').onclick = (e) => {
        if (e.target.id === 'image-modal') cerrarImagen();
    };
    document.getElementById('filterPrice').onchange = (e) => {
        const criterio = e.target.value;
        let listaAmostrar = (categoriaActiva === "inicio") 
            ? [...productos] 
            : productos.filter(p => p.categoria.toLowerCase() === categoriaActiva);

        if (criterio === "low") {
            listaAmostrar.sort((a, b) => a.precio - b.precio);
        } else if (criterio === "high") {
            listaAmostrar.sort((a, b) => b.precio - a.precio);
        }

        mostrarProductos(listaAmostrar);
    };
});

document.getElementById('searchInput').oninput = (e) => {
    const term = e.target.value.toLowerCase();
    const filtrados = productos.filter(p => p.nombre.toLowerCase().includes(term));
    mostrarProductos(filtrados);
};