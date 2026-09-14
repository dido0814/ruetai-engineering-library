let files = [];
let currentCategory = "全部";

let updatingFileId = "";


/* =========================
   初始化
========================= */

async function init() {

  try {

    const credential =
      sessionStorage.getItem(
        "ruetaiCredential"
      );


    if (!credential) {

      window.location.replace(
        "index.html"
      );

      return;
    }


    const result =
      await apiRequest(
        "files"
      );


    if (!result.ok) {

      sessionStorage.clear();

      alert(
        result.error ||
        "登入已失效，請重新登入"
      );

      window.location.replace(
        "index.html"
      );

      return;
    }


    files =
      result.files || [];


    // 更新使用者資料
    sessionStorage.setItem(
      "ruetaiUser",
      JSON.stringify(
        result.user || {}
      )
    );


    buildOwners();

    renderSummary();

    renderCategories();

    renderFiles();


    document
      .getElementById(
        "searchInput"
      )
      .addEventListener(
        "input",
        renderFiles
      );


    document
      .getElementById(
        "ownerFilter"
      )
      .addEventListener(
        "change",
        renderFiles
      );


  } catch (error) {

    console.error(
      "初始化失敗：",
      error
    );


    alert(
      "無法讀取資料庫，請稍後再試。"
    );

  }

}


/* =========================
   呼叫 Apps Script
========================= */

async function apiRequest(
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
          action: action,
          credential: credential,
          ...extra
        })
      }
    );


  return await response.json();

}


/* =========================
   單位選單
========================= */

function buildOwners() {

  const select =
    document.getElementById(
      "ownerFilter"
    );


  select.innerHTML =
    `<option value="全部">
      全部單位
    </option>`;


  const owners =
    [
      ...new Set(
        files
          .map(f => f.owner)
          .filter(Boolean)
      )
    ];


  owners.forEach(owner => {

    const option =
      document.createElement(
        "option"
      );

    option.value =
      owner;

    option.textContent =
      owner;

    select.appendChild(
      option
    );

  });

}


/* =========================
   摘要
========================= */

function renderSummary() {

  document
    .getElementById(
      "totalCount"
    )
    .textContent =
    files.length;


  document
    .getElementById(
      "categoryCount"
    )
    .textContent =
    new Set(
      files.map(
        f => f.category
      )
    ).size;


  const latest =
    [...files]
      .filter(
        f => f.updated
      )
      .sort(
        (a, b) =>
          b.updated.localeCompare(
            a.updated
          )
      )[0];


  document
    .getElementById(
      "latestDate"
    )
    .textContent =
    latest
      ? latest.updated
        .slice(5)
        .replace("-", "/")
      : "—";

}


/* =========================
   分類
========================= */

function renderCategories() {

  const counts =
    files.reduce(
      (acc, file) => {

        const category =
          file.category ||
          "未分類";


        acc[category] =
          (acc[category] || 0)
          + 1;


        return acc;

      },
      {}
    );


  const categories =
    [
      "全部",
      ...Object.keys(
        counts
      )
    ];


  const list =
    document.getElementById(
      "categoryList"
    );


  list.innerHTML =
    categories
      .map(category => {

        const count =
          category === "全部"
            ? files.length
            : counts[category];


        return `

          <button
            class="category-btn ${category ===
            currentCategory
            ? "active"
            : ""
          }"
            onclick="setCategory(
              '${escapeJs(category)}'
            )"
          >

            <span>
              ${escapeHtml(category)}
            </span>

            <small>
              ${count}
            </small>

          </button>

        `;

      })
      .join("");

}


function setCategory(
  category
) {

  currentCategory =
    category;


  document
    .getElementById(
      "sectionTitle"
    )
    .textContent =
    category === "全部"
      ? "全部檔案"
      : category;


  renderCategories();

  renderFiles();

}


/* =========================
   搜尋與篩選
========================= */

function getFilteredFiles() {

  const keyword =
    document
      .getElementById(
        "searchInput"
      )
      .value
      .trim()
      .toLowerCase();


  const owner =
    document
      .getElementById(
        "ownerFilter"
      )
      .value;


  return files.filter(
    file => {

      const categoryOK =
        currentCategory ===
        "全部"
        ||
        file.category ===
        currentCategory;


      const ownerOK =
        owner === "全部"
        ||
        file.owner === owner;


      const text = `

        ${file.category || ""}
        ${file.title || ""}
        ${file.description || ""}
        ${file.version || ""}
        ${file.owner || ""}

      `.toLowerCase();


      const keywordOK =
        !keyword ||
        text.includes(
          keyword
        );


      return (
        categoryOK &&
        ownerOK &&
        keywordOK
      );

    }
  );

}


/* =========================
   顯示資料
========================= */

