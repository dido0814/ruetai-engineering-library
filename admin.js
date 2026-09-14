async function initAdmin() {

  const credential =
    sessionStorage.getItem(
      "ruetaiCredential"
    );


  /*
    沒有登入憑證
  */

  if (!credential) {

    window.location.replace(
      "index.html"
    );

    return;

  }


  try {

    /*
      再向 Apps Script 驗證一次
    */

    const result =
      await adminApiRequest(
        "verify"
      );


    if (!result.ok) {

      throw new Error(
        result.error ||
        "登入驗證失敗"
      );

    }


    const user =
      result.user || {};


    /*
      必須是 admin
    */

    if (
      user.role !== "admin"
    ) {

      alert(
        "您沒有管理者權限"
      );

      window.location.replace(
        "library.html"
      );

      return;

    }


    /*
      儲存最新使用者資料
    */

    sessionStorage.setItem(
      "ruetaiUser",
      JSON.stringify(user)
    );


    /*
      顯示管理頁
    */

    document
      .getElementById(
        "loading"
      )
      .style.display =
      "none";


    document
      .getElementById(
        "adminContent"
      )
      .style.display =
      "block";


    document
      .getElementById(
        "adminUserInfo"
      )
      .textContent =
      `${user.name || user.email} ｜ ${user.unit || ""} ｜ 管理者`;


  } catch (error) {

    console.error(
      error
    );


    const loading =
      document.getElementById(
        "loading"
      );


    loading.className =
      "admin-card error";


    loading.textContent =
      "管理者權限驗證失敗：" +
      error.message;

  }

}



/*
  呼叫 Apps Script
*/

async function adminApiRequest(
  action,
  extra = {}
) {

  const credential =
    sessionStorage.getItem(
      "ruetaiCredential"
    );


  if (!credential) {

    throw new Error(
      "尚未登入"
    );

  }


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

          action:
            action,

          credential:
            credential,

          ...extra

        })

      }
    );


  const result =
    await response.json();


  return result;

}



/*
  登出
*/

function logout() {

  sessionStorage.removeItem(
    "ruetaiCredential"
  );

  sessionStorage.removeItem(
    "ruetaiUser"
  );


  window.location.replace(
    "index.html"
  );

}



/*
  啟動
*/

initAdmin();