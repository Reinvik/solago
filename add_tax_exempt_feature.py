import re

# 1. Update PuntoNexusContext.jsx
with open('src/context/PuntoNexusContext.jsx', 'r', encoding='utf-8') as f:
    context_content = f.read()

# Update sanitizeInventoryPayloadForSupabase
old_sanitize = """    const clean = {
      company_id: compId,
      name: prod.name || '',
      sku: encodedSku,
      cost_price: Number(prod.cost_price) || 0,
      sell_price: Number(prod.sell_price) || 0,
      stock: Number(prod.stock) || 0,
      min_stock: Number(prod.min_stock) || 5
    };"""

new_sanitize = """    const clean = {
      company_id: compId,
      name: prod.name || '',
      sku: encodedSku,
      cost_price: Number(prod.cost_price) || 0,
      sell_price: Number(prod.sell_price) || 0,
      stock: Number(prod.stock) || 0,
      min_stock: Number(prod.min_stock) || 5,
      is_exempt: !!prod.is_exempt || !!prod.is_tax_exempt,
      is_tax_exempt: !!prod.is_exempt || !!prod.is_tax_exempt
    };"""

context_content = context_content.replace(old_sanitize, new_sanitize, 1)

# Ensure processSale saves is_exempt in item objects
old_cart_item = """        return {
          id: item.id,
          sku: item.sku,
          nombre: item.name,
          name: item.name,
          cantidad: item.quantity,
          precio_unitario: item.sell_price,
          subtotal: item.sell_price * item.quantity,
          cost_price: item.cost_price || 0
        };"""

new_cart_item = """        const isExempt = !!item.is_exempt || !!item.is_tax_exempt;
        return {
          id: item.id,
          sku: item.sku,
          nombre: item.name,
          name: item.name,
          cantidad: item.quantity,
          precio_unitario: item.sell_price,
          subtotal: item.sell_price * item.quantity,
          cost_price: item.cost_price || 0,
          is_exempt: isExempt,
          is_tax_exempt: isExempt
        };"""

context_content = context_content.replace(old_cart_item, new_cart_item, 1)

with open('src/context/PuntoNexusContext.jsx', 'w', encoding='utf-8') as f:
    f.write(context_content)

print('Updated PuntoNexusContext.jsx with is_exempt handling!')

# -------------------------------------------------------------------
# 2. Update Inventory.jsx
# -------------------------------------------------------------------
with open('src/components/Inventory.jsx', 'r', encoding='utf-8') as f:
    inv_content = f.read()

# Add is_exempt to productForm state
old_form_state = """    supplier: '',
    expiration_days: '10'
  });"""

new_form_state = """    supplier: '',
    expiration_days: '10',
    is_exempt: false
  });"""

inv_content = inv_content.replace(old_form_state, new_form_state, 1)

# Add is_exempt to handleEditClick and handleOpenAddModal
old_edit_click = """      supplier: prod.supplier || '',
      expiration_days: String(prod.expiration_days || '10')
    });"""

new_edit_click = """      supplier: prod.supplier || '',
      expiration_days: String(prod.expiration_days || '10'),
      is_exempt: !!prod.is_exempt || !!prod.is_tax_exempt
    });"""

inv_content = inv_content.replace(old_edit_click, new_edit_click, 1)

# Add is_exempt to handleSubmit in Inventory.jsx
old_submit_prod = """      payment_type: productForm.payment_type,
      supplier: productForm.supplier,
      expiration_days: Number(productForm.expiration_days) || 10,
      is_paid: productForm.payment_type === 'contado'"""

new_submit_prod = """      payment_type: productForm.payment_type,
      supplier: productForm.supplier,
      expiration_days: Number(productForm.expiration_days) || 10,
      is_paid: productForm.payment_type === 'contado',
      is_exempt: !!productForm.is_exempt,
      is_tax_exempt: !!productForm.is_exempt"""

inv_content = inv_content.replace(old_submit_prod, new_submit_prod, 1)

# Add Checkbox in Product Modal Form
old_modal_form_field = """                  <div>
                    <label className="form-label">Categoría *</label>"""

new_modal_form_field = """                  {/* Checkbox Producto Exento de IVA (E) */}
                  <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                      <input
                        type="checkbox"
                        checked={!!productForm.is_exempt}
                        onChange={(e) => setProductForm({ ...productForm, is_exempt: e.target.checked })}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#06b6d4' }}
                      />
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Percent size={16} style={{ color: 'var(--color-cyan)' }} />
                        <span>Producto Exento de IVA (E)</span>
                      </span>
                    </label>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 28px', lineHeight: '1.3' }}>
                      Marca este check para insumos o productos de la canasta básica exentos de IVA. Al facturar, figurarán con la distintiva <strong>(E)</strong> y no sumarán IVA.
                    </p>
                  </div>

                  <div>
                    <label className="form-label">Categoría *</label>"""

