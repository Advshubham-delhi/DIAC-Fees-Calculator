
function calculateDIACFee() {
  // read & sanitize input
  const raw = document.getElementById('claimAmount')?.value;
  const claimAmount = parseFloat(String(raw || '').replace(/[, ]/g, ''));
  if (!isFinite(claimAmount) || claimAmount <= 0) {
    alert('Please enter a valid claim amount (INR).');
    return;
  }

  // optional fields
  const tribunalEl = document.getElementById('tribunal');
  const tribunal = tribunalEl ? tribunalEl.value : 'sole'; // default to sole
  const extraExpEl = document.getElementById('extraExpenses');
  const extraExpenses = extraExpEl ? (parseFloat(String(extraExpEl.value).replace(/[, ]/g, '')) || 0) : 0;

  // ---- Schedule B: per-arbitrator fee (INR) ----
  function perArbitratorFee(amount) {
    let fee = 0;
    if (amount <= 500000) {
      fee = 45000;
    } else if (amount <= 2000000) {
      fee = 45000 + 0.035 * (amount - 500000);
    } else if (amount <= 10000000) {
      fee = 97500 + 0.03 * (amount - 2000000);
    } else if (amount <= 100000000) {
      fee = 337500 + 0.015 * (amount - 10000000);
    } else if (amount <= 200000000) {
      fee = 1687500 + 0.01 * (amount - 100000000);
    } else {
      fee = 2687500 + 0.005 * (amount - 200000000);
    }

    const CAP = 6000000; // ₹60,00,000 cap per arbitrator
    const wasCapped = fee > CAP;
    if (wasCapped) fee = CAP;
    return { fee: Math.round(fee), wasCapped };
  }

  // ---- Schedule A: Administrative cost (per side, flat slabs) ----
  function adminCostPerSide(amount) {
    if (amount <= 2000000) return 10000;         // up to ₹20,00,000
    if (amount <= 10000000) return 20000;        // ₹20,00,001 – ₹1,00,00,000
    if (amount <= 50000000) return 40000;        // ₹1,00,00,001 – ₹5,00,00,000
    if (amount <= 100000000) return 75000;       // ₹5,00,00,001 – ₹10,00,00,000
    if (amount <= 500000000) return 100000;      // ₹10,00,00,001 – ₹50,00,00,000
    return 250000;                               // above ₹50,00,00,001
  }

  // compute per-arbitrator + tribunal totals
  const perArbObj = perArbitratorFee(claimAmount);
  const perArb = perArbObj.fee;
  const wasCapped = perArbObj.wasCapped;

  let totalArbitratorsFee;
  if (tribunal === 'three') {
    totalArbitratorsFee = Math.round(perArb * 3);
  } else { // 'sole' or default
    // Sole arbitrator = per-arbitrator fee + 25%
    totalArbitratorsFee = Math.round(perArb * 1.25);
  }

  // admin fees
  const adminPerSide = adminCostPerSide(claimAmount);
  const adminBoth = adminPerSide * 2;

  // grand totals (include optional extra expenses)
  const grandTotal = totalArbitratorsFee + adminBoth + Math.round(extraExpenses);
  const perParty = Math.round(grandTotal / 2);

  // format helper
  const fmt = n => n.toLocaleString('en-IN');

  // update UI — keep backwards-compatible element IDs:
  // #arbFee, #adminFee, #totalFee, #result
  const arbEl = document.getElementById('arbFee');
  const adminEl = document.getElementById('adminFee');
  const totalEl = document.getElementById('totalFee');
  const resultBox = document.getElementById('result');

  // Arb: show Per-arbitrator and Total tribunal
  if (arbEl) {
    arbEl.innerHTML = `${fmt(perArb)} <span style="display:block;font-weight:400;font-size:0.9em;color:#333;">(Each Arbitrator)</span>
                      <strong style="display:block;margin-top:6px;">${fmt(totalArbitratorsFee)} <span style="font-weight:400;">(Total Fees)</span></strong>
					  <strond style="display:block;margin-top:2px;"> <span style="font-weight:150;">(Includes 25% Additional Fees in case of Sole Arbitrator)</span></strong>`;
  }

  // Admin: show per side and both sides
  if (adminEl) {
    adminEl.innerHTML = `${fmt(adminPerSide)} <span style="display:block;font-weight:400;font-size:0.9em;color:#333;">(Each side)</span>
                         <strong style="display:block;margin-top:6px;">${fmt(adminBoth)} <span style="font-weight:400;">(Total Administrative Cost)</span></strong>`;
  }

  if (totalEl) totalEl.innerText = fmt(grandTotal);

  if (resultBox) resultBox.style.display = 'block';

  // append/refresh compact note showing per-party share and cap info
  let note = document.getElementById('diacNote');
  if (!note && resultBox) {
    note = document.createElement('p');
    note.id = 'diacNote';
    note.style.marginTop = '10px';
    note.style.fontSize = '0.95em';
    note.style.color = '#333';
    resultBox.appendChild(note);
  }
  if (note) {
    const lines = [
      ` Each Party Share (50:50): ₹${fmt(perParty)}.`,
      
    ];
    if (wasCapped) lines.push(`Note: per-arbitrator fee capped at ₹60,00,000 as per DIAC rules.`);
    note.innerText = lines.join(' ');
  }

  // done
}
