const DB = {

  demo_user: "tc_demo_user",
  demo_customers: "tc_demo_customers",
  demo_credits: "tc_demo_credits",
  demo_sales: "tc_demo_sales",

  token: "tc_token",
  mode: "tc_mode", 
  user: "tc_user",
  customers: "tc_customers",
  credits: "tc_credits",
  sales: "tc_sales"
};

const $ = (id) => document.getElementById(id);

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function write(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
function uid() { return (crypto?.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random()}`); }
function today() { return new Date().toISOString().slice(0, 10); }
function money(v) { return "₹" + Number(v || 0).toLocaleString("en-IN"); }
function pageName() { return (window.location.pathname.split("/").pop() || "index.html").toLowerCase(); }
function isIndex() { return pageName() === "index.html" || pageName() === ""; }
function isAppPage() {
  return ["dashboard.html", "customers.html", "ledger.html", "trustscore.html", "loan.html"].includes(pageName());
}

function setMode(m) { localStorage.setItem(DB.mode, m); }
function getMode() { return localStorage.getItem(DB.mode) || "demo"; }
function isDemo() { return getMode() === "demo"; }
function isReal() { return getMode() === "real"; }

function setToken(t) { localStorage.setItem(DB.token, t); }
function getToken() { return localStorage.getItem(DB.token); }
function clearToken() { localStorage.removeItem(DB.token); }

async function api(path, opts = {}) {
  const token = getToken();
  const headers = opts.headers || {};
  headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`http://127.0.0.1:8000${path}`, { ...opts, headers });
}

function activeKeys() {
  if (isDemo()) {
    return {
      user: DB.demo_user,
      customers: DB.demo_customers,
      credits: DB.demo_credits,
      sales: DB.demo_sales
    };
  }
  return {
    user: DB.user,
    customers: DB.customers,
    credits: DB.credits,
    sales: DB.sales
  };
}

function getUser() {
  const K = activeKeys();
  if (isDemo()) return read(K.user, null);
  return read(K.user, null);
}

function protect() {
  if (!isAppPage()) return;

  if (isDemo()) {
    ensureDemoUser();
    return;
  }

  if (isReal() && !getToken()) {
    window.location.href = "index.html";
    return;
  }
}

function logout() {
  clearToken();
  setMode("demo");
  localStorage.removeItem(DB.user);
  window.location.href = "index.html";
}

function seed() {
  const K = activeKeys();
  if (isReal()) return;

  if (!localStorage.getItem(K.customers)) {
    write(K.customers, [
      { id: uid(), name: "Amit", phone: "9876543210", notes: "Regular" },
      { id: uid(), name: "Sana", phone: "9123456789", notes: "Wholesale" }
    ]);
  }

  if (!localStorage.getItem(K.credits)) {
    const c = read(K.customers, []);
    write(K.credits, [
      { id: uid(), customerId: c[0]?.id, amount: 1200, due: today(), status: "pending" },
      { id: uid(), customerId: c[1]?.id, amount: 800, due: today(), status: "paid" }
    ]);
  }

  if (!localStorage.getItem(K.sales)) {
    write(K.sales, [
      { id: uid(), date: today(), mode: "cash", amount: 2200, status: "paid" },
      { id: uid(), date: today(), mode: "upi", amount: 1800, status: "paid" }
    ]);
  }
}
function ensureDemoUser() {
  setMode("demo");
  const K = activeKeys();

  let user = read(K.user, null);
  if (!user) {
    user = {
      ownerName: "Demo Vendor",
      mobile: "9999999999",
      businessType: "Kirana / Grocery",
      city: "Vellore",
      upi: "demo@upi",
      dailySales: 5000,
      udhaar: "yes",
      pendingUdhaar: 12000,
      createdAt: today(),
      _password: "demo123"
    };
    write(K.user, user);
  }
  seed();
  return user;
}

function wireLandingModal() {
  const overlay = $("modalOverlay");
  if (!overlay) return;

  const openBtns = [
    $("openModalBtn"),
    $("openModalBtn2"),
    $("openModalBtn3"),
    $("openSignInBtn"),
    $("openSignInBtn2")
  ].filter(Boolean);

  const closeBtn = $("closeModalBtn");

  function openModal(tab = "signup") {
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    switchTab(tab);
  }

  function closeModal() {
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "auto";
  }

  function switchTab(tab) {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    const btn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
    const content = document.querySelector(`.tab-content[data-content="${tab}"]`);
    if (btn) btn.classList.add("active");
    if (content) content.classList.add("active");
  }

  openBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const isSignIn = btn.id.toLowerCase().includes("signin");
      openModal(isSignIn ? "signin" : "signup");
    });
  });

  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
  const goDash = $("goDashboardBtn");
  if (goDash) {
    goDash.addEventListener("click", (e) => {
      e.preventDefault();
      ensureDemoUser();
      window.location.href = "dashboard.html";
    });
  }
  const signupForm = $("signupForm");
  const signupMsg = $("signupMessage");

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(signupForm);

      const ownerName = (fd.get("ownerName") || "").toString().trim();
      const mobile = (fd.get("mobile") || "").toString().trim();
      const businessType = (fd.get("businessType") || "").toString().trim();
      const city = (fd.get("city") || "").toString().trim();
      const upi = (fd.get("upi") || "").toString().trim();
      const password = (fd.get("password") || "").toString();

      signupMsg.className = "form-message";

      if (!ownerName || !mobile || !businessType || !city || !password) {
        signupMsg.textContent = "Please fill all required fields (*)";
        signupMsg.classList.add("error");
        return;
      }
      if (!/^[6-9]\d{9}$/.test(mobile)) {
        signupMsg.textContent = "Enter a valid 10-digit Indian mobile number.";
        signupMsg.classList.add("error");
        return;
      }
      if (password.length < 6) {
        signupMsg.textContent = "Password must be at least 6 characters.";
        signupMsg.classList.add("error");
        return;
      }

      try {
        const payload = { ownerName, mobile, businessType, city, upi, password };
        const res = await api("/auth/signup", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          signupMsg.textContent = data.detail || "Signup failed";
          signupMsg.classList.add("error");
          return;
        }

        setMode("real");
        if (data.access_token) setToken(data.access_token);

        write(DB.user, { ownerName: data.ownerName || ownerName, mobile });

        signupMsg.textContent = "✅ Account created! Opening Dashboard...";
        signupMsg.classList.add("success");

        setTimeout(() => {
          closeModal();
          window.location.href = "dashboard.html";
        }, 500);
      } catch (err) {
        signupMsg.textContent = "Server not reachable. Start backend first.";
        signupMsg.classList.add("error");
      }
    });
  }

  const signinForm = $("signinForm");
  const signinMsg = $("signinMessage");

  if (signinForm) {
    signinForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(signinForm);

      const login = (fd.get("login") || "").toString().trim();
      const pass = (fd.get("loginPassword") || "").toString();

      signinMsg.className = "form-message";

      if (!login || !pass) {
        signinMsg.textContent = "Enter mobile and password.";
        signinMsg.classList.add("error");
        return;
      }

      try {
        const payload = { mobile: login, password: pass };
        const res = await api("/auth/login", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          signinMsg.textContent = data.detail || "Invalid credentials";
          signinMsg.classList.add("error");
          return;
        }

        setMode("real");
        if (data.access_token) setToken(data.access_token);

        write(DB.user, { ownerName: data.ownerName || "Vendor", mobile: login });

        signinMsg.textContent = "✅ Signed in! Opening Dashboard...";
        signinMsg.classList.add("success");

        setTimeout(() => {
          closeModal();
          window.location.href = "dashboard.html";
        }, 450);
      } catch (err) {
        signinMsg.textContent = "Server not reachable. Start backend first.";
        signinMsg.classList.add("error");
      }
    });
  }
}

function computeTrust() {
  const K = activeKeys();
  const credits = isDemo() ? read(K.credits, []) : (window.__REAL_CREDITS__ || []);
  const sales = isDemo() ? read(K.sales, []) : (window.__REAL_SALES__ || []);

  const totalCredits = credits.length || 1;
  const paid = credits.filter(c => (c.status === "paid" || c.status === "PAID")).length;

  const pending = credits
    .filter(c => !(c.status === "paid" || c.status === "PAID"))
    .reduce((s, c) => s + Number(c.amount || 0), 0);

  const repayRate = Math.round((paid / totalCredits) * 100);
  const lastSales = sales.slice(-10);
  const revenueStability = Math.min(95, 40 + lastSales.length * 5);
  const debtRatio = Math.min(100, Math.round(pending / 100));

  let score = Math.round(
    repayRate * 0.5 +
    revenueStability * 0.3 +
    (100 - debtRatio) * 0.2
  );
  score = Math.max(1, Math.min(100, score));

  let tag = "Risky";
  if (score >= 80) tag = "Excellent";
  else if (score >= 65) tag = "Good";
  else if (score >= 45) tag = "Average";

  return { score, tag, repayRate, revenueStability, debtRatio };
}

async function loadRealDataIfNeeded() {
  if (!isReal()) return;
  if (!getToken()) {
    window.location.href = "index.html";
    return;
  }

  try {
    const cRes = await api("/customers", { method: "GET" });
    const customers = await cRes.json().catch(() => []);
    window.__REAL_CUSTOMERS__ = Array.isArray(customers) ? customers : (customers.items || []);

    const crRes = await api("/credits", { method: "GET" });
    const credits = await crRes.json().catch(() => []);
    window.__REAL_CREDITS__ = Array.isArray(credits) ? credits : (credits.items || []);

    const sRes = await api("/sales", { method: "GET" });
    const sales = await sRes.json().catch(() => []);
    window.__REAL_SALES__ = Array.isArray(sales) ? sales : (sales.items || []);
  } catch (e) {
    setMode("demo");
    ensureDemoUser();
  }
}
function renderDashboard() {
  if (!$("kpiSales")) return;
  if (isDemo()) seed();

  const K = activeKeys();

  const credits = isDemo() ? read(K.credits, []) : (window.__REAL_CREDITS__ || []);
  const sales = isDemo() ? read(K.sales, []) : (window.__REAL_SALES__ || []);
  const trust = computeTrust();

  $("kpiSales").textContent = money(
    sales.filter(s => (s.date || s.createdAt || "").toString().slice(0, 10) === today())
      .reduce((sum, x) => sum + Number(x.amount || 0), 0)
  );

  $("kpiPending").textContent = money(
    credits.filter(c => !(c.status === "paid" || c.status === "PAID"))
      .reduce((sum, c) => sum + Number(c.amount || 0), 0)
  );

  $("kpiRecovered").textContent = money(
    credits.filter(c => (c.status === "paid" || c.status === "PAID"))
      .reduce((sum, c) => sum + Number(c.amount || 0), 0)
  );

  $("kpiScore").textContent = trust.score + "%";
  $("kpiScoreMeta").textContent = trust.tag;

  const customers = isDemo() ? read(K.customers, []) : (window.__REAL_CUSTOMERS__ || []);

  $("recentCredits").innerHTML = credits.slice(-5).reverse().map(c => {
    const cust = customers.find(x => (x.id == c.customerId) || (x.id == c.customer_id));
    return `<tr>
      <td>${cust?.name || "Unknown"}</td>
      <td>${money(c.amount)}</td>
      <td>${c.due || c.dueDate || "-"}</td>
      <td>${c.status}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="4">No credits yet</td></tr>`;

  $("recentSales").innerHTML = sales.slice(-5).reverse().map(s => `
    <tr>
      <td>${(s.date || s.createdAt || "").toString().slice(0, 10)}</td>
      <td>${s.mode}</td>
      <td>${money(s.amount)}</td>
    </tr>
  `).join("") || `<tr><td colspan="3">No sales yet</td></tr>`;

  if ($("vendorChip")) {
    if (isDemo()) {
      const u = getUser();
      $("vendorChip").textContent = u?.ownerName ? u.ownerName : "Demo Vendor";
    } else {
      const u = read(DB.user, null);
      $("vendorChip").textContent = u?.ownerName || "Vendor";
    }
  }

  if ($("qaAddCustomer")) $("qaAddCustomer").onclick = showAddCustomer;
  if ($("qaAddCredit")) $("qaAddCredit").onclick = showAddCredit;
  if ($("qaAddSale")) $("qaAddSale").onclick = showAddSale;
  if ($("qaRecompute")) $("qaRecompute").onclick = () => { alert("Trust Score Updated!"); renderDashboard(); };
}

function renderCustomers(){ if(!$("customerTable")) return;
  if (isDemo()) seed();

  const K = activeKeys();
  const customers = isDemo() ? read(K.customers, []) : (window.__REAL_CUSTOMERS__ || []);

  $("customerTable").innerHTML = customers.map(c=>`
    <tr><td>${c.name}</td><td>${c.phone||c.mobile||"-"}</td><td>${c.notes||"-"}</td>
    <td>${isDemo() ? `<button class="mini-btn danger" data-del="${c.id}">Delete</button>` : `<span class="muted">API</span>`}</td></tr>`
  ).join("") || `<tr><td colspan="4">No customers</td></tr>`;

  if (isDemo()) {
    document.querySelectorAll("[data-del]").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const id=btn.getAttribute("data-del");
        const list = read(K.customers, []);
        write(K.customers, list.filter(c=>c.id!==id));
        write(K.credits, read(K.credits, []).filter(cr=>cr.customerId!==id));
        renderCustomers();
      });
    });
  }

  if($("openAddCustomer")) $("openAddCustomer").onclick=showAddCustomer;
}

