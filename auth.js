function initGoogleLogin() {

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleLogin
  });

  google.accounts.id.renderButton(
    document.getElementById("googleLoginButton"),
    {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      width: 300
    }
  );
}


function handleGoogleLogin(response) {

  if (!response.credential) {
    showLoginError("Google 登入失敗");
    return;
  }

  try {

    const user = parseJwt(
      response.credential
    );

    console.log(
      "Google 登入帳號：",
      user.email
    );

    /*
      先保存 Google 登入資訊。
      下一階段再接 Apps Script 做後端權限驗證。
    */

    sessionStorage.setItem(
      "ruetaiCredential",
      response.credential
    );

    sessionStorage.setItem(
      "ruetaiUser",
      JSON.stringify({
        email: user.email,
        name: user.name,
        picture: user.picture
      })
    );

    document.getElementById(
      "loginStatus"
    ).innerHTML =
      "登入成功，正在進入資料庫…";

    setTimeout(function () {

      window.location.href =
        "library.html";

    }, 500);

  } catch (error) {

    console.error(error);

    showLoginError(
      "無法取得 Google 帳號資訊"
    );
  }
}


function parseJwt(token) {

  const base64Url =
    token.split(".")[1];

  const base64 =
    base64Url
      .replace(/-/g, "+")
      .replace(/_/g, "/");

  const jsonPayload =
    decodeURIComponent(
      atob(base64)
        .split("")
        .map(function(c) {
          return "%" +
            ("00" +
              c.charCodeAt(0)
                .toString(16)
            ).slice(-2);
        })
        .join("")
    );

  return JSON.parse(
    jsonPayload
  );
}


function showLoginError(message) {

  const el =
    document.getElementById(
      "loginStatus"
    );

  el.textContent = message;
  el.className = "login-status error";
}


window.addEventListener(
  "load",
  initGoogleLogin
);