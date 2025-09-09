(function () {
  // =============================
  // Config
  // =============================
  const CONFIG = {
    BASE_URL: "https://282274fc051a.ngrok-free.app", // backend base URL (change as needed)
    API_KEY: "test-api-key-123", // your API key if required
  };

  const COOKIE_KEYS = {
    PARTNER_ID: "partner_id",
    MEMBER_ID: "member_id",
    IS_MEMBER_LINKED: "is_member_linked",
  };

  // =============================
  // Utility functions and variables
  // =============================
  function getMainDomain(hostname = window.location.hostname) {
    const parts = hostname.split(".");
    // localhost
    if (parts.length <= 2) return hostname;
    return parts.slice(-2).join(".");
  }
  const domain = getMainDomain();

  function getCookie(name) {
    const value = document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="));
    return value ? decodeURIComponent(value.split("=")[1]) : null;
  }

  function setOrUpdateCookie(name, value, days = 30) {
    let cookieStr = `${name}=${encodeURIComponent(value)}; path=/; max-age=${days * 24 * 60 * 60}`;
    if (domain) cookieStr += `; domain=${domain}`;
    document.cookie = cookieStr;
  }

  function postJSON(path, data) {
    return fetch(`${CONFIG.BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CONFIG.API_KEY,
      },
      body: JSON.stringify(data),
      credentials: "include", // send the cookie along
    }).then((res) => res.json().then((body) => ({ status: res.status, body })));
  }
  function getOrderId() {
    const el = document.querySelector("font.large_font_size");
    if (el) {
      return el.textContent.trim();
    }
    return null;
  }

  // =============================
  // Capturing & Storing partnerId
  // =============================
  (function handlePartnerId() {
    const partnerId = getCookie(COOKIE_KEYS.PARTNER_ID);
    const urlParams = new URLSearchParams(window.location.search);
    const urlPartnerId = urlParams.get("partner_id");

    // no override old partnerId
    if (urlPartnerId && (!partnerId || urlPartnerId == partnerId)) {
      setOrUpdateCookie(COOKIE_KEYS.PARTNER_ID, urlPartnerId, 30);
    }
  })();

  // =============================
  // Customizing Site (only on home page)
  // =============================
  (async function customizeSite() {
    if (window.location.pathname !== "/") return;

    const partnerId = getCookie(COOKIE_KEYS.PARTNER_ID);
    if (!partnerId) return;

    try {
      const res = await fetch(
        `${CONFIG.BASE_URL}/api/setting/site/${partnerId}`,
        {
          headers: { "x-api-key": CONFIG.API_KEY },
        },
      );
      if (!res.ok) return;
      const data = await res.json();

      if (data.logo) {
        //  const logoEl = document.querySelector("#partner-logo");
        // if (logoEl) logoEl.src = `/resources/${data.logo}`;
      }
      if (data.topImage) {
        // const topEl = document.querySelector("#partner-top-image");
        // if (topEl) topEl.src = `/resources/${data.topImage}`;
      }
      if (data.mainColor) {
        // document.documentElement.style.setProperty(
        //   "--main-color",
        //   data.mainColor,
        // );
      }
      if (data.subColor) {
        // document.documentElement.style.setProperty(
        //   "--sub-color",
        //   data.subColor,
        // );
      }
      if (data.headerTextColor) {
        // document.documentElement.style.setProperty(
        //   "--header-text-color",
        //   data.headerTextColor,
        // );
      }

      if (data.headerText) {
        // const headerEl = document.querySelector("#partner-header-text");
        // if (headerEl) headerEl.innerText = data.headerText;
      }
      console.log("Applied customization");
    } catch (err) {
      console.error("Customization error:", err);
    }
  })();

  // =============================
  // Linking Member Data
  // =============================

  (async function handleMemberLinking() {
    const partnerId = getCookie(COOKIE_KEYS.PARTNER_ID);

    let memberId = null;

    // fetch member info
    const res = await fetch("/view/page/metadata-member", {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!res.ok) {
      console.log("Bad response: " + res.status);
      return;
    }

    const json = await res.json();
    memberId = json.member_id || null;

    let cookieMemberId = getCookie(COOKIE_KEYS.MEMBER_ID);
    let isMemberLinked = getCookie(COOKIE_KEYS.IS_MEMBER_LINKED) === "true";

    if (memberId) {
      memberId = memberId.toString();
      if (memberId !== cookieMemberId) {
        setOrUpdateCookie(COOKIE_KEYS.MEMBER_ID, memberId, 30);
        setOrUpdateCookie(COOKIE_KEYS.IS_MEMBER_LINKED, "false", 30);
        isMemberLinked = false;
      }

      if (!isMemberLinked && partnerId && memberId) {
        try {
          const res = await postJSON("/api/v1/makeshop-linking", {
            partnerId,
            memberId,
            session: document.cookie,
          });

          if (res.status === 201) {
            setOrUpdateCookie(COOKIE_KEYS.IS_MEMBER_LINKED, "true", 30);
            console.log("Member linked:", res.body.message);
          } else {
            console.warn("Member linking failed:", res.body);
          }
        } catch (err) {
          console.error("Member linking error:", err);
        }
      }
    }
  })();

  // =============================
  // Linking Order Data
  // =============================
  (async function handleOrderLinking() {
    const partnerId = getCookie(COOKIE_KEYS.PARTNER_ID);
    const memberId = getCookie(COOKIE_KEYS.MEMBER_ID); // may be null
    const orderId = window.location.pathname.includes("/ssl/orderin.html")
      ? getOrderId()
      : null;

    if (partnerId && orderId) {
      try {
        const res = await postJSON("/api/v1/makeshop-linking", {
          partnerId,
          memberId,
          orderId,
          session: document.cookie,
        });

        if (res.status === 201) {
          console.log("Order linked:", res.body.message);
        } else {
          console.warn("Order linking failed:", res.body);
        }
      } catch (err) {
        console.error("Order linking error:", err);
      }
    }
  })();
})();
