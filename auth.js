(function () {
  "use strict";

  var parameters = new URLSearchParams(window.location.search);
  var expectedState = parameters.get("state") || "";
  var intent = parameters.get("intent") || "";
  var openerOrigin = parameters.get("openerOrigin") || "";
  var completed = false;

  function diagnostic(name, value) {
    console.info("[GOOGLE_HELPER] " + name + "=" + value);
  }

  function setStatus(message, isError) {
    var status = document.querySelector("#status");
    status.textContent = message;
    status.className = isError ? "error" : "";
  }

  function isPlaceholder(value) {
    return !value || value.indexOf("REPLACE_WITH_") >= 0;
  }

  function configuration() {
    var config = window.GOOGLE_AUTH_CONFIG || {};
    var allowedOrigins = Array.isArray(config.allowedOpenerOrigins)
      ? config.allowedOpenerOrigins
      : [];
    var validState = /^[A-Za-z0-9_-]{43}$/.test(expectedState);
    var validIntent = intent === "SignInExisting" ||
      intent === "LinkCurrentPlayer";
    var originAllowed = allowedOrigins.indexOf(openerOrigin) >= 0 &&
      !isPlaceholder(openerOrigin);
    var clientConfigured = !isPlaceholder(config.clientId);
    var openerAvailable = window.opener && !window.opener.closed;

    if (!validState || !validIntent || !originAllowed ||
        !clientConfigured || !openerAvailable) {
      return null;
    }

    return {
      clientId: config.clientId,
      openerOrigin: openerOrigin
    };
  }

  function onGisLoaded() {
    diagnostic("GISLoaded", true);
    var config = configuration();
    if (!config) {
      setStatus(
        "Google sign-in is not configured for this game origin.",
        true);
      return;
    }

    google.accounts.id.initialize({
      client_id: config.clientId,
      callback: function (response) {
        if (completed) return;
        var idToken = response && typeof response.credential === "string"
          ? response.credential
          : null;
        diagnostic("CredentialReceived", !!idToken);
        if (!idToken) {
          setStatus("Google did not return a credential. Please try again.", true);
          return;
        }

        completed = true;
        var result = {
          type: "google-auth-result",
          state: expectedState,
          idToken: idToken
        };
        var sent = false;
        try {
          window.opener.postMessage(result, config.openerOrigin);
          sent = true;
        } catch (error) {
          sent = false;
        }
        diagnostic("ResultSent", sent);
        idToken = null;
        result.idToken = null;
        if (response) response.credential = null;

        if (sent) {
          setStatus("Google sign-in complete. Returning to the game.", false);
          window.setTimeout(function () { window.close(); }, 100);
        } else {
          completed = false;
          setStatus("The game window could not receive the result.", true);
        }
      },
      auto_select: false,
      use_fedcm_for_button: true
    });

    var container = document.querySelector("#google-button-container");
    google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      width: 320
    });
    diagnostic("ButtonRendered", container.childElementCount > 0);
  }

  function onGisLoadFailed() {
    diagnostic("GISLoaded", false);
    setStatus("Google sign-in is unavailable right now.", true);
  }

  var gisClient = document.querySelector("#google-gis-client");
  if (gisClient) {
    gisClient.addEventListener("load", onGisLoaded);
    gisClient.addEventListener("error", onGisLoadFailed);
  }

  document.addEventListener("DOMContentLoaded", function () {
    diagnostic("Loaded", true);
    if (!configuration()) {
      setStatus(
        "Google sign-in is not configured for this game origin.",
        true);
    }
  });

}());