function renderLedger() {
  if (!$("creditTable")) return;

  if (isDemo()) seed();

  const K = activeKeys();
  const customers = isDemo() ? read(K.customers, []) : (window.__REAL_CUSTOMERS__ || []);
  const credits = isDemo() ? read(K.credits, []) : (window.__REAL_CREDITS__ || []);
  const sales = isDemo() ? read(K.sales, []) : (window.__REAL_SALES__ || []);

  const table = $("creditTable");

  table.innerHTML = credits.slice().reverse().map(c => {
    const cust = customers.find(x => (x.id == c.customerId) || (x.id == c.customer_id));
    const isPaid = (c.status === "paid" || c.status === "PAID");

    return `
      <tr data-id="${c.id}">
        <td>
          ${
            (!isPaid && isDemo())
              ? `<span class="clickable-name" style="color:#2d7ff9; cursor:pointer; font-weight:600;">
                  ${cust?.name || "Unknown"}
                 </span>`
              : cust?.name || "Unknown"
          }
        </td>
        <td class="amount-cell">${money(c.amount)}</td>
        <td>${c.due || c.dueDate || "-"}</td>
        <td class="status-cell">${c.status}</td>
        <td>
          ${
            isPaid
              ? `<span class="muted">--</span>`
              : (isDemo() ? `<span style="color:#999;">Click name to pay</span>` : `<span class="muted">API</span>`)
          }
        </td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="5">No udhaar yet</td></tr>`;
  if (isDemo()) {
    document.querySelectorAll(".clickable-name").forEach(nameEl => {
      nameEl.addEventListener("click", function () {

        const parentRow = this.closest("tr");
        const creditId = parentRow.getAttribute("data-id");

        const existingPanel = document.getElementById("upiRow");
        if (existingPanel) existingPanel.remove();

        const amountText = parentRow.querySelector(".amount-cell").textContent;
        const amountValue = amountText.replace(/[^\d]/g, "");

        const newRow = document.createElement("tr");
        newRow.id = "upiRow";

        newRow.innerHTML = `
          <td colspan="5">
            <div style="
              margin:10px 0;
              padding:15px;
              border-radius:10px;
              background:#f9fafb;
              box-shadow:0 4px 12px rgba(0,0,0,0.1);
            ">
              <h4 style="margin-bottom:10px;">💳 UPI Payment</h4>
              <p><strong>Amount:</strong> ₹${amountValue}</p>

              <button 
                id="confirmUpiBtn"
                style="
                  padding:8px 16px;
                  background:#2d7ff9;
                  color:white;
                  border:none;
                  border-radius:6px;
                  cursor:pointer;
                ">
                Confirm Payment
              </button>
            </div>
          </td>
        `;

        parentRow.after(newRow);

        document.getElementById("confirmUpiBtn").onclick = function () {
          const updatedCredits = read(K.credits, []).map(c =>
            c.id === creditId ? { ...c, status: "paid" } : c
          );
          write(K.credits, updatedCredits);

          renderLedger();
          renderDashboard();
        };
      });
    });
  }
  const salesTable = $("salesTable");
  salesTable.innerHTML = "";

  if (sales.length === 0) {
    salesTable.innerHTML = `<tr><td colspan="3">No sales yet</td></tr>`;
  } else {
    sales.slice().reverse().forEach(sale => {
      const isUpi = sale.mode === "upi";
      const statusTag = (sale.status === "paid" || sale.status === "PAID") ? " ✅" : "";

      const row = document.createElement("tr");
      row.setAttribute("data-id", sale.id);

      row.innerHTML = `
        <td>${(sale.date || sale.createdAt || "").toString().slice(0,10)}</td>
        <td>${sale.mode}</td>
        <td class="sale-amount-cell" style="${isUpi && sale.status !== 'paid' && isDemo() ? 'color:#2d7ff9; cursor:pointer; font-weight:600;' : ''}">
          ${money(sale.amount)}${statusTag}
        </td>
      `;

      salesTable.appendChild(row);
      if (isDemo() && isUpi && sale.status !== "paid") {
        row.querySelector(".sale-amount-cell").addEventListener("click", () => {
          const existingPanel = document.getElementById("upiRowSale");
          if (existingPanel) existingPanel.remove();

          const newRow = document.createElement("tr");
          newRow.id = "upiRowSale";

          newRow.innerHTML = `
            <td colspan="3">
              <div style="
                margin:10px 0;
                padding:15px;
                border-radius:10px;
                background:#f9fafb;
                box-shadow:0 4px 12px rgba(0,0,0,0.1);
              ">
                <h4 style="margin-bottom:10px;">💳 UPI Payment</h4>
                <p><strong>Amount:</strong> ${money(sale.amount)}</p>
                <button id="confirmUpiSaleBtn" style="
                  padding:8px 16px;
                  background:#2d7ff9;
                  color:white;
                  border:none;
                  border-radius:6px;
                  cursor:pointer;
                ">Confirm Payment</button>
              </div>
            </td>
          `;

          row.after(newRow);

          document.getElementById("confirmUpiSaleBtn").onclick = function () {
            const updatedSales = read(K.sales, []).map(s =>
              s.id === sale.id ? { ...s, status: "paid" } : s
            );
            write(K.sales, updatedSales);
            renderLedger();
            renderDashboard();
          };
        });
      }
    });
  }

  if ($("openAddCredit")) $("openAddCredit").onclick = showAddCredit;
  if ($("openAddSale")) $("openAddSale").onclick = showAddSale;
}

function showAddSale() {
  openMiniModal("Add Sale", `
    <form id="addSaleForm" class="mini-form">
      <div class="form-row">
        <label>Date</label>
        <input type="date" name="date" value="${today()}" required />
      </div>
      <div class="form-row">
        <label>Mode *</label>
        <select name="mode">
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
        </select>
      </div>
      <div class="form-row">
        <label>Amount (₹) *</label>
        <input type="number" name="amount" min="1" required />
      </div>
      <button class="primary-btn" type="submit">Proceed</button>
    </form>
  `);

  const form = document.getElementById("addSaleForm");

  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    if (isReal()) {
      try {
        const payload = {
          date: data.date || today(),
          mode: data.mode,
          amount: Number(data.amount || 0)
        };
        const res = await api("/sales", { method: "POST", body: JSON.stringify(payload) });
        if (!res.ok) {
          alert("Failed to add sale (API).");
          return;
        }
        await loadRealDataIfNeeded();
        closeMiniModal();
        renderLedger();
        renderDashboard();
        return;
      } catch (e2) {
        alert("Backend not reachable.");
        return;
      }
    }
    const K = activeKeys();
    const salesList = read(K.sales, []);
    const newSale = {
      id: uid(),
      date: data.date || today(),
      mode: data.mode,
      amount: Number(data.amount || 0),
      status: data.mode === "upi" ? "pending" : "paid"
    };
    salesList.push(newSale);
    write(K.sales, salesList);

    closeMiniModal();
    renderLedger();
    renderDashboard();
  };
}

function renderTrustScore(){ if(!$("scoreBig")) return;
  const t=computeTrust();
  $("scoreBig").textContent=t.score+"%";
  $("scoreTag").textContent=t.tag;
  $("brRepay").textContent=t.repayRate+"%";
  $("brStability").textContent=t.revenueStability+"%";
  $("brDebt").textContent=t.debtRatio+"%";
  if($("recomputeScore")) $("recomputeScore").onclick=()=>{alert("Updated!");renderTrustScore();};
}

function renderLoan(){ if(!$("loanScore")) return;
  if (isDemo()) seed();
  const user=getUser(); const t=computeTrust();
  const K = activeKeys();
  const credits=isDemo()?read(K.credits,[]):(window.__REAL_CREDITS__||[]);
  const sales=isDemo()?read(K.sales,[]):(window.__REAL_SALES__||[]);
  if($("loanVendor")) $("loanVendor").textContent=user?.ownerName?`${user.ownerName} (${user.businessType||"Business"})`:"Vendor";
  $("loanScore").textContent=t.score+"%";
  const monthlyRevenue=sales.reduce((s,x)=>s+Number(x.amount||0),0)*2;
  if($("loanRevenue")) $("loanRevenue").textContent=money(monthlyRevenue);
  const pending=credits.filter(c=>!(c.status==="paid"||c.status==="PAID")).reduce((s,c)=>s+Number(c.amount||0),0);
  if($("loanPending")) $("loanPending").textContent=money(pending);
  if($("loanReco")) $("loanReco").textContent=(t.score>=80)?"✅ Eligible for instant micro-loan (low risk).":(t.score>=60)?"✅ Eligible with verification.":"⚠ Improve repayment consistency to unlock loans.";
}
function openMiniModal(title, html){
  if(!$("miniModal")) return;
  $("miniTitle").textContent=title;
  $("miniBody").innerHTML=html;
  $("miniModal").classList.add("show");
}
function closeMiniModal(){ if($("miniModal")) $("miniModal").classList.remove("show"); }

function showAddCustomer(){
  openMiniModal("Add Customer",`
    <form id="addCustomerForm" class="mini-form">
      <div class="form-row"><label>Name *</label><input name="name" required /></div>
      <div class="form-row"><label>Phone</label><input name="phone" /></div>
      <div class="form-row"><label>Notes</label><input name="notes" /></div>
      <button class="primary-btn" type="submit">Save</button>
      <div class="form-message" id="miniMsg"></div>
    </form>
  `);
  const form=document.getElementById("addCustomerForm");
  const msg=document.getElementById("miniMsg");

  form.onsubmit = async (e)=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(form).entries());

    if (isReal()) {
      try {
        const payload = { name: (data.name||"").trim(), phone: (data.phone||"").trim(), notes: (data.notes||"").trim() };
        const res = await api("/customers", { method:"POST", body: JSON.stringify(payload) });
        if (!res.ok) { alert("Failed to add customer (API)"); return; }
        await loadRealDataIfNeeded();
        msg.textContent="✅ Saved!";
        msg.className="form-message success";
        setTimeout(()=>{closeMiniModal();renderCustomers();renderDashboard();},300);
        return;
      } catch {
        alert("Backend not reachable.");
        return;
      }
    }
    const K = activeKeys();
    const list=read(K.customers,[]);
    list.push({id:uid(),name:(data.name||"").trim(),phone:(data.phone||"").trim(),notes:(data.notes||"").trim()});
    write(K.customers,list);
    msg.textContent="✅ Saved!";
    msg.className="form-message success";
    setTimeout(()=>{closeMiniModal();renderCustomers();renderDashboard();},300);
  };
}