inv_content = inv_content.replace(old_modal_form_field, new_modal_form_field, 1)

# Render badge (E) in Inventory Table list
old_inv_name_render = """                            <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
                              {prod.name}
                            </div>"""

new_inv_name_render = """                            <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span>{prod.name}</span>
                              {(prod.is_exempt || prod.is_tax_exempt) && (
                                <span style={{ fontSize: '10px', fontWeight: 900, background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px', border: '1px solid #bae6fd' }}>
                                  🟢 (E) Exento IVA
                                </span>
                              )}
                            </div>"""

inv_content = inv_content.replace(old_inv_name_render, new_inv_name_render, 1)

with open('src/components/Inventory.jsx', 'w', encoding='utf-8') as f:
    f.write(inv_content)

print('Updated Inventory.jsx with (E) Exento IVA feature!')

# -------------------------------------------------------------------
# 3. Update receiptGenerator.js
# -------------------------------------------------------------------
with open('src/utils/receiptGenerator.js', 'r', encoding='utf-8') as f:
    receipt_content = f.read()

# Update item name rendering in table with (E)
old_receipt_item = """              <td style="padding-right: 4px;">
                <div class="text-bold">${item.nombre || item.name}</div>
                <div>${item.cantidad} x ${formatAmount(item.precio_unitario || item.sell_price)}</div>
              </td>"""

new_receipt_item = """              <td style="padding-right: 4px;">
                <div class="text-bold">${(item.is_exempt || item.is_tax_exempt) ? `${item.nombre || item.name} (E)` : (item.nombre || item.name)}</div>
                <div>${item.cantidad} x ${formatAmount(item.precio_unitario || item.sell_price)}</div>
              </td>"""

receipt_content = receipt_content.replace(old_receipt_item, new_receipt_item, 1)

# Update totals breakdown in receiptGenerator.js
old_receipt_totals = """      <div class="totals">
        <div class="total-row">
          <span>SUBTOTAL NETO (BASE):</span>
          <span>${formatAmount(netAmount)}</span>
        </div>
        ${sale?.apply_tax !== false ? `
          <div class="total-row">
            <span>MONTO IVA (${((sale?.tax_rate || companySettings.tax_rate || 0.16) * 100).toFixed(0)}%):</span>
            <span>${formatAmount(taxAmount)}</span>
          </div>
        ` : ''}
        ${discount > 0 ? `
          <div class="total-row">
            <span>DESCUENTO APLICADO:</span>
            <span>-${formatAmount(discount)}</span>
          </div>
        ` : ''}
        <div class="total-row grand-total">
          <span>TOTAL COMPRA (Bs.):</span>
          <span>${formatAmount(totalAmount)}</span>
        </div>"""

new_receipt_totals = """      <%
        const taxRate = sale?.tax_rate || companySettings.tax_rate || 0.16;
        let exemptTotal = 0;
        let taxableTotalWithTax = 0;
        
        items.forEach(it => {
          const sub = Number(it.subtotal || ((it.cantidad || 1) * (it.precio_unitario || it.sell_price || 0))) || 0;
          if (it.is_exempt || it.is_tax_exempt) {
            exemptTotal += sub;
          } else {
            taxableTotalWithTax += sub;
          }
        });

        const taxableBase = taxableTotalWithTax > 0 ? (taxableTotalWithTax / (1 + taxRate)) : 0;
        const calcTaxAmount = taxableTotalWithTax - taxableBase;
      %>
      <div class="totals">
        ${exemptTotal > 0 ? `
          <div class="total-row">
            <span>SUBTOTAL EXENTO (E):</span>
            <span class="text-bold">${formatAmount(exemptTotal)}</span>
          </div>
        ` : ''}
        <div class="total-row">
          <span>BASE IMPONIBLE (GRAVABLE):</span>
          <span>${formatAmount(taxableBase)}</span>
        </div>
        ${sale?.apply_tax !== false ? `
          <div class="total-row">
            <span>TOTAL IVA (${(taxRate * 100).toFixed(0)}%):</span>
            <span>${formatAmount(calcTaxAmount)}</span>
          </div>
        ` : ''}
        ${discount > 0 ? `
          <div class="total-row">
            <span>DESCUENTO APLICADO:</span>
            <span>-${formatAmount(discount)}</span>
          </div>
        ` : ''}
        <div class="total-row grand-total">
          <span>TOTAL A PAGAR:</span>
          <span>${formatAmount(totalAmount)}</span>
        </div>"""

