document.addEventListener('DOMContentLoaded', function() {

    // --- CATÁLOGO DE PRODUCTOS ---
    const productos = [
        { id: 'creed-aventu', nombre: 'Creed Aventus (10ml)', precio: 750 },
        { id: 'tom-ford-oud', nombre: 'Tom Ford Oud Wood (10ml)', precio: 850 },
        { id: 'dior-sauvage', nombre: 'Dior Sauvage Elixir (10ml)', precio: 600 },
        { id: 'parfums-de-marly-layton', nombre: 'PDM Layton (10ml)', precio: 700 },
        { id: 'xerjoff-erba-pura', nombre: 'Xerjoff Erba Pura (10ml)', precio: 820 }
    ];

    // --- 1. REFERENCIAS A ELEMENTOS DEL DOM ---
    const productoSelect = document.getElementById('product-list');
    const cantidadInput = document.getElementById('product-quantity');
    const agregarBtn = document.getElementById('add-product-btn');
    const tablaPedido = document.getElementById('order-items-table').getElementsByTagName('tbody')[0];
    const totalSpan = document.getElementById('total-amount');
    const nombreClienteInput = document.getElementById('customer-name');
    const generarPdfBtn = document.getElementById('generate-pdf-btn');
    const nuevoPedidoBtn = document.getElementById('new-order-btn');
    const idPedidoSpan = document.getElementById('order-id').getElementsByTagName('span')[0];
    
    let consecutivoPedido = 1;

    // --- 2. LÓGICA DE LA APLICACIÓN ---

    function cargarProductos() {
        productos.forEach(producto => {
            const option = document.createElement('option');
            option.value = producto.id;
            option.textContent = producto.nombre;
            productoSelect.appendChild(option);
        });
    }

    function agregarProductoAlPedido() {
        const productoId = productoSelect.value;
        const cantidad = parseInt(cantidadInput.value);
        if (!productoId) {
            alert('Por favor, selecciona un producto.');
            return;
        }
        const productoSeleccionado = productos.find(p => p.id === productoId);
        const subtotal = productoSeleccionado.precio * cantidad;
        const nuevaFila = tablaPedido.insertRow();
        nuevaFila.innerHTML = `
            <td>${productoSeleccionado.nombre}</td>
            <td>${cantidad}</td>
            <td>$${productoSeleccionado.precio.toFixed(2)}</td>
            <td class="subtotal">$${subtotal.toFixed(2)}</td>
        `;
        actualizarTotal();
    }

    function actualizarTotal() {
        let total = 0;
        for (let i = 0; i < tablaPedido.rows.length; i++) {
            const fila = tablaPedido.rows[i];
            const subtotalTexto = fila.cells[3].textContent;
            const subtotalNumero = parseFloat(subtotalTexto.replace('$', ''));
            total += subtotalNumero;
        }
        totalSpan.textContent = `$${total.toFixed(2)}`;
    }

    function reiniciarPedido() {
        nombreClienteInput.value = '';
        tablaPedido.innerHTML = '';
        totalSpan.textContent = '$0.00';
        productoSelect.value = '';
        cantidadInput.value = 1;
        consecutivoPedido++;
        idPedidoSpan.textContent = consecutivoPedido;
        nombreClienteInput.focus();
    }
    
    // --- ¡NUEVA FUNCIÓN PARA GENERAR EL PDF! ---
    function generarPDF() {
        // Validaciones
        const nombreCliente = nombreClienteInput.value;
        if (!nombreCliente) {
            alert('Por favor, ingresa el nombre del cliente.');
            return;
        }
        if (tablaPedido.rows.length === 0) {
            alert('No has agregado productos al pedido.');
            return;
        }
        
        // Usamos la librería jsPDF que agregamos en el HTML
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Título y datos del pedido
        doc.setFontSize(20);
        doc.text('Cotización de Perfumes', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Pedido #: ${consecutivoPedido}`, 20, 40);
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 20, 47);
        doc.text(`Cliente: ${nombreCliente}`, 20, 54);

        // Encabezados de la tabla
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Producto', 20, 70);
        doc.text('Cant.', 120, 70);
        doc.text('Precio Unit.', 140, 70);
        doc.text('Subtotal', 170, 70);
        doc.line(20, 72, 190, 72); // Línea divisora
        
        // Contenido de la tabla
        let y = 80; // Posición vertical inicial
        doc.setFont('helvetica', 'normal');
        for (let i = 0; i < tablaPedido.rows.length; i++) {
            const fila = tablaPedido.rows[i];
            doc.text(fila.cells[0].textContent, 20, y); // Producto
            doc.text(fila.cells[1].textContent, 125, y, { align: 'center' }); // Cantidad
            doc.text(fila.cells[2].textContent, 140, y); // Precio
            doc.text(fila.cells[3].textContent, 170, y); // Subtotal
            y += 7; // Aumentamos la posición para la siguiente línea
        }

        // Total
        doc.setFont('helvetica', 'bold');
        doc.line(20, y, 190, y); // Línea final
        y += 7;
        doc.text('Total:', 140, y);
        doc.text(totalSpan.textContent, 170, y);

        // Guardar el archivo
        doc.save(`cotizacion_${consecutivoPedido}_${nombreCliente.replace(/\s/g, '_')}.pdf`);
    }

    // --- 3. EVENT LISTENERS ---
    agregarBtn.addEventListener('click', agregarProductoAlPedido);
    nuevoPedidoBtn.addEventListener('click', reiniciarPedido);
    
    // Conectamos el botón de PDF a nuestra nueva función
    generarPdfBtn.addEventListener('click', generarPDF);

    // --- INICIALIZACIÓN ---
    cargarProductos();
});