function showAddCredit(){
  const K = activeKeys();
  const customers = isDemo() ? read(K.customers,[]) : (window.__REAL_CUSTOMERS__||[]);
  if(customers.length===0){alert("Add a customer first!");return;}

  openMiniModal("Add Udhaar",`
    <form id="addCreditForm" class="mini-form">
      <div class="form-row"><label>Customer *</label>
        <select name="customerId">${customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join("")}</select>
      </div>
      <div class="form-row"><label>Amount (₹) *</label><input type="number" name="amount" min="1" required/></div>
      <div class="form-row"><label>Due Date</label><input type="date" name="due" value="${today()}"/></div>
      <button class="primary-btn" type="submit">Add</button>
      <div class="form-message" id="miniMsg"></div>
    </form>
  `);

  const form=document.getElementById("addCreditForm");
  const msg=document.getElementById("miniMsg");

  form.onsubmit = async (e)=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(form).entries());

    if (isReal()) {
      try {
        const payload = {
          customerId: Number(data.customerId),
          amount: Number(data.amount),
          dueDate: data.due || today()
        };
        const res = await api("/credits", { method:"POST", body: JSON.stringify(payload) });
        if (!res.ok) { alert("Failed to add credit (API)"); return; }
        await loadRealDataIfNeeded();
        msg.textContent="✅ Udhaar added!";
        msg.className="form-message success";
        setTimeout(()=>{closeMiniModal();renderLedger();renderDashboard();},300);
        return;
      } catch {
        alert("Backend not reachable.");
        return;
      }
    }

    // demo unchanged
    const list=read(K.credits,[]);
    list.push({id:uid(),customerId:data.customerId,amount:Number(data.amount),due:data.due||today(),status:"pending"});
    write(K.credits,list);
    msg.textContent="✅ Udhaar added!";
    msg.className="form-message success";
    setTimeout(()=>{closeMiniModal();renderLedger();renderDashboard();},300);
  };
}
function showAddSale() {
  openMiniModal("Add Sale", `
    <form id="addSaleForm" class="mini-form">
      <div class="form-row">
        <label>Date</label>
        <input type="date" name="date" value="${today()}" required />
      </div>
      <div class="form-row">
        <label>Mode *</label>
        <select name="mode">
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
        </select>
      </div>
      <div class="form-row">
        <label>Amount (₹) *</label>
        <input type="number" name="amount" min="1" required />
      </div>
      <button class="primary-btn" type="submit">Proceed</button>
    </form>
  `);

  const form = document.getElementById("addSaleForm");

  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    if (isReal()) {
      try {
        const payload = { date: data.date || today(), mode: data.mode, amount: Number(data.amount || 0) };
        const res = await api("/sales", { method: "POST", body: JSON.stringify(payload) });
        if (!res.ok) { alert("Failed to add sale (API)"); return; }
        await loadRealDataIfNeeded();
        closeMiniModal();
        renderLedger();
        renderDashboard();
        return;
      } catch {
        alert("Backend not reachable.");
        return;
      }
    }

    const K = activeKeys();
    const salesList = read(K.sales, []);
    const newSale = {
      id: uid(),
      date: data.date || today(),
      mode: data.mode,
      amount: Number(data.amount || 0),
      status: data.mode === "upi" ? "pending" : "paid"
    };
    salesList.push(newSale);
    write(K.sales, salesList);

    closeMiniModal();
    renderLedger();
    renderDashboard();
  };
}

function saveSale(data){
  const K = activeKeys();
  const sales = read(K.sales, []);
  sales.push({
    id: uid(),
    date: data.date || today(),
    mode: data.mode,
    amount: Number(data.amount)
  });
  write(K.sales, sales);
}
document.addEventListener("DOMContentLoaded", async () => {
  if (isIndex()) wireLandingModal();
  if (isAppPage() && isReal()) {
    await loadRealDataIfNeeded();
  }

  protect();

  if ($("logoutBtn")) $("logoutBtn").onclick = logout;

  if ($("miniClose")) $("miniClose").onclick = closeMiniModal;
  if ($("miniModal")) $("miniModal").addEventListener("click", (e) => { if (e.target === $("miniModal")) closeMiniModal(); });

  renderDashboard();
  renderCustomers();
  renderLedger();
  renderTrustScore();
  renderLoan();
});