const SHEET_ID = '1ihLGVsj-uJicHhdz5MlWVxrjROE7qLAowX8Ce2kI9Ig';

function obtenerUrlDinamica() {
    const timestamp = new Date().getTime();
    return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&t=${timestamp}`;
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

        const bannerCell = rows[0] && rows[0].c[7];
        if(bannerCell && bannerCell.v) {
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
    } catch (e) { console.error("Error cargando stock", e); }
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

            if(cat === "inicio") { 
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
    if(!p || p.stock <= 0) return;
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
        div.innerHTML = `<div><b>${item.nombre}</b><br><small>$${item.precio}</small></div><span onclick="quitar(${index})" style="color:red; cursor:pointer; font-weight:bold; font-size:1.2rem;">&times;</span>`;
        list.appendChild(div);
        total += item.precio;
    });
    totalS.innerText = `$${total.toLocaleString('es-AR')}`;
}

function quitar(idx) { carrito.splice(idx, 1); actualizarCarrito(); }

function vaciarCarrito() {
    if(carrito.length > 0 && confirm("¿Vaciar todo el carrito?")) {
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
    if(carrito.length === 0) return alert("Carrito vacío");
    document.getElementById('tienda-content').style.display = 'none';
    document.getElementById('checkout-section').style.display = 'block';
    document.getElementById('side-cart').classList.remove('open');
    window.scrollTo(0,0);
}

document.getElementById('checkout-form').onsubmit = (e) => {
    e.preventDefault();
    const nombre = document.getElementById('check-name').value;
    const tel = document.getElementById('check-phone').value;
    const dir = document.getElementById('check-address').value || "A convenir";
    const pago = document.getElementById('check-payment').value;

    let totalEfectivo = 0;
    carrito.forEach(p => totalEfectivo += p.precio);

    const totalConTarjeta = totalEfectivo * 1.25;
    const montoAMostrar = (pago === "Tarjeta (3 cuotas)") ? totalConTarjeta : totalEfectivo;

    let msg = `*BYMARI - NUEVO PEDIDO*%0A%0A`;
    msg += `*Cliente:* ${nombre}%0A*WhatsApp:* ${tel}%0A*Dirección:* ${dir}%0A*Pago:* ${pago}%0A%0A*PRODUCTOS:*%0A`;
    carrito.forEach(p => msg += `- ${p.nombre} ($${p.precio})%0A`);
    msg += `%0A*TOTAL A PAGAR: $${montoAMostrar.toLocaleString('es-AR')}*`;

    if(pago === "Tarjeta (3 cuotas)") {
        msg += `%0A_(Incluye recargo del 25% por financiación en 3 cuotas)_`;
    }
    
    window.open(`https://wa.me/5493813520315?text=${msg}`);
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