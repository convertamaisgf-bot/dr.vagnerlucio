const SITE_CONFIG = Object.freeze({
  whatsappNumber: "5521998798777",
  googleAdsId: "AW-1811050205",
  googleAdsWhatsappConversion: "AW-1811050205/jZdcJW08ascEO2a4btD",
  consentStorageKey: "vagner-privacy-choice-v1",
});

const CONSENT = Object.freeze({
  granted: "granted",
  denied: "denied",
});

let googleAdsLoaded = false;

const readConsentChoice = () => {
  try {
    const choice = window.localStorage.getItem(SITE_CONFIG.consentStorageKey);
    return Object.values(CONSENT).includes(choice) ? choice : null;
  } catch {
    return null;
  }
};

const storeConsentChoice = (choice) => {
  try {
    window.localStorage.setItem(SITE_CONFIG.consentStorageKey, choice);
  } catch {
    // O site e o WhatsApp continuam funcionais quando o armazenamento está bloqueado.
  }
};

let activeConsentChoice = readConsentChoice();

const clearGoogleAdsCookies = () => {
  const host = window.location.hostname.replace(/^www\./, "");
  const domainVariants = ["", `; domain=${window.location.hostname}`, `; domain=.${host}`];

  document.cookie.split(";").forEach((entry) => {
    const cookieName = entry.split("=")[0].trim();
    if (cookieName.startsWith("_gcl_")) {
      domainVariants.forEach((domain) => {
        document.cookie = `${cookieName}=; Max-Age=0; path=/${domain}; SameSite=Lax`;
      });
    }
  });
};

const ensureGtagQueue = () => {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };
};

const loadGoogleAds = () => {
  ensureGtagQueue();

  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
  });

  window.gtag("consent", "update", {
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "denied",
    analytics_storage: "denied",
  });

  if (googleAdsLoaded) return;
  googleAdsLoaded = true;

  window.gtag("js", new Date());
  window.gtag("config", SITE_CONFIG.googleAdsId, {
    allow_ad_personalization_signals: false,
  });

  const googleTag = document.createElement("script");
  googleTag.async = true;
  googleTag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(SITE_CONFIG.googleAdsId)}`;
  googleTag.dataset.googleAdsTag = "true";
  document.head.append(googleTag);
};

const updateGoogleConsent = (choice) => {
  if (choice === CONSENT.granted) {
    loadGoogleAds();
    return;
  }

  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
  }
  clearGoogleAdsCookies();
};

const createConsentBanner = () => {
  const banner = document.createElement("section");
  banner.className = "consent-banner";
  banner.dataset.consentBanner = "";
  banner.setAttribute("aria-labelledby", "consent-title");
  banner.hidden = true;
  banner.innerHTML = `
    <div class="consent-panel">
      <div class="consent-copy">
        <h2 id="consent-title">Sua privacidade, sua escolha</h2>
        <p>Este site usa o Google Ads somente para medir se uma visita resultou em contato pelo WhatsApp. A medição só é ativada com sua autorização. <a href="privacidade.html">Entenda como os dados são tratados</a>.</p>
      </div>
      <div class="consent-actions">
        <button class="consent-button consent-secondary" type="button" data-consent-deny>Recusar medição</button>
        <button class="consent-button consent-primary" type="button" data-consent-accept>Aceitar medição</button>
      </div>
    </div>`;
  document.body.append(banner);
  return banner;
};

const consentBanner = createConsentBanner();
const consentAcceptButton = consentBanner.querySelector("[data-consent-accept]");
const consentDenyButton = consentBanner.querySelector("[data-consent-deny]");

const showConsentBanner = ({ focus = false } = {}) => {
  consentBanner.hidden = false;
  document.body.classList.add("consent-visible");
  if (focus) consentDenyButton.focus();
};

const hideConsentBanner = () => {
  consentBanner.hidden = true;
  document.body.classList.remove("consent-visible");
};

const chooseConsent = (choice) => {
  activeConsentChoice = choice;
  storeConsentChoice(choice);
  updateGoogleConsent(choice);
  hideConsentBanner();
};

consentAcceptButton.addEventListener("click", () => chooseConsent(CONSENT.granted));
consentDenyButton.addEventListener("click", () => chooseConsent(CONSENT.denied));

document.querySelectorAll("[data-cookie-settings]").forEach((button) => {
  button.addEventListener("click", () => showConsentBanner({ focus: true }));
});

if (activeConsentChoice) {
  updateGoogleConsent(activeConsentChoice);
} else {
  showConsentBanner();
}

document.querySelectorAll("[data-whatsapp-message]").forEach((link) => {
  const message = link.dataset.whatsappMessage;
  link.href = `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;

  link.addEventListener("click", () => {
    if (link.dataset.googleAdsConversion !== "whatsapp") return;
    if (activeConsentChoice !== CONSENT.granted || typeof window.gtag !== "function") return;

    window.gtag("event", "conversion", {
      send_to: SITE_CONFIG.googleAdsWhatsappConversion,
      transport_type: "beacon",
    });
  });
});

const menuButton = document.querySelector("[data-menu-button]");
const menu = document.querySelector("[data-menu]");

if (menuButton && menu) {
  const setMenu = (open) => {
    menuButton.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    menuButton.querySelector(".sr-only").textContent = open ? "Fechar menu" : "Abrir menu";
  };

  menuButton.addEventListener("click", () => {
    setMenu(menuButton.getAttribute("aria-expanded") !== "true");
  });

  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      menuButton.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 980) setMenu(false);
  });
}

const header = document.querySelector("[data-header]");
if (header) {
  const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 16);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}