# Replace JS template logic in receiptGenerator.js cleanly
old_net_calc = """  const netAmount = sale?.net_total ?? (sale?.total_sell ? sale.total_sell / (1 + (companySettings.tax_rate || 0.16)) : 0);
  const taxAmount = sale?.tax_amount ?? (sale?.total_sell ? sale.total_sell - netAmount : 0);
  const totalAmount = sale?.total_sell || 0;
  const discount = sale?.discount || 0;"""

new_net_calc = """  const taxRate = sale?.tax_rate || companySettings.tax_rate || 0.16;
  let exemptTotal = 0;
  let taxableTotalWithTax = 0;

  items.forEach(it => {
    const sub = Number(it.subtotal || ((it.cantidad || 1) * (it.precio_unitario || it.sell_price || 0))) || 0;
    if (it.is_exempt || it.is_tax_exempt) {
      exemptTotal += sub;
    } else {
      taxableTotalWithTax += sub;
    }
  });

  const taxableBase = taxableTotalWithTax > 0 ? (taxableTotalWithTax / (1 + taxRate)) : 0;
  const calcTaxAmount = taxableTotalWithTax - taxableBase;
  const totalAmount = sale?.total_sell || (exemptTotal + taxableTotalWithTax);
  const discount = sale?.discount || 0;"""

receipt_content = receipt_content.replace(old_net_calc, new_net_calc, 1)

old_totals_html = """      <div class="totals">
        <div class="total-row">
          <span>SUBTOTAL NETO (BASE):</span>
          <span>${formatAmount(netAmount)}</span>
        </div>
        ${sale?.apply_tax !== false ? `
          <div class="total-row">
            <span>MONTO IVA (${((sale?.tax_rate || companySettings.tax_rate || 0.16) * 100).toFixed(0)}%):</span>
            <span>${formatAmount(taxAmount)}</span>
          </div>
        ` : ''}
        ${discount > 0 ? `
          <div class="total-row">
            <span>DESCUENTO APLICADO:</span>
            <span>-${formatAmount(discount)}</span>
          </div>
        ` : ''}
        <div class="total-row grand-total">
          <span>TOTAL COMPRA (Bs.):</span>
          <span>${formatAmount(totalAmount)}</span>
        </div>"""

new_totals_html = """      <div class="totals">
        ${exemptTotal > 0 ? `
          <div class="total-row">
            <span>SUBTOTAL EXENTO (E):</span>
            <span class="text-bold">${formatAmount(exemptTotal)}</span>
          </div>
        ` : ''}
        <div class="total-row">
          <span>BASE IMPONIBLE (GRAVABLE):</span>
          <span>${formatAmount(taxableBase)}</span>
        </div>
        ${sale?.apply_tax !== false ? `
          <div class="total-row">
            <span>TOTAL IVA (${(taxRate * 100).toFixed(0)}%):</span>
            <span>${formatAmount(calcTaxAmount)}</span>
          </div>
        ` : ''}
        ${discount > 0 ? `
          <div class="total-row">
            <span>DESCUENTO APLICADO:</span>
            <span>-${formatAmount(discount)}</span>
          </div>
        ` : ''}
        <div class="total-row grand-total">
          <span>TOTAL A PAGAR:</span>
          <span>${formatAmount(totalAmount)}</span>
        </div>"""

receipt_content = receipt_content.replace(old_totals_html, new_totals_html, 1)

with open('src/utils/receiptGenerator.js', 'w', encoding='utf-8') as f:
    f.write(receipt_content)

print('Updated receiptGenerator.js with (E) and Subtotal Exento, Base Imponible, Total IVA breakdown!')

# -------------------------------------------------------------------
# 4. Update SalesHistory.jsx
# -------------------------------------------------------------------
with open('src/components/SalesHistory.jsx', 'r', encoding='utf-8') as f:
    sales_content = f.read()

# Update item rendering in SalesHistory.jsx modal
old_sales_item = """                          <td style={{ padding: '10px 14px', fontWeight: '700', color: '#0f172a' }}>
                            {item.nombre || item.name}
                          </td>"""

new_sales_item = """                          <td style={{ padding: '10px 14px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{item.nombre || item.name}</span>
                            {(item.is_exempt || item.is_tax_exempt) && (
                              <span style={{ fontSize: '9.5px', fontWeight: 900, background: '#e0f2fe', color: '#0369a1', padding: '1px 5px', borderRadius: '4px' }}>
                                (E)
                              </span>
                            )}
                          </td>"""

sales_content = sales_content.replace(old_sales_item, new_sales_item, 1)

# Update Cómputo Financiero breakdown in SalesHistory.jsx
old_financial_breakdown = """                  {/* Cómputo Financiero del Documento */}
                  <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '14px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>
                      Cómputo Financiero
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                        <span>Subtotal Neto (Base Imponible):</span>
                        <DualCurrencyDisplay amount={selectedSale.total_sell ? selectedSale.total_sell / 1.16 : 0} fontSize="13px" primaryColor="#475569" showSwap={false} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                        <span>Monto IVA (16%):</span>
                        <DualCurrencyDisplay amount={selectedSale.total_sell ? selectedSale.total_sell - (selectedSale.total_sell / 1.16) : 0} fontSize="13px" primaryColor="#475569" showSwap={false} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0f172a', fontWeight: 900, borderTop: '1px solid #cbd5e1', paddingTop: '6px', marginTop: '4px' }}>
                        <span>Total Recibido:</span>
                        <DualCurrencyDisplay amount={selectedSale.total_sell} fontSize="16px" primaryColor="var(--color-cyan)" showSwap={false} />
                      </div>
                    </div>
                  </div>"""

new_financial_breakdown = """                  {/* Cómputo Financiero del Documento con desglose de Exentos */}
                  <%
                    let sExempt = 0;
                    let sTaxableWithTax = 0;
                    (selectedSale.items || []).forEach(it => {
                      const sub = Number(it.subtotal || ((it.cantidad || 1) * (it.precio_unitario || it.sell_price || 0))) || 0;
                      if (it.is_exempt || it.is_tax_exempt) {
                        sExempt += sub;
                      } else {
                        sTaxableWithTax += sub;
                      }
                    });
                    const sBase = sTaxableWithTax > 0 ? (sTaxableWithTax / 1.16) : 0;
                    const sIva = sTaxableWithTax - sBase;
                  %>
                  <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '14px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>
                      Cómputo Financiero del Documento
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                      {sExempt > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0369a1', fontWeight: 700 }}>
                          <span>Subtotal Exento (E):</span>
                          <DualCurrencyDisplay amount={sExempt} fontSize="13px" primaryColor="#0369a1" showSwap={false} />
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                        <span>Base Imponible (Gravable):</span>
                        <DualCurrencyDisplay amount={sBase} fontSize="13px" primaryColor="#475569" showSwap={false} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                        <span>Total IVA (16%):</span>
                        <DualCurrencyDisplay amount={sIva} fontSize="13px" primaryColor="#475569" showSwap={false} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0f172a', fontWeight: 900, borderTop: '1px solid #cbd5e1', paddingTop: '6px', marginTop: '4px' }}>
                        <span>Total a Pagar:</span>
                        <DualCurrencyDisplay amount={selectedSale.total_sell} fontSize="16px" primaryColor="var(--color-cyan)" showSwap={false} />
                      </div>
                    </div>
                  </div>"""

# Replace in SalesHistory.jsx without template syntax errors
sales_content = sales_content.replace(old_financial_breakdown, """                  {/* Cómputo Financiero del Documento con desglose de Exentos */}
                  {(() => {
                    let sExempt = 0;
                    let sTaxableWithTax = 0;
                    (selectedSale.items || []).forEach(it => {
                      const sub = Number(it.subtotal || ((it.cantidad || 1) * (it.precio_unitario || it.sell_price || 0))) || 0;
                      if (it.is_exempt || it.is_tax_exempt) {
                        sExempt += sub;
                      } else {
                        sTaxableWithTax += sub;
                      }
                    });
                    const sBase = sTaxableWithTax > 0 ? (sTaxableWithTax / 1.16) : 0;
                    const sIva = sTaxableWithTax - sBase;

                    return (
                      <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '14px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>
                          Cómputo Financiero del Documento
                        </h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                          {sExempt > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0369a1', fontWeight: 700 }}>
                              <span>Subtotal Exento (E):</span>
                              <DualCurrencyDisplay amount={sExempt} fontSize="13px" primaryColor="#0369a1" showSwap={false} />
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                            <span>Base Imponible (Gravable):</span>
                            <DualCurrencyDisplay amount={sBase} fontSize="13px" primaryColor="#475569" showSwap={false} />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                            <span>Total IVA (16%):</span>
                            <DualCurrencyDisplay amount={sIva} fontSize="13px" primaryColor="#475569" showSwap={false} />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0f172a', fontWeight: 900, borderTop: '1px solid #cbd5e1', paddingTop: '6px', marginTop: '4px' }}>
                            <span>Total a Pagar:</span>
                            <DualCurrencyDisplay amount={selectedSale.total_sell} fontSize="16px" primaryColor="var(--color-cyan)" showSwap={false} />
                          </div>
                        </div>
                      </div>
                    );
                  })()}""", 1)

with open('src/components/SalesHistory.jsx', 'w', encoding='utf-8') as f:
    f.write(sales_content)

print('Updated SalesHistory.jsx with (E) and financial breakdown!')
