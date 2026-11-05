
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const ua = navigator.userAgent || "";

  const scoreFields = [
    "os", "browser", "deviceType", "manufacturer",
    "ip", "timezone", "battery", "screen",
    "language", "cpu", "memory", "network",
    "downlink", "touch", "gpu"
  ];

  const available = new Set();

  function updateScore() {
    const count = available.size;
    const total = scoreFields.length;
    const percent = Math.round(count / total * 100);

    $("score").textContent = `${count}/${total}`;
    $("percentage").textContent = `${percent}%`;
    $("progressFill").style.width = `${percent}%`;
    $("scoreTrack").setAttribute(
      "aria-valuenow",
      String(count)
    );
  }

  function show(id, value, isAvailable = true) {
    const element = $(id);
    if (!element) return;

    element.textContent = String(value);

    if (scoreFields.includes(id)) {
      if (isAvailable) {
        available.add(id);
      } else {
        available.delete(id);
      }
      updateScore();
    }
  }

  function safeRun(name, fn, ids = []) {
    try {
      fn();
    } catch (error) {
      console.error(`${name} failed:`, error);
      ids.forEach(id => show(id, "Unavailable", false));
    }
  }

  // OPERATING SYSTEM
  function getOS() {
    if (/Android/i.test(ua)) return "Android";
    if (/iPhone|iPad|iPod/i.test(ua)) {
      return "iOS / iPadOS";
    }
    if (
      /Macintosh/i.test(ua) &&
      navigator.maxTouchPoints > 1
    ) {
      return "iPadOS (estimated)";
    }
    if (/Windows/i.test(ua)) return "Windows";
    if (/Macintosh/i.test(ua)) return "macOS";
    if (/Linux/i.test(ua)) return "Linux";
    return "Unknown";
  }

  // BROWSER
  function getBrowser() {
    if (/Edg\/|EdgA|EdgiOS/i.test(ua)) {
      return "Microsoft Edge";
    }
    if (/OPR\/|OPT\//i.test(ua)) {
      return "Opera";
    }
    if (/SamsungBrowser/i.test(ua)) {
      return "Samsung Internet";
    }
    if (/FxiOS|Firefox/i.test(ua)) {
      return "Mozilla Firefox";
    }
    if (/CriOS|Chrome/i.test(ua)) {
      return "Google Chrome";
    }
    if (/Safari/i.test(ua)) return "Safari";
    return "Unknown";
  }

  // DEVICE TYPE
  function getDeviceType() {
    if (
      /iPad|Tablet/i.test(ua) ||
      (/Macintosh/i.test(ua) &&
       navigator.maxTouchPoints > 1)
    ) {
      return "Tablet";
    }
    if (/iPhone|iPod|Mobi/i.test(ua)) {
      return "Smartphone";
    }
    if (/Android/i.test(ua)) {
      return "Tablet / Android device";
    }
    return "Desktop / Laptop (estimated)";
  }

  // MANUFACTURER
  function getManufacturer() {
    if (/iPhone|iPad|iPod|Macintosh/i.test(ua)) {
      return "Apple (estimated)";
    }
    if (/Samsung|SM-[A-Z0-9]+/i.test(ua)) {
      return "Samsung (estimated)";
    }
    if (/Pixel/i.test(ua)) {
      return "Google (estimated)";
    }
    if (/HUAWEI|HONOR/i.test(ua)) {
      return "Huawei / Honor (estimated)";
    }
    if (/Xiaomi|Redmi|POCO/i.test(ua)) {
      return "Xiaomi (estimated)";
    }
    if (/OnePlus/i.test(ua)) {
      return "OnePlus (estimated)";
    }
    return "Not exposed";
  }

  function loadBasic() {
    const os = getOS();
    const browser = getBrowser();
    const maker = getManufacturer();

    show("os", os, os !== "Unknown");
    show("browser", browser, browser !== "Unknown");
    show("deviceType", getDeviceType());
    show("manufacturer", maker, maker !== "Not exposed");

    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone;

    show(
      "timezone",
      timezone || "Unavailable",
      Boolean(timezone)
    );

    show(
      "screen",
      `${window.screen.width} × ${window.screen.height}`
    );

    show(
      "language",
      navigator.language || "Unavailable",
      Boolean(navigator.language)
    );

    const cpu = navigator.hardwareConcurrency;
    show(
      "cpu",
      Number.isFinite(cpu)
        ? `${cpu} reported threads`
        : "Not exposed",
      Number.isFinite(cpu)
    );

    const ram = navigator.deviceMemory;
    show(
      "memory",
      Number.isFinite(ram)
        ? `${ram} GB (approximate)`
        : "Not supported",
      Number.isFinite(ram)
    );

    const touch =
      navigator.maxTouchPoints > 0 ||
      "ontouchstart" in window;

    show(
      "touch",
      touch ? "Supported" : "Not detected"
    );
  }

  function updateTime() {
    show("localTime", new Date().toLocaleString());
  }

  function loadColorScheme() {
    const dark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    show("colorScheme", dark ? "Dark" : "Light");
  }

  function updateOnline() {
    show(
      "online",
      navigator.onLine
        ? "Browser reports online"
        : "Browser reports offline"
    );
  }

  function loadNetwork() {
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    if (!connection) {
      show("network", "Not supported", false);
      show("downlink", "Not supported", false);
      return;
    }

    function refresh() {
      const type =
        connection.effectiveType ||
        connection.type;

      show(
        "network",
        type ? `${type} (estimated)` : "Not exposed",
        Boolean(type)
      );

      const speed = connection.downlink;
      show(
        "downlink",
        Number.isFinite(speed)
          ? `${speed} Mbps (estimated)`
          : "Not exposed",
        Number.isFinite(speed)
      );
    }

    refresh();
    connection.addEventListener?.("change", refresh);
  }

  function loadGPU() {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");

    if (!gl) {
      show("gpu", "Not available", false);
      return;
    }

    const extension = gl.getExtension(
      "WEBGL_debug_renderer_info"
    );

    if (!extension) {
      show("gpu", "Renderer hidden", false);
      return;
    }

    const renderer = gl.getParameter(
      extension.UNMASKED_RENDERER_WEBGL
    );

    show(
      "gpu",
      renderer || "Not exposed",
      Boolean(renderer)
    );
  }

  async function loadBattery() {
    if (typeof navigator.getBattery !== "function") {
      show("battery", "Not supported", false);
      return;
    }

    try {
      const battery = await navigator.getBattery();

      function refresh() {
        const percent = Math.round(battery.level * 100);
        show(
          "battery",
          `${percent}%` +
          (battery.charging ? " (Charging)" : "")
        );
      }

      refresh();
      battery.addEventListener("levelchange", refresh);
      battery.addEventListener("chargingchange", refresh);
    } catch (error) {
      console.error("Battery error:", error);
      show("battery", "Unavailable", false);
    }
  }

  async function loadIP() {
    try {
      const response = await fetch(
        "https://api.ipify.org?format=json"
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.ip) throw new Error("Missing IP");

      show("ip", data.ip);
    } catch (error) {
      console.error("IP lookup error:", error);
      show("ip", "Unavailable", false);
    }
  }

  async function loadApproximateLocation() {
    const output = $("locationText");
    const container = $("mapContainer");

    try {
      const response = await fetch(
        "https://get.geojs.io/v1/ip/geo.json"
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const lat = Number(data.latitude);
      const lon = Number(data.longitude);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        lat < -90 || lat > 90 ||
        lon < -180 || lon > 180
      ) {
        throw new Error("Invalid coordinates");
      }

      const place = [
        data.city,
        data.region,
        data.country
      ].filter(Boolean).join(", ");

      output.textContent =
        place || "Approximate location detected";

      const iframe = document.createElement("iframe");
      iframe.className = "map-frame";
      iframe.title = "Approximate IP location";
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer";

      iframe.src =
        "https://maps.google.com/maps?q=" +
        encodeURIComponent(`${lat},${lon}`) +
        "&z=11&output=embed";

      container.replaceChildren(iframe);
    } catch (error) {
      console.error("Map lookup error:", error);
      output.textContent =
        "Approximate location unavailable";

      const message = document.createElement("div");
      message.className = "map-placeholder";
      message.textContent =
        "Map unavailable. Check your connection.";

      container.replaceChildren(message);
    }
  }

  // GPS permission must be controlled by the browser.
  // Call directly from the Accept button's click handler.
  function requestGPS() {
    if (!navigator.geolocation) {
      show("gps", "Not supported");
      return;
    }

    if (!window.isSecureContext) {
      show("gps", "Requires HTTPS or localhost");
      return;
    }

    show("gps", "Waiting for browser permission...");

    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude.toFixed(5);
        const lon = position.coords.longitude.toFixed(5);

        show("gps", `Lat: ${lat}, Lon: ${lon}`);
      },
      error => {
        if (error.code === 1) {
          show("gps", "Permission denied");
        } else if (error.code === 2) {
          show("gps", "Location unavailable");
        } else {
          show("gps", "Location request timed out");
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }

  let started = false;

  function startAnalysis() {
    if (started) return;
    started = true;

    $("consentOverlay").classList.add("hidden");
    $("analysisStatus").textContent = "ANALYSIS ACTIVE";

    // Request GPS during the actual button click.
    requestGPS();

    safeRun("Basic information", loadBasic, [
      "os", "browser", "deviceType", "manufacturer",
      "timezone", "screen", "language",
      "cpu", "memory", "touch"
    ]);

    safeRun("Time", () => {
      updateTime();
      setInterval(updateTime, 1000);
    }, ["localTime"]);

    safeRun("Color scheme", loadColorScheme, [
      "colorScheme"
    ]);

    safeRun("Online status", updateOnline, [
      "online"
    ]);

    safeRun("Network", loadNetwork, [
      "network", "downlink"
    ]);

    safeRun("GPU", loadGPU, ["gpu"]);

    // Independent asynchronous operations.
    loadBattery();
    loadIP();
    loadApproximateLocation();
  }

  $("acceptButton").addEventListener(
    "click",
    startAnalysis
  );

  window.addEventListener("online", () => {
    if (started) updateOnline();
  });

  window.addEventListener("offline", () => {
    if (started) updateOnline();
  });

  console.log("QR Code Security System initialized.");
});