function renderFiles() {

  const filtered =
    getFilteredFiles();


  document
    .getElementById(
      "resultCount"
    )
    .textContent =
    `共 ${filtered.length} 筆`;


  const tbody =
    document.getElementById(
      "fileTable"
    );


  const grid =
    document.getElementById(
      "cardGrid"
    );


  if (!filtered.length) {

    tbody.innerHTML = `

      <tr>
        <td colspan="6">

          <div class="empty">
            找不到符合條件的檔案。
          </div>

        </td>
      </tr>

    `;


    grid.innerHTML = `

      <div class="empty">
        找不到符合條件的檔案。
      </div>

    `;


    return;
  }


  /* 桌面表格 */

  tbody.innerHTML =
    filtered
      .map(file => `

        <tr>

          <td class="file-title">

            <strong>
              ${escapeHtml(
        file.title
      )}
            </strong>

            <span>
              ${escapeHtml(
        file.description ||
        ""
      )}
            </span>

          </td>


          <td>
            ${escapeHtml(
        file.category ||
        ""
      )}
          </td>


          <td>
            ${escapeHtml(
        file.version ||
        ""
      )}
          </td>


          <td>
            ${escapeHtml(
        file.updated ||
        ""
      )}
          </td>


          <td>
            ${escapeHtml(
        file.owner ||
        ""
      )}
          </td>


          <td>
            ${fileButtons(file)}
          </td>

        </tr>

      `)
      .join("");


  /* 手機卡片 */

  grid.innerHTML =
    filtered
      .map(file => `

        <article
          class="file-card"
        >

          <div
            class="file-card-top"
          >

            <span>
              ${escapeHtml(
        file.category ||
        ""
      )}
            </span>

            <span>
              ${escapeHtml(
        file.version ||
        ""
      )}
            </span>

          </div>


          <h4>
            ${escapeHtml(
        file.title
      )}
          </h4>


          <p>
            ${escapeHtml(
        file.description ||
        ""
      )}
          </p>


          <div
            class="file-card-meta"
          >

            <span>
              更新：
              ${escapeHtml(
        file.updated ||
        ""
      )}
            </span>

            <span>
              單位：
              ${escapeHtml(
        file.owner ||
        ""
      )}
            </span>

          </div>


          <div class="file-actions">

            ${fileButtons(file)}

          </div>

        </article>

      `)
      .join("");

}


/* =========================
   顯示 / 下載 / 更新
========================= */

function fileButtons(file) {

  if (!file.fileId) {

    return `
      <span class="disabled-text">
        尚未設定檔案
      </span>
    `;

  }


  const user =
    JSON.parse(
      sessionStorage.getItem(
        "ruetaiUser"
      ) || "{}"
    );


  const fileId =
    encodeURIComponent(
      file.fileId
    );


  const viewUrl =
    `https://drive.google.com/file/d/${fileId}/view`;


  const downloadUrl =
    `https://drive.google.com/uc?export=download&id=${fileId}`;


  let html = `

    <div class="file-actions">

      <a
        class="action-btn view-btn"
        href="${viewUrl}"
        target="_blank"
        rel="noopener"
      >
        顯示
      </a>


      <a
        class="action-btn download-btn"
        href="${downloadUrl}"
        target="_blank"
        rel="noopener"
      >
        下載
      </a>

  `;


  if (
    user.role ===
    "admin"
  ) {

    html += `

      <button
        type="button"
        class="action-btn admin-btn"
        onclick="openUpdateModal(
          '${escapeJs(
      file.fileId
    )}',
          '${escapeJs(
      file.title
    )}',
          '${escapeJs(
      file.version || ""
    )}'
        )"
      >
        更新檔案
      </button>

    `;

  }


  html += `
    </div>
  `;


  return html;

}


/* =========================
   更新檔案視窗
========================= */

function openUpdateModal(
  fileId,
  title,
  version
) {

  updatingFileId =
    fileId;


  document
    .getElementById(
      "updateFileTitle"
    )
    .textContent =
    title;


  document
    .getElementById(
      "updateVersion"
    )
    .value =
    version || "";


  document
    .getElementById(
      "updateFileInput"
    )
    .value =
    "";


  document
    .getElementById(
      "updateStatus"
    )
    .textContent =
    "";


  document
    .getElementById(
      "updateModal"
    )
    .style.display =
    "flex";

}


function closeUpdateModal() {

  document
    .getElementById(
      "updateModal"
    )
    .style.display =
    "none";

}


/* =========================
   上傳新版
========================= */

async function submitUpdate() {

  const input =
    document.getElementById(
      "updateFileInput"
    );


  const file =
    input.files[0];


  if (!file) {

    alert(
      "請先選擇新版檔案"
    );

    return;
  }


  /*
    第一版建議限制10MB
  */

  if (
    file.size >
    10 * 1024 * 1024
  ) {

    alert(
      "檔案請控制在10MB以下"
    );

    return;
  }


  const version =
    document
      .getElementById(
        "updateVersion"
      )
      .value
      .trim();


  const status =
    document.getElementById(
      "updateStatus"
    );


  status.textContent =
    "正在上傳，請稍候…";


  try {

    const base64 =
      await fileToBase64(
        file
      );


    const result =
      await apiRequest(
        "updateFile",
        {

          fileId:
            updatingFileId,

          fileName:
            file.name,

          mimeType:
            file.type,

          base64:
            base64,

          version:
            version

        }
      );


    if (!result.ok) {

      throw new Error(
        result.error ||
        "更新失敗"
      );

    }


    status.textContent =
      "更新完成";


    /*
      重新讀取Sheet
    */

    const newResult =
      await apiRequest(
        "files"
      );


    if (newResult.ok) {

      files =
        newResult.files ||
        [];

      renderSummary();

      renderCategories();

      renderFiles();

    }


    setTimeout(
      closeUpdateModal,
      900
    );


  } catch (error) {

    console.error(error);

    status.textContent =
      "更新失敗：" +
      error.message;

  }

}


/* =========================
   File → Base64
========================= */

function fileToBase64(
  file
) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const reader =
        new FileReader();


      reader.onload =
        function () {

          const result =
            String(
              reader.result
            );


          resolve(
            result.split(",")[1]
          );

        };


      reader.onerror =
        reject;


      reader.readAsDataURL(
        file
      );

    }
  );

}


/* =========================
   安全輸出
========================= */

function escapeHtml(
  value
) {

  return String(
    value || ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


function escapeJs(
  value
) {

  return String(
    value || ""
  )
    .replace(
      /\\/g,
      "\\\\"
    )
    .replace(
      /'/g,
      "\\'"
    )
    .replace(
      /\r/g,
      ""
    )
    .replace(
      /\n/g,
      "\\n"
    );

}


/* =========================
   啟動
========================= */

init();