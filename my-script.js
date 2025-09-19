jQuery(function ($) {
  // =============================
  // Config
  // =============================
  var CONFIG = {
    BASE_URL: "https://mec-test-server.onrender.com", // backend base URL
  };

  var COOKIE_KEYS = {
    PARTNER_ID: "partner_id",
    MEMBER_ID: "member_id",
    IS_MEMBER_LINKED: "is_member_linked",
  };

  // =============================
  // Utility functions
  // =============================

  function applyCustomization(data) {
    try {
      if (data.logo) {
        $(".logo").attr("src", data.logo);
      }
      if (data.topImage) {
        $(".topImage").attr("src", data.topImage);
      }
      if (data.mainColor) {
        $(".header-recommend").css("background", data.mainColor);
      }
      if (data.subColor) {
      }
      if (data.headerTextColor) {
        $(".header-text").css("color", data.headerTextColor);
      }
      if (data.headerText) {
        $(".header-text").text(data.headerText);
      }
      console.log("Applied customization");
    } catch (error) {
      console.error("Customization error:", error);
    }
  }

  function getResourceURL(filename) {
    return CONFIG.BASE_URL + "/resources/" + filename;
  }

  function getMainDomain(hostname) {
    hostname = hostname || window.location.hostname;
    var parts = hostname.split(".");
    if (parts.length <= 2) return hostname; // localhost
    return parts.slice(-2).join(".");
  }
  var domain = getMainDomain();

  function getCookie(name) {
    var match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function setOrUpdateCookie(name, value, days) {
    days = days || 30;
    var cookieStr =
      name +
      "=" +
      encodeURIComponent(value) +
      "; path=/; max-age=" +
      days * 24 * 60 * 60;
    if (domain) cookieStr += "; domain=" + domain;
    document.cookie = cookieStr;
  }

  function removeCookie(name) {
    var cookieStr = name + "=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    if (domain) cookieStr += "; domain=" + domain;
    document.cookie = cookieStr;
  }

  function postJSON(path, data) {
    return $.ajax({
      url: CONFIG.BASE_URL + path,
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(data),
    });
  }

  function getOrderId() {
    var $el = $("table.settlementCompleteMessage font.large_font_size");
    return $el.length ? $.trim($el.text()) : null;
  }

  // =============================
  // Capturing & Storing partnerId
  // =============================
  function handlePartnerId() {
    var partnerId = getCookie(COOKIE_KEYS.PARTNER_ID);
    var urlParams = new URLSearchParams(window.location.search);
    var urlPartnerId = urlParams.get("partner_id");

    if (urlPartnerId && (!partnerId || urlPartnerId == partnerId)) {
      setOrUpdateCookie(COOKIE_KEYS.PARTNER_ID, urlPartnerId, 30);
    }
  }

  // =============================
  // Customizing Site (only on home page)
  // =============================
  function customizeSite() {
    var partnerId = getCookie(COOKIE_KEYS.PARTNER_ID);
    if (!partnerId) return;

    $.ajax({
      url: CONFIG.BASE_URL + "/api/setting/site/" + partnerId,
      success: function (data) {
        if (data.logo) {
          data.logo = getResourceURL(data.logo);
        }
        if (data.topImage) {
          data.topImage = getResourceURL(data.topImage);
        }
        applyCustomization(data);
      },
      error: function (error) {
        removeCookie(COOKIE_KEYS.PARTNER_ID);
        console.error("Customization error:", error);
      },
    });
  }

  // =============================
  // Linking Member Data
  // =============================
  function handleMemberLinking() {
    var partnerId = getCookie(COOKIE_KEYS.PARTNER_ID);

    $.ajax({
      url: "/view/page/metadata-member",
      cache: false,
      success: function (json) {
        var memberId = json.member_id ? json.member_id.toString() : null;

        if (memberId) {
          var isMemberLinkedKey = COOKIE_KEYS.IS_MEMBER_LINKED + "_" + memberId;
          var isMemberLinked = getCookie(isMemberLinkedKey) === "true";
          var cookieMemberId = getCookie(COOKIE_KEYS.MEMBER_ID);

          if (memberId !== cookieMemberId) {
            setOrUpdateCookie(COOKIE_KEYS.MEMBER_ID, memberId, 30);
          }

          if (!isMemberLinked && partnerId && memberId) {
            postJSON("/api/v1/makeshop-linking", {
              partnerId: partnerId,
              memberId: memberId,
              session: document.cookie,
            })
              .done(function (res, textStatus, xhr) {
                if (xhr.status === 201) {
                  setOrUpdateCookie(isMemberLinkedKey, "true", 30);
                  console.log("Member linked:", res.message);
                } else {
                  console.warn("Member linking failed:", res);
                }
              })
              .fail(function (error) {
                console.error("Member linking error:", error);
              });
          }
        }
      },
      error: function (error) {
        console.log("Bad response: " + error);
      },
    });
  }

  // =============================
  // Linking Order Data
  // =============================
  function handleOrderLinking() {
    var partnerId = getCookie(COOKIE_KEYS.PARTNER_ID);
    var memberId = getCookie(COOKIE_KEYS.MEMBER_ID);
    var orderId =
      window.location.pathname.indexOf("/ssl/orderin.html") > -1
        ? getOrderId()
        : null;

    if (partnerId && orderId) {
      postJSON("/api/v1/makeshop-linking", {
        partnerId: partnerId,
        memberId: memberId,
        orderId: orderId,
        session: document.cookie,
      })
        .done(function (res, textStatus, xhr) {
          if (xhr.status === 201) {
            console.log("Order linked:", res.message);
          } else {
            console.warn("Order linking failed:", res);
          }
        })
        .fail(function (xhr) {
          console.error("Order linking error:", xhr);
        });
    }
  }

  // =============================
  // Run everything AFTER page load
  // =============================
  $(function () {
    handlePartnerId();
    customizeSite();
    handleMemberLinking();
    handleOrderLinking();
  });
});
