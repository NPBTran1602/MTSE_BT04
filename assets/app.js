const API_BASE = "";
let productsCache = [];

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }
  return data;
}

function getSession() {
  const raw = localStorage.getItem("milkteaSession");
  return raw ? JSON.parse(raw) : null;
}

function saveSession(session) {
  localStorage.setItem("milkteaSession", JSON.stringify(session));
}

function requireMember() {
  const session = getSession();
  const authPaths = ["/", "/login", "/login.html", "/register", "/forgot-password", "/verify-otp"];
  const isAuthPage = authPaths.includes(location.pathname);
  if (!session && !isAuthPage) {
    location.href = "/login";
    return null;
  }
  if (session && isAuthPage) {
    location.href = "index.html";
    return session.member;
  }
  return session ? session.member : null;
}

function stockLabel(stock) {
  if (stock <= 0) return { text: "Het hang", className: "bg-rose-100 text-rose-700" };
  if (stock <= 10) return { text: "Sap het hang", className: "bg-amber-100 text-amber-800" };
  return { text: "Con hang", className: "bg-emerald-100 text-emerald-700" };
}

function productCard(product, compact = false) {
  const stock = stockLabel(product.stock);
  return `
    <article class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <a href="product.html?id=${product.id}" class="block">
        <img class="h-52 w-full object-cover" src="${product.images[0]}" alt="${product.name}" />
      </a>
      <div class="p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.12em] text-tea">${product.category}</p>
            <h3 class="mt-1 font-bold leading-snug">${product.name}</h3>
          </div>
          <span class="shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${stock.className}">${stock.text}</span>
        </div>
        <p class="mt-2 line-clamp-2 text-sm text-slate-600">${product.description}</p>
        <div class="mt-4 flex items-end justify-between gap-3">
          <div>
            <p class="text-lg font-black text-berry">${currency.format(product.price)}</p>
            ${product.oldPrice ? `<p class="text-xs text-slate-400 line-through">${currency.format(product.oldPrice)}</p>` : ""}
          </div>
          <div class="text-right text-xs text-slate-500">
            <p>Ton: <b class="text-slate-800">${product.stock}</b></p>
            <p>Da ban: <b class="text-slate-800">${product.sold}</b></p>
          </div>
        </div>
        ${compact ? "" : `<a href="product.html?id=${product.id}" class="mt-4 inline-flex w-full justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-tea">Xem chi tiet</a>`}
      </div>
    </article>
  `;
}

function fillMemberBadge(member) {
  document.querySelectorAll("#memberBadge").forEach((el) => {
    el.classList.remove("hidden");
    el.innerHTML = `<p class="font-bold text-slate-900">${member.name}</p><p class="text-slate-500">${member.role} - ${member.level} - ${member.points} diem</p>`;
  });
  document.querySelectorAll("#logoutBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      localStorage.removeItem("milkteaSession");
      location.href = "login.html";
    });
  });
}

function setFormMessage(elementId, message, type = "success") {
  const element = document.getElementById(elementId);
  if (!element) return;
  element.textContent = message;
  element.className = `rounded-md px-4 py-3 text-sm ${type === "error" ? "bg-rose-50 text-rose-700" : "bg-teal-50 text-teal-700"}`;
}

function initAuth() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  const authRoutes = {
    login: "/login",
    register: "/register",
    forgot: "/forgot-password",
    otp: "/verify-otp"
  };

  function panelFromPath() {
    if (location.pathname === "/register") return "register";
    if (location.pathname === "/forgot-password") return "forgot";
    if (location.pathname === "/verify-otp") return "otp";
    return "login";
  }

  function getPendingOtp() {
    const raw = sessionStorage.getItem("pendingOtp");
    return raw ? JSON.parse(raw) : null;
  }

  function setPendingOtp(email, purpose, extra = {}) {
    sessionStorage.setItem("pendingOtp", JSON.stringify({ email, purpose, ...extra }));
  }

  function clearPendingOtp() {
    sessionStorage.removeItem("pendingOtp");
  }

  function fillOtpPanel() {
    const pending = getPendingOtp();
    const isReset = pending?.purpose === "reset-password";
    const resetVerified = isReset && pending.resetVerified;
    document.getElementById("otpTitle").textContent = resetVerified
      ? "Dat mat khau moi"
      : isReset ? "Xac thuc dat lai mat khau" : "Xac thuc dang ky";
    document.getElementById("otpHint").textContent = pending?.email
      ? resetVerified
        ? `OTP da duoc xac thuc cho ${pending.email}. Vui long nhap mat khau moi.`
        : `Ma OTP da duoc gui den ${pending.email}. Ma co hieu luc trong 5 phut.`
      : "Vui long bat dau tu trang dang ky hoac quen mat khau de nhan OTP.";
    document.getElementById("otpCodeBox").classList.toggle("hidden", resetVerified);
    document.getElementById("otpCode").required = !resetVerified;
    document.getElementById("otpPasswordBox").classList.toggle("hidden", !resetVerified);
    document.getElementById("otpNewPassword").required = resetVerified;
    document.getElementById("otpSubmitBtn").textContent = resetVerified
      ? "Dat lai mat khau"
      : isReset ? "Xac thuc OTP" : "Xac thuc dang ky";
    document.getElementById("resendOtpBtn").classList.toggle("hidden", resetVerified);
    document.getElementById("otpBackLink").dataset.authLink = isReset ? "forgot" : "login";
    document.getElementById("otpBackLink").href = isReset ? "/forgot-password" : "/login";
    document.getElementById("otpBackLink").textContent = isReset ? "Quay lai quen mat khau" : "Quay lai dang nhap";
  }

  function showAuthPanel(target, updateUrl = false) {
    document.querySelectorAll(".auth-panel").forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.authPanel !== target);
    });
    if (target === "otp") fillOtpPanel();
    if (updateUrl && authRoutes[target] && location.pathname !== authRoutes[target]) {
      history.pushState({ authPanel: target }, "", authRoutes[target]);
    }
  }

  document.querySelectorAll("[data-auth-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      showAuthPanel(link.dataset.authLink, true);
    });
  });

  window.addEventListener("popstate", () => {
    showAuthPanel(panelFromPath());
  });

  showAuthPanel(panelFromPath());

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    try {
      const session = await api("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      saveSession(session);
      location.href = "index.html";
    } catch (error) {
      setFormMessage("loginMessage", error.message, "error");
    }
  });

  document.getElementById("registerForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value.trim();

    try {
      const data = await api("/api/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password })
      });
      setPendingOtp(email, "register");
      setFormMessage("registerMessage", data.message);
      showAuthPanel("otp", true);
    } catch (error) {
      setFormMessage("registerMessage", error.message, "error");
    }
  });

  document.getElementById("forgotForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("forgotEmail").value.trim();

    try {
      const data = await api("/api/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      setPendingOtp(email, "reset-password");
      setFormMessage("forgotMessage", data.message);
      showAuthPanel("otp", true);
    } catch (error) {
      setFormMessage("forgotMessage", error.message, "error");
    }
  });

  document.getElementById("otpForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const pending = getPendingOtp();
    const otp = document.getElementById("otpCode").value.trim();

    if (!pending?.email || !pending?.purpose) {
      setFormMessage("otpMessage", "Vui long bat dau tu trang dang ky hoac quen mat khau.", "error");
      return;
    }

    try {
      if (pending.purpose === "register") {
        const data = await api("/api/verify-register", {
          method: "POST",
          body: JSON.stringify({ email: pending.email, otp })
        });
        clearPendingOtp();
        document.getElementById("otpForm").reset();
        setFormMessage("loginMessage", data.message);
        showAuthPanel("login", true);
        return;
      }

      if (!pending.resetVerified) {
        const data = await api("/api/verify-reset-otp", {
          method: "POST",
          body: JSON.stringify({ email: pending.email, otp })
        });
        setPendingOtp(pending.email, pending.purpose, { resetVerified: true, verifiedOtp: otp });
        document.getElementById("otpForm").reset();
        setFormMessage("otpMessage", data.message);
        fillOtpPanel();
        return;
      }

      const data = await api("/api/reset-password", {
          method: "POST",
          body: JSON.stringify({
            email: pending.email,
            otp: pending.verifiedOtp,
            password: document.getElementById("otpNewPassword").value.trim()
          })
        });
      clearPendingOtp();
      document.getElementById("otpForm").reset();
      setFormMessage("loginMessage", data.message);
      showAuthPanel("login", true);
    } catch (error) {
      setFormMessage("otpMessage", error.message, "error");
    }
  });

  document.getElementById("resendOtpBtn").addEventListener("click", async () => {
    const pending = getPendingOtp();

    if (!pending?.email || !pending?.purpose) {
      setFormMessage("otpMessage", "Khong tim thay email dang cho xac thuc.", "error");
      return;
    }

    try {
      const data = await api("/api/resend-otp", {
        method: "POST",
        body: JSON.stringify({ email: pending.email, purpose: pending.purpose })
      });
      setPendingOtp(pending.email, pending.purpose);
      document.getElementById("otpCode").value = "";
      document.getElementById("otpNewPassword").value = "";
      fillOtpPanel();
      setFormMessage("otpMessage", data.message);
    } catch (error) {
      setFormMessage("otpMessage", error.message, "error");
    }
  });
}

async function initHome(member) {
  if (!document.getElementById("productGrid")) return;

  const [home, meta] = await Promise.all([api("/api/home"), api("/api/meta")]);

  document.getElementById("promoPanel").innerHTML = `
    <p class="text-sm font-bold uppercase tracking-[0.16em] text-berry">Thanh vien dang nhap</p>
    <h2 class="mt-2 text-2xl font-black">${member.name}</h2>
    <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
      <div class="rounded-md bg-teal-50 p-3"><p class="text-slate-500">Vai tro</p><b>${member.role}</b></div>
      <div class="rounded-md bg-amber-50 p-3"><p class="text-slate-500">Hang</p><b>${member.level}</b></div>
      <div class="rounded-md bg-rose-50 p-3"><p class="text-slate-500">Diem</p><b>${member.points}</b></div>
      <div class="rounded-md bg-slate-100 p-3"><p class="text-slate-500">Voucher</p><b>3 ma</b></div>
    </div>
  `;

  document.getElementById("promoGrid").innerHTML = home.promotions.map((product) => `
    <a href="product.html?id=${product.id}" class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:border-tea">
      <p class="text-sm font-bold text-berry">${product.promotion}</p>
      <h3 class="mt-2 text-lg font-black">${product.name}</h3>
      <p class="mt-2 text-sm text-slate-600">${product.category} - ton ${product.stock} - da ban ${product.sold}</p>
    </a>
  `).join("");

  document.getElementById("newProducts").innerHTML = home.newest.map((p) => productCard(p)).join("");
  document.getElementById("bestProducts").innerHTML = home.bestSellers.map((p) => productCard(p)).join("");

  const categoryFilter = document.getElementById("categoryFilter");
  const toppingFilter = document.getElementById("toppingFilter");
  categoryFilter.innerHTML = ["all", ...meta.categories].map((item) => `<option value="${item}">${item === "all" ? "Tat ca danh muc" : item}</option>`).join("");
  toppingFilter.innerHTML = ["all", ...meta.toppings].map((item) => `<option value="${item}">${item === "all" ? "Tat ca topping" : item}</option>`).join("");

  const filterIds = ["searchInput", "categoryFilter", "toppingFilter", "priceFilter", "stockFilter", "sortFilter"];
  filterIds.forEach((id) => document.getElementById(id).addEventListener("input", renderFilteredProducts));
  document.getElementById("resetFilters").addEventListener("click", () => {
    document.getElementById("searchInput").value = "";
    categoryFilter.value = "all";
    toppingFilter.value = "all";
    document.getElementById("priceFilter").value = "all";
    document.getElementById("stockFilter").value = "all";
    document.getElementById("sortFilter").value = "featured";
    renderFilteredProducts();
  });

  await renderFilteredProducts();
}

function buildProductQuery() {
  const params = new URLSearchParams();
  const keyword = document.getElementById("searchInput").value.trim();
  const category = document.getElementById("categoryFilter").value;
  const topping = document.getElementById("toppingFilter").value;
  const price = document.getElementById("priceFilter").value;
  const stock = document.getElementById("stockFilter").value;
  const sort = document.getElementById("sortFilter").value;

  if (keyword) params.set("search", keyword);
  if (category !== "all") params.set("category", category);
  if (topping !== "all") params.set("topping", topping);
  if (stock !== "all") params.set("stock", stock);
  if (sort) params.set("sort", sort);
  if (price !== "all") {
    const [priceMin, priceMax] = price.split("-");
    params.set("priceMin", priceMin);
    params.set("priceMax", priceMax);
  }
  return params.toString();
}

async function renderFilteredProducts() {
  const query = buildProductQuery();
  const data = await api(`/api/products${query ? `?${query}` : ""}`);
  productsCache = data.products;
  document.getElementById("productGrid").innerHTML = productsCache.map((product) => productCard(product)).join("");
  document.getElementById("resultCount").textContent = `${data.total} san pham phu hop`;
  document.getElementById("emptyState").classList.toggle("hidden", data.total > 0);
}

async function initDetail() {
  const container = document.getElementById("productDetail");
  if (!container) return;

  const id = new URLSearchParams(location.search).get("id") || "ts-tran-chau-duong-den";
  const [{ product }, relatedData] = await Promise.all([
    api(`/api/products/${id}`),
    api(`/api/products/${id}/related`)
  ]);
  const stock = stockLabel(product.stock);
  document.title = `${product.name} | Milktea House`;

  container.innerHTML = `
    <nav class="text-sm text-slate-500">
      <a class="hover:text-tea" href="index.html">Trang chu</a>
      <span class="mx-2">/</span>
      <a class="hover:text-tea" href="index.html#san-pham">${product.category}</a>
      <span class="mx-2">/</span>
      <span class="text-slate-900">${product.name}</span>
    </nav>
    <section class="mt-6 grid gap-8 lg:grid-cols-[1fr_440px]">
      <div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div class="swiper product-swiper">
          <div class="swiper-wrapper">
            ${product.images.map((image) => `<div class="swiper-slide"><img class="h-[360px] w-full object-cover sm:h-[520px]" src="${image}" alt="${product.name}" /></div>`).join("")}
          </div>
          <div class="swiper-pagination"></div>
          <div class="swiper-button-prev"></div>
          <div class="swiper-button-next"></div>
        </div>
      </div>
      <aside class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p class="text-sm font-bold uppercase tracking-[0.16em] text-tea">${product.category}</p>
        <h1 class="mt-2 text-3xl font-black">${product.name}</h1>
        <p class="mt-3 text-slate-600">${product.description}</p>
        <div class="mt-5 flex flex-wrap items-center gap-3">
          <p class="text-3xl font-black text-berry">${currency.format(product.price)}</p>
          ${product.oldPrice ? `<p class="text-slate-400 line-through">${currency.format(product.oldPrice)}</p>` : ""}
          <span class="rounded-full px-3 py-1 text-sm font-semibold ${stock.className}">${stock.text}</span>
        </div>
        <div class="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div class="rounded-md bg-slate-50 p-4"><p class="text-slate-500">Hang ton</p><b class="text-lg">${product.stock}</b></div>
          <div class="rounded-md bg-slate-50 p-4"><p class="text-slate-500">So luong da ban</p><b class="text-lg">${product.sold}</b></div>
        </div>
        <div class="mt-6">
          <p class="text-sm font-semibold">Topping phu hop</p>
          <div class="mt-2 flex flex-wrap gap-2">${product.toppings.map((item) => `<span class="rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-tea">${item}</span>`).join("")}</div>
        </div>
        <div class="mt-6">
          <label class="text-sm font-semibold">So luong</label>
          <div class="mt-2 flex w-40 items-center overflow-hidden rounded-md border border-slate-300">
            <button id="decreaseQty" class="w-11 px-3 py-2 text-lg font-bold hover:bg-slate-100" type="button">-</button>
            <input id="quantityInput" value="1" min="1" max="${Math.max(product.stock, 1)}" class="w-full border-x border-slate-300 py-2 text-center font-bold outline-none" />
            <button id="increaseQty" class="w-11 px-3 py-2 text-lg font-bold hover:bg-slate-100" type="button">+</button>
          </div>
        </div>
        <button ${product.stock === 0 ? "disabled" : ""} class="mt-6 w-full rounded-md ${product.stock === 0 ? "bg-slate-300 text-slate-500" : "bg-tea text-white hover:bg-teal-700"} px-5 py-3 font-semibold">${product.stock === 0 ? "Tam het hang" : "Them vao gio hang"}</button>
      </aside>
    </section>
  `;

  if (window.Swiper) {
    new Swiper(".product-swiper", {
      loop: product.images.length > 1,
      pagination: { el: ".swiper-pagination", clickable: true },
      navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" }
    });
  }

  const quantityInput = document.getElementById("quantityInput");
  const maxQty = Math.max(product.stock, 1);
  document.getElementById("decreaseQty").addEventListener("click", () => {
    quantityInput.value = Math.max(1, Number(quantityInput.value) - 1);
  });
  document.getElementById("increaseQty").addEventListener("click", () => {
    quantityInput.value = Math.min(maxQty, Number(quantityInput.value) + 1);
  });
  quantityInput.addEventListener("input", () => {
    const nextValue = Number(quantityInput.value) || 1;
    quantityInput.value = Math.min(maxQty, Math.max(1, nextValue));
  });

  document.getElementById("relatedProducts").innerHTML = relatedData.products.map((item) => productCard(item, true)).join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  initAuth();
  const member = requireMember();
  if (!member) return;
  fillMemberBadge(member);

  try {
    await initHome(member);
    await initDetail();
  } catch (error) {
    const target = document.getElementById("productGrid") || document.getElementById("productDetail");
    if (target) {
      target.innerHTML = `<div class="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-700">${error.message}</div>`;
    }
  }
});
