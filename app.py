import streamlit as st
import pandas as pd
from fpdf import FPDF
from datetime import datetime

# --- CONFIGURACIÓN DE LA PÁGINA ---
st.set_page_config(
    page_title="Gestor de Pedidos",
    page_icon="📦"
)

st.title("📦 Gestor de Pedidos de Perfumes")

# --- CATÁLOGO DE PRODUCTOS (usando un DataFrame de Pandas) ---
productos_data = {
    'nombre': ['Creed Aventus (10ml)', 'Tom Ford Oud Wood (10ml)', 'Dior Sauvage Elixir (10ml)', 'PDM Layton (10ml)', 'Xerjoff Erba Pura (10ml)'],
    'precio': [750, 850, 600, 700, 820]
}
catalogo_df = pd.DataFrame(productos_data)

# --- INICIALIZACIÓN DEL ESTADO DE LA SESIÓN ---
# 'st.session_state' es la memoria de la app. Guarda datos entre interacciones.
if 'pedido' not in st.session_state:
    st.session_state.pedido = []
if 'consecutivo' not in st.session_state:
    st.session_state.consecutivo = 1

st.header(f"Pedido #: {st.session_state.consecutivo}")

# --- FORMULARIO PARA AGREGAR PRODUCTOS ---
with st.form("agregar_producto_form", clear_on_submit=True):
    st.subheader("Agregar Producto")
    nombre_cliente = st.text_input("Nombre del Cliente")
    
    # Usamos dos columnas para organizar mejor los selectores
    col1, col2 = st.columns(2)
    with col1:
        producto_seleccionado = st.selectbox("Selecciona un perfume", options=catalogo_df['nombre'])
    with col2:
        cantidad = st.number_input("Cantidad", min_value=1, value=1)
    
    # Botón para enviar el formulario
    submitted = st.form_submit_button("Agregar al Pedido")
    
    if submitted:
        if not nombre_cliente:
            st.warning("Por favor, ingresa el nombre del cliente antes de agregar productos.")
        else:
            # Guardamos el nombre del cliente en la memoria de la sesión
            st.session_state.nombre_cliente = nombre_cliente
            
            precio_unitario = catalogo_df.loc[catalogo_df['nombre'] == producto_seleccionado, 'precio'].iloc[0]
            subtotal = precio_unitario * cantidad
            
            st.session_state.pedido.append({
                'Producto': producto_seleccionado,
                'Cantidad': cantidad,
                'Precio Unit.': precio_unitario,
                'Subtotal': subtotal
            })

# --- MOSTRAR EL PEDIDO ACTUAL ---
if st.session_state.pedido:
    st.subheader("Resumen del Pedido")
    
    # Mostramos el nombre del cliente guardado
    if 'nombre_cliente' in st.session_state:
        st.write(f"**Cliente:** {st.session_state.nombre_cliente}")
        
    pedido_df = pd.DataFrame(st.session_state.pedido)
    st.dataframe(pedido_df)

    total_pedido = pedido_df['Subtotal'].sum()
    st.metric(label="Total del Pedido", value=f"${total_pedido:,.2f}")

    # --- LÓGICA PARA GENERAR PDF Y BOTÓN DE DESCARGA ---
    class PDF(FPDF):
        def header(self):
            self.set_font('Arial', 'B', 15)
            self.cell(0, 10, 'Cotización de Perfumes', 0, 1, 'C')
            self.ln(10)

        def footer(self):
            self.set_y(-15)
            self.set_font('Arial', 'I', 8)
            self.cell(0, 10, f'Página {self.page_no()}', 0, 0, 'C')

    pdf = PDF()
    pdf.add_page()
    pdf.set_font('Arial', '', 12)
    
    # Escribir detalles del pedido
    pdf.cell(0, 10, f"Pedido #: {st.session_state.consecutivo}", 0, 1)
    pdf.cell(0, 10, f"Fecha: {datetime.now().strftime('%d/%m/%Y')}", 0, 1)
    pdf.cell(0, 10, f"Cliente: {st.session_state.get('nombre_cliente', '')}", 0, 1)
    pdf.ln(5)

    # Escribir tabla de productos
    pdf.set_font('Arial', 'B', 10)
    pdf.cell(95, 10, 'Producto', 1, 0, 'C')
    pdf.cell(30, 10, 'Cantidad', 1, 0, 'C')
    pdf.cell(30, 10, 'Precio Unit.', 1, 0, 'C')
    pdf.cell(30, 10, 'Subtotal', 1, 1, 'C')

    pdf.set_font('Arial', '', 10)
    for item in st.session_state.pedido:
        pdf.cell(95, 10, item['Producto'], 1, 0)
        pdf.cell(30, 10, str(item['Cantidad']), 1, 0, 'C')
        pdf.cell(30, 10, f"${item['Precio Unit.']:,.2f}", 1, 0, 'R')
        pdf.cell(30, 10, f"${item['Subtotal']:,.2f}", 1, 1, 'R')
    
    # Escribir Total
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(155, 10, 'Total:', 1, 0, 'R')
    pdf.cell(30, 10, f"${total_pedido:,.2f}", 1, 1, 'R')
    
    # El botón de descarga convierte el PDF a bytes para que Streamlit lo pueda servir
    st.download_button(
        label="Descargar Cotización en PDF",
        data=pdf.output(dest='S').encode('latin-1'),
        file_name=f"cotizacion_{st.session_state.consecutivo}_{st.session_state.get('nombre_cliente', '').replace(' ','_')}.pdf",
        mime="application/pdf",
    )

# --- BOTÓN PARA NUEVO PEDIDO ---
if st.button("Nuevo Pedido"):
    st.session_state.consecutivo += 1
    st.session_state.pedido = []
    # Borramos el nombre del cliente para el nuevo pedido
    if 'nombre_cliente' in st.session_state:
        del st.session_state['nombre_cliente']
    st.rerun()
