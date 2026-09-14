function initGoogleLogin() {

  if (
    !window.google ||
    !google.accounts ||
    !google.accounts.id
  ) {
    setTimeout(initGoogleLogin, 300);
    return;
  }

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


async function handleGoogleLogin(response) {

  if (!response.credential) {

    showLoginError(
      "Google 登入失敗"
    );

    return;
  }

  try {

    document
      .getElementById("loginStatus")
      .textContent =
      "正在驗證使用權限…";


    const result =
      await callApi(
        "verify",
        response.credential
      );


    if (!result.ok) {

      showLoginError(
        result.error ||
        "此帳號沒有使用權限"
      );

      return;
    }


    // 驗證成功才保存
    sessionStorage.setItem(
      "ruetaiCredential",
      response.credential
    );


    sessionStorage.setItem(
      "ruetaiUser",
      JSON.stringify(result.user)
    );


    document
      .getElementById("loginStatus")
      .textContent =
      "登入成功，正在進入資料庫…";


    setTimeout(function () {

      window.location.href =
        "library.html";

    }, 400);


  } catch (error) {

    console.error(error);

    showLoginError(
      "無法連接權限驗證服務"
    );

  }

}


async function callApi(
  action,
  credential,
  extra = {}
) {

  const response =
    await fetch(
      API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "text/plain;charset=utf-8"
        },

        body: JSON.stringify({
          action: action,
          credential: credential,
          ...extra
        })
      }
    );


  return await response.json();

}


function showLoginError(message) {

  const el =
    document.getElementById(
      "loginStatus"
    );

  el.textContent = message;

  el.className =
    "login-status error";

}


window.addEventListener(
  "load",
  initGoogleLogin
);