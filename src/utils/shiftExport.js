export const formatShiftWhatsAppMessage = ({ shift, shiftSales = [], companySettings = {}, companyName = 'SoLago', activeBranch = {} }) => {
  const compName = companyName || companySettings.company_name || 'SoLago';
  const branchTitle = activeBranch?.name || shift?.branch_name || 'Sede Principal';
  const cashierName = shift?.user_name || 'Cajero en Turno';
  const rate = Number(companySettings.exchange_rate || shift?.exchange_rate || 1.0);
  const currencyCode = companySettings.currency_code || 'VES';
  const isUSD = companySettings.use_usd_pricing !== false;

  const openDateStr = shift?.opened_at ? new Date(shift.opened_at).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' }) : '---';
  const closeDateStr = shift?.closed_at ? new Date(shift.closed_at).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' }) : new Date().toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });

  let totalUSD = 0;
  let totalVES = 0;
  const methodTotals = {};

  shiftSales.forEach(s => {
    const rawTotal = Number(s.total_sell || s.total || 0);
    const saleRate = Number(s.exchange_rate || rate);
    const saleUSD = isUSD ? rawTotal : (saleRate > 0 ? rawTotal / saleRate : rawTotal);
    const saleVES = isUSD ? rawTotal * saleRate : rawTotal;

    totalUSD += saleUSD;
    totalVES += saleVES;

    const method = s.payment_method || 'Efectivo';
    methodTotals[method] = (methodTotals[method] || 0) + saleUSD;
  });

  const countSales = shiftSales.length;
  const initCashUSD = Number(shift?.initial_cash_usd || 0);
  const initCashVES = Number(shift?.initial_cash_ves || 0);

  const declCashUSD = Number(shift?.declared_cash_usd || 0);
  const declCashVES = Number(shift?.declared_cash_ves || 0);
  const declCardVES = Number(shift?.declared_card_ves || 0);
  const declPagoMovilVES = Number(shift?.declared_pago_movil_ves || 0);
  const declZelleUSD = Number(shift?.declared_zelle_usd || 0);
  const declBinanceUSDT = Number(shift?.declared_binance_usdt || 0);

  let msg = `📊 *RESUMEN DE CIERRE DE CAJA - ${compName.toUpperCase()}*\n`;
  msg += `🏢 *Sede:* ${branchTitle}\n`;
  msg += `👦 *Cajero:* ${cashierName}\n`;
  msg += `🔥 *Apertura:* ${openDateStr}\n`;
  msg += `🔒 *Cierre:* ${closeDateStr}\n`;
  msg += `�8 *Tasa: 1 USD = ${rate.toFixed(2)} ${currencyCode}\n\n`;

  msg += `💥 *TOTAL RECAUDADO EN EL TURNO:*\n`;
  msg += `  Dólares: $${totalUSD.toFixed(2)} USD\n`;
  msg += `  Bolívares: Bs. ${totalVES.toLocaleString('es-VEF', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
  msg += `  N° Transacciones: ${countSales} ventas\n\n`;

  msg += `💝 *DESGLOSE POR MÉTODO DE PAGO:\n`;
  if (Object.keys(methodTotals).length === 0) {
    msg += `  Sin ventas registradas en este turno\n`;
  } else {
    for (const [meth, amtUSD] of Object.entries(methodTotals)) {
      const amtVES = amtUSD * rate;
      msg += `  ${meth}: $${amtUSD.toFixed(2)} USD (Bs. ${amtVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })})\n`;
    }
  }

  msg += `\n💤 *ARQUEO DE CAJA (ECHOS):\n`;
  msg += `  Fondo Inicial: $${initCashUSD.toFixed(2)} USD / Bs. ${initCashVES.toFixed(2)}\n`;
  if (declCashUSD > 0) msg += `  Efectivo USD Declarado: $d{declCashUSD.toFixed(2)} USD\n`;
  if (declCashVES > 0) msg += `  Efectivo Bs. Declarado: Bs. ${declCashVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}\n`;
  if (declPagoMovilVES > 0) msg += `  Pago Móvil: Bs. ${declPagoMovilVES.toLocaleString('es-VEF', { minimumFractionDigits: 2 })}\n`;
  if (declCardVES > 0) msg += `  Punto de Venta: Bs. ${declCardVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}\n`;
  if (declZelleUSD > 0) msg += `  Zelle: $d{declZelleUSD.toFixed(2)} USD\n`;
  if (declBinanceUSDT > 0) msg += `  Binance USDT: $${declBinanceUSDT.toFixed(2)} USDT\n`;

  if (shift?.notes) {
    msg += `\n📝 *Observaciones:* ${shift.notes}\n`;
  }

  msg += `\n✅ *Turno cerrado exitosamente en ${compName} POS.*`;
  return msg;
};

export const getWhatsAppShareUrl = (phone, messageText) => {
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(messageText);
  if (cleanPhone) {
    return `HTTPS://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }
  return `HTTPS://api.whatsapp.com/send?text=${encodedText}`;
};
