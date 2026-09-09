
let files = [];
let currentCategory = "全部";

async function init() {
  try {
    const response = await fetch("database.json");
    files = await response.json();
  } catch (error) {
    console.error(error);
  }

  buildOwners();
  renderSummary();
  renderCategories();
  renderFiles();

  document.getElementById("searchInput").addEventListener("input", renderFiles);
  document.getElementById("ownerFilter").addEventListener("change", renderFiles);
}

function buildOwners() {
  const owners = ["土木組", "管線組", "水利組", "工務組"];
  const select = document.getElementById("ownerFilter");
  owners.forEach(owner => {
    const option = document.createElement("option");
    option.value = owner;
    option.textContent = owner;
    select.appendChild(option);
  });
}

function renderSummary() {
  document.getElementById("totalCount").textContent = files.length;
  document.getElementById("categoryCount").textContent = new Set(files.map(f => f.category)).size;
  const latest = [...files].sort((a,b) => b.updated.localeCompare(a.updated))[0];
  document.getElementById("latestDate").textContent = latest ? latest.updated.slice(5).replace("-", "/") : "—";
}

function renderCategories() {
  const counts = files.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1;
    return acc;
  }, {});
  const categories = ["全部", ...Object.keys(counts)];
  const list = document.getElementById("categoryList");

  list.innerHTML = categories.map(cat => {
    const count = cat === "全部" ? files.length : counts[cat];
    return `<button class="category-btn ${cat === currentCategory ? "active" : ""}"
      onclick="setCategory('${cat}')">
      <span>${cat}</span><small>${count}</small>
    </button>`;
  }).join("");
}

function setCategory(category) {
  currentCategory = category;
  document.getElementById("sectionTitle").textContent =
    category === "全部" ? "全部計算檔" : category;
  renderCategories();
  renderFiles();
}

function getFilteredFiles() {
  const keyword = document.getElementById("searchInput").value.trim().toLowerCase();
  const owner = document.getElementById("ownerFilter").value;

  return files.filter(f => {
    const categoryOK = currentCategory === "全部" || f.category === currentCategory;
    const ownerOK = owner === "全部" || f.owner === owner;
    const text = `${f.id} ${f.category} ${f.subcategory} ${f.title} ${f.description} ${f.owner} ${f.version}`.toLowerCase();
    const keywordOK = !keyword || text.includes(keyword);
    return categoryOK && ownerOK && keywordOK;
  });
}

function renderFiles() {
  const filtered = getFilteredFiles();
  document.getElementById("resultCount").textContent = `共 ${filtered.length} 筆`;

  const tbody = document.getElementById("fileTable");
  const grid = document.getElementById("cardGrid");

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty">找不到符合條件的計算檔。</div></td></tr>`;
    grid.innerHTML = `<div class="empty">找不到符合條件的計算檔。</div>`;
    return;
  }

  tbody.innerHTML = filtered.map(f => `
    <tr>
      <td><strong>${f.id}</strong></td>
      <td class="file-title">
        <strong>${f.title}</strong>
        <span>${f.description}</span>
      </td>
      <td>
        ${f.category}
        <span class="subcategory">${f.subcategory}</span>
      </td>
      <td>${f.version}</td>
      <td>${f.updated}</td>
      <td>${f.owner}</td>
      <td><span class="status">${f.status}</span></td>
      <td>${downloadButton(f)}</td>
    </tr>
  `).join("");

  grid.innerHTML = filtered.map(f => `
    <article class="file-card">
      <div class="file-card-top">
        <span>${f.id}</span>
        <span class="status">${f.status}</span>
      </div>
      <h4>${f.title}</h4>
      <p>${f.description}</p>
      <div class="file-card-meta">
        <span>${f.category} / ${f.subcategory}</span>
        <span>${f.version}</span>
        <span>${f.updated}</span>
        <span>${f.owner}</span>
      </div>
      ${downloadButton(f)}
    </article>
  `).join("");
}

function downloadButton(f) {
  if (!f.downloadUrl || f.downloadUrl === "#") {
    return `<a class="download disabled" href="#" onclick="event.preventDefault(); alert('此為預覽版，尚未設定實際 Excel 下載網址。');">下載 Excel</a>`;
  }
  return `<a class="download" href="${f.downloadUrl}" target="_blank" rel="noopener">下載 Excel</a>`;
}

init();
