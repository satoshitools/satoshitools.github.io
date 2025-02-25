// Função para buscar os preços de todas as moedas de uma vez com cache de 30 segundos
async function fetchPrices(currencies) {
  const currencyIds = currencies.join(","); // Junta todos os IDs das moedas com vírgula
  const cacheKey = `prices_${currencyIds}`;
  const cachedData = JSON.parse(localStorage.getItem(cacheKey));

  // Verifica se há cache e se ele é válido (30 segundos)
  if (cachedData && Date.now() - cachedData.timestamp < 30000) {
    // Verifica se todos os preços estão no cache
    const allCached = currencies.every(
      (currency) => cachedData.prices[currency]
    );
    if (allCached) {
      return cachedData.prices; // Retorna o cache se todos os preços estão disponíveis
    }
  }

  // Se o cache não é válido ou não tem todos os preços, faz a requisição
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${currencyIds}&vs_currencies=usd`;
    const response = await fetch(url);
    const data = await response.json();

    // Atualiza o cache com os novos preços e o timestamp
    const newCache = {
      prices: data,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(newCache));

    return data; // Retorna os preços de todas as moedas solicitadas
  } catch (error) {
    console.error("Erro ao buscar preços:", error);
    return {}; // Retorna um objeto vazio em caso de erro
  }
}

// Função para adicionar a pool na lista
async function addPoolToList(poolData, index, priceData) {
  const poolElement = document.createElement("div");
  poolElement.className = "card mb-3 shadow-sm";

  // Obtém os preços das moedas da pool
  const currency1 = poolData.currency1.symbol;
  const currency2 = poolData.currency2.symbol;

  const currency1Id = poolData.currency1.id;
  const currency2Id = poolData.currency2.id;

  const priceCurrency1 =
    poolData.priceCurrency1 || priceData[currency1Id]?.usd || 0; // Preço da moeda 1 em USD
  const priceCurrency2 =
    poolData.priceCurrency2 || priceData[currency2Id]?.usd || 0; // Preço da moeda 2 em USD

  const currentRange = (
    priceCurrency2 > 0 ? priceCurrency1 / priceCurrency2 : 0
  ).toFixed(2);

  const totalFeesUsd =
    poolData.feeTokens1 * priceCurrency1 + poolData.feeTokens2 * priceCurrency2;

  const entryTokens1 = parseFloat(poolData.tokens1) + (poolData.changes || []).reduce((acc, change) => {
    return change.type === 'add' ? acc + parseFloat(change.tokens1) : acc - parseFloat(change.tokens1);
  }, 0);
  const entryTokens2 = parseFloat(poolData.tokens2) + (poolData.changes || []).reduce((acc, change) => {
    return change.type === 'add' ? acc + parseFloat(change.tokens2) : acc - parseFloat(change.tokens2);
  }, 0);

  const poolAssets =
    entryTokens1 * priceCurrency1 + entryTokens2 * priceCurrency2;
  const poolCurrentAssets =
    poolData.currentTokens1 * priceCurrency1 +
    poolData.currentTokens2 * priceCurrency2;

  const sumOfChanges = poolData.changes ? poolData.changes.reduce((acc, change) => {
    return acc + (change.type === 'add' ? parseFloat(change.dollar) : parseFloat(change.dollar) * -1);
  }, 0) : 0;

  const totalEntry = parseFloat(poolData.dollars) - parseFloat(poolData.fee) + sumOfChanges
  const appreciation = poolCurrentAssets - totalEntry;

  const divergenceLoss = poolCurrentAssets - poolAssets;
  const pnl = totalFeesUsd - divergenceLoss * -1 - poolData.fee;


  const getIcon = (value) => (value >= 0 ? "▲" : "▼");

  const getColorClass = (value) =>
    value >= 0 ? "text-success" : "text-danger";

  const getInputIcon = (value) => (value > 0 ? "data-down" : "data-up");

  let appreciationHtml = `
    <p class="mb-0 d-flex justify-content-between">
        <span class="fw-bold" data-bs-toggle="tooltip" title="Sem valorização dos ativos, então aqui está o valor atual da pool">Valor atual: </span> 
        <span>$${poolCurrentAssets.toFixed(2)}</span>
    </p>
    `;

  if (appreciation > 0) {
    appreciationHtml = `
        <p class="mb-0 d-flex justify-content-between">
        <span class="fw-bold" data-bs-toggle="tooltip" title="Valorização dos ativos baseado no seu capital de entrada">Valorização: </span>
        <span class="text-success">▲ $${appreciation.toFixed(2)}</span>
        </p>
    `;
  }

  const startDate = new Date(poolData.startDate);
  let endDate = new Date();

  if (poolData.archivedDate && !poolData.status) {
    endDate = new Date(poolData.archivedDate);
  }

  // Calcula a diferença em milissegundos
  const diffTime = endDate - startDate;

  // Converte a diferença para dias
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  poolElement.innerHTML = `
    <div class="card-body d-flex align-items-center">
        <div class="actions">
            ${
              poolData.status
                ? ""
                : `<button
                class="btn btn-sm btn-outline-danger delete-pool"
                data-index="${index}"
                onclick="deletePool(${index})"
                data-bs-toggle="tooltip"
                title="Excluir Pool"
            >
                <i class="bi bi-trash-fill"></i>
            </button>`
            }

            ${
                poolData.status
                  ? `<button
                  class="btn btn-sm btn-outline-primary delete-pool"
                  data-index="${index}"
                  onclick="changeLiquid(${index})"
                  data-bs-toggle="tooltip"
                  title="Adicionar ou remover liquidez"
              >
                  <i class="bi bi-plus-slash-minus"></i>
              </button>`
                  : ""
              }

            <button
                class="btn btn-sm btn-outline-warning archive-pool"
                data-index="${index}"
                onclick="archivePool(${index}, ${priceCurrency1}, ${priceCurrency2})"
                data-bs-toggle="tooltip"
                title="${poolData.status ? "Arquivar" : "Desaquivar"} Pool"
            >
                ${
                  poolData.status
                    ? '<i class="bi bi-archive-fill"></i>'
                    : '<i class="bi bi-recycle"></i>'
                }
            </button>

            ${
              poolData.url
                ? `<a
                class="btn btn-sm btn-outline-secondary pool-site"
                href="https://${poolData.url
                  .replace("https://", "")
                  .replace("http://", "")}"
                target="_blank"
                data-bs-toggle="tooltip"
                title="Acessar Pool"
            >
                <img src="https://www.google.com/s2/favicons?sz=64&domain_url=https://${poolData.url
                  .replace("https://", "")
                  .replace("http://", "")}" />
            </a>`
                : ""
            }

            <button
                class="btn btn-sm btn-outline-success d-none update-pool"
                data-index="${index}"
                onclick="location.reload();"
                data-bs-toggle="tooltip"
                title="Atualizar Pool"
            >
                <i class="bi bi-arrow-clockwise"></i>
            </button>
        </div>

        <div class="text-center eye_handler" style="width: 10%">
            <div style="display: flex;justify-content: center;">
              <a href="https://www.coingecko.com/pt/moedas/${poolData.currency1.id}" target="_blank">
                <img
                    src="${poolData.currency1.thumb}"
                    alt="${poolData.currency1.symbol}"
                    class="rounded-circle me-1"
                    style="width: 24px; height: 24px"
                />
              </a>
              <a href="https://www.coingecko.com/pt/moedas/${poolData.currency2.id}" target="_blank">
                <img
                    src="${poolData.currency2.thumb}"
                    alt="${poolData.currency2.symbol}"
                    class="rounded-circle"
                    style="width: 24px; height: 24px"
                />
              </a>
            </div>
            <p class="fw-bold mb-0" style="font-size: 11px">
            ${currency1}/${currency2}
            </p>
        </div>
        <div class="text-start" style="width: 25%">
            <p class="mb-0 d-flex justify-content-between">
                <span class="fw-bold">Início:</span>
                <span>${startDate.toLocaleDateString(
                  "pt-BR"
                )} (${diffDays} dias)</span>
            </p>

            <p class="mb-0 d-flex justify-content-between">
                <span class="fw-bold">Investido:</span>
                <span>$${totalEntry.toFixed(2)}</span>
            </p>

            <p class="mb-0 d-flex justify-content-between">
                <span class="fw-bold">Range:</span>
                <span class="range-data">
                    <span
                        class="bar-container"
                        data-index="${index}"
                        data-current="${currentRange}"
                        data-min="${poolData.minRange}"
                        data-max="${poolData.maxRange}"
                    >
                        <span class="bar-fill" data-bs-toggle="tooltip" title="De ${
                          poolData.minRange
                        } até ${poolData.maxRange}"></span>
                        <span class="price-marker" data-bs-toggle="tooltip" title="Atual: ${currentRange}"></span>

                        <span class="price-range eye_handler">
                            <span class="price">${poolData.minRange}</span>
                            <span class="price">${poolData.maxRange}</span>
                        </span>
                    </span>
                </span>
            </p>
        </div>

        <div class="text-start" style="width: 15%">
            <p class="mb-1 fw-bold">Tokens Investidos</p>
            <p class="mb-1">
            ${entryTokens1.toFixed(7)} <span class="eye_handler">${currency1}</span>
            </p>
            <p class="mb-0">
            ${entryTokens2.toFixed(7)} <span class="eye_handler">${currency2}</span>
            </p>
        </div>
        <div class="text-start" style="width: 15%">
            <p class="mb-1 fw-bold">Tokens Atuais</p>
            <div ${getInputIcon(entryTokens1 - poolData.currentTokens1)}>
                <input
                type="number"
                class="form-control form-control-sm mb-1"
                placeholder="Tokens ${poolData.currency1.symbol}"
                value="${poolData.currentTokens1}"
                data-type="currentTokens1"
                data-index="${index}"
                ${poolData.status ? "" : "disabled"}
                />
            </div>
            <div ${getInputIcon(entryTokens2 - poolData.currentTokens2)}>
                <input
                type="number"
                class="form-control form-control-sm"
                placeholder="Tokens ${poolData.currency2.symbol}"
                value="${poolData.currentTokens2}"
                data-type="currentTokens2"
                data-index="${index}"
                ${poolData.status ? "" : "disabled"}
                />
            </div>
        </div>
        <div class="text-start" style="width: 15%">
            <p class="mb-1 fw-bold">Tokens Recebidos</p>
            <input
            type="number"
            class="form-control form-control-sm mb-1"
            placeholder="${poolData.currency1.symbol}"
            value="${poolData.feeTokens1 || 0}"
            data-type="feeTokens1"
            data-index="${index}"
            ${poolData.status ? "" : "disabled"}
            />
            <input
            type="number"
            class="form-control form-control-sm"
            placeholder="${poolData.currency2.symbol}"
            value="${poolData.feeTokens2 || 0}"
            data-type="feeTokens2"
            data-index="${index}"
            ${poolData.status ? "" : "disabled"}
            />
        </div>
        <div class="text-start summary" style="width: 25%">
            <p class="mb-0 d-flex justify-content-between" \>
            <span
                class="fw-bold"
                data-bs-toggle="tooltip"
                title="PnL: Lucro ou prejuízo considerando taxas e preço dos ativos"
                >Lucro/Prejuízo:</span
            >
            <span class="${getColorClass(pnl)}"
                >${getIcon(pnl)} $${pnl.toFixed(2)}</span
            >
            </p>

            ${appreciationHtml}

            <p class="mb-0 d-flex justify-content-between">
            <span
                class="fw-bold"
                data-bs-toggle="tooltip"
                title="Valor das taxas recebidas considerando o preço atual dos ativos"
                >Taxas:</span
            >
            <span class="${getColorClass(totalFeesUsd)}"
                >${getIcon(totalFeesUsd)} $${totalFeesUsd.toFixed(2)}</span
            >
            </p>

            <p class="mb-0 d-flex justify-content-between">
            <span
                class="fw-bold"
                data-bs-toggle="tooltip"
                title="IL: Perda potencial ao fornecer liquidez devido à variação nos preços dos ativos"
                >Perda temporária:</span
            >
            ${
              divergenceLoss >= 0
                ? `<span>-</span>`
                : `<span class="${getColorClass(divergenceLoss)}"
                >${getIcon(divergenceLoss)} $${divergenceLoss.toFixed(2)}</span
            >`
            }
            </p>
        </div>
    </div>
    ${(poolData.changes || []).length > 0 ? '<hr>' : ''}
    <div class="pool-changes">
        ${(poolData.changes || []).length > 0
            ? `<div class="d-flex">
                    <span class="start">
                    Iniciou com
                    <b>${poolData.tokens1} <i class="eye_handler">${poolData.currency1.symbol}</i></b> e
                    <b>${poolData.tokens2} <i class="eye_handler">${poolData.currency2.symbol}</i></b>
                    no dia
                    ${new Date(poolData.startDate).toLocaleDateString('pt-BR')} no total de
                    $${parseFloat(poolData.dollars).toFixed(2)} dolares, pagando $${parseFloat(poolData.fee).toFixed(2)} em taxas
                    </span>
                </div>`
            : ''
        }
        ${
          poolData.changes
          ? poolData.changes.map((change, i) => {
            return `
              <div class="d-flex">
                <button
                  class="btn btn-sm btn-outline-danger delete-pool"
                  onclick="deleteChange(${index}, ${i})"
                  data-bs-toggle="tooltip"
                  title="Excluir mudança"
                >
                  <i class="bi bi-trash-fill"></i>
                </button>

                <span>
                  ${change.type == 'add' ? 'Adicionou' : 'Removeu'}
                  <b>${change.tokens1} <i class="eye_handler">${poolData.currency1.symbol}</i></b> e
                  <b>${change.tokens2} <i class="eye_handler">${poolData.currency2.symbol}</i></b>
                  no dia
                  ${new Date(change.date).toLocaleDateString('pt-BR')} no total de
                  $${parseFloat(change.dollar).toFixed(2)} dolares
                </span>
              </div>
            `;
          }).join('') : ''
        }
    </div>
    `;

  addUpdatesInputListeners(poolElement);

  window.poolList.appendChild(poolElement);

  return { pnl, poolCurrentAssets, totalEntry };
}

function addUpdatesInputListeners(poolElement) {
  // Adiciona event listener nos inputs de tokens e taxas
  poolElement.querySelectorAll("input[data-type]").forEach((input) => {
    input.addEventListener("keyup", function () {
      const poolIndex = input.dataset.index;
      const poolType = input.dataset.type;
      const value = input.value;

      let pools = JSON.parse(localStorage.getItem("pools")) || { list: [] };

      // Atualiza o valor específico sem afetar os outros campos
        pools.list[poolIndex][poolType] = value;
      localStorage.setItem("pools", JSON.stringify(pools));
    });
  });
  poolElement.querySelectorAll("input[data-type]").forEach((input) => {
    input.addEventListener("input", function () {
      const updateButton = poolElement.querySelector(".update-pool");
      updateButton.classList.remove("d-none");
    });
  });
}

// Função para carregar as pools e preços
async function loadPools(status = null) {
  if (status === null) {
    if (window.poolStatus == undefined) {
      window.poolStatus = true;
    }
    status = window.poolStatus;
  }
  let pools = JSON.parse(localStorage.getItem("pools")) || { list: [] };

  const currencies = pools.list
    .map((pool) => [pool.currency1.id, pool.currency2.id])
    .flat();
  const uniqueCurrencies = [...new Set(currencies)];

  if (window.priceData == undefined) {
    window.priceData = await fetchPrices(uniqueCurrencies);
  }
  window.poolStatus = status;

  pools = pools.list
    .map((pool, index) => {
      pool.id = index;
      return pool;
    })
    .filter((pool) => pool.status === status);

  if (!status) {
    pools = pools.sort((a, b) => {
      return new Date(b.startDate) - new Date(a.startDate);
    });
  }

  window.poolList.innerHTML = "";
  let totalPool = 0;
  let entryTotal = 0;
  let currentTotal = 0;

  for (let index = 0; index < pools.length; index++) {
    const poolValue = await addPoolToList(
      pools[index],
      pools[index].id,
      window.priceData
    );
    totalPool += poolValue.pnl;
    entryTotal += poolValue.totalEntry;
    currentTotal += poolValue.poolCurrentAssets;
  }

    document.getElementById("totalPool").innerHTML =
        totalPool > 0
            ? `Entrada: $${entryTotal.toFixed(2)} |
         Atual: $${currentTotal.toFixed(2)} |
         PnL: <span class="text-success">▲ $${totalPool.toFixed(2)}</span>
         (${((totalPool / currentTotal) * 100).toFixed(2)}%)`
            : `Entrada: $${entryTotal.toFixed(2)} |
         Atual: $${currentTotal.toFixed(2)} |
         PnL: <span class="text-danger">▼ $${totalPool.toFixed(2)}</span>
         (${((totalPool / currentTotal) * 100).toFixed(2)}%)`;

  setTimeout(() => {
    const tooltipTriggerList = Array.from(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    tooltipTriggerList.forEach((tooltipTriggerEl) => {
      new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }, 100);

  mountPoolRanges();
}

function mountPoolRanges() {
  const bars = document.querySelectorAll(".bar-container");

  if (!bars) return;
  bars.forEach((bar) => {
    const currentPrice = parseFloat(bar.getAttribute("data-current"));
    const maxPrice = parseFloat(bar.getAttribute("data-max"));
    const minPrice = parseFloat(bar.getAttribute("data-min"));

    const rangeMin = minPrice - minPrice * 0.1;
    const rangeMax = maxPrice + maxPrice * 0.1;
    const range = rangeMax - rangeMin;

    const barFill = bar.querySelector(".bar-fill");
    const priceMarker = bar.querySelector(".price-marker");
    const barWidth = bar.clientWidth;

    // Centralizando o marcador de preço
    const currentPos = ((currentPrice - rangeMin) / range) * barWidth;
    priceMarker.style.left = currentPos <= barWidth ? `${currentPos}px` : `calc(${barWidth}px + 4px)`;
    if (currentPos < 0) {
      priceMarker.style.left = "-4px";
    }

    // Definindo a largura da barra verde e centralizando
    const barFillWidth = ((maxPrice - minPrice) / range) * barWidth;
    barFill.style.width = `${barFillWidth}px`;

    if (currentPrice < minPrice || currentPrice > maxPrice) {
      bar.setAttribute("data-out", true);
    }
  });
}

// Remove uma pool do localStorage e da lista
function deletePool(index) {
  if (!confirm("Tem certeza que deseja excluir esta pool?")) {
    return;
  }
  let pools = JSON.parse(localStorage.getItem("pools")) || { list: [] };
  pools.list.splice(index, 1); // Remove o item pelo índice
  localStorage.setItem("pools", JSON.stringify(pools)); // Atualiza o localStorage
  loadPools(); // Recarrega a lista
  deleteAllTooltips();
}

function deleteChange(index, changeIndex) {
  if (!confirm("Tem certeza que deseja excluir esta mudança?")) {
    return;
  }

  let pools = JSON.parse(localStorage.getItem("pools")) || { list: [] };
  pools.list[index].changes.splice(changeIndex, 1);
  localStorage.setItem("pools", JSON.stringify(pools)); // Atualiza o localStorage
  loadPools(); // Recarrega a lista
  deleteAllTooltips();
}

function archivePool(index, priceCurrency1, priceCurrency2) {
  let pools = JSON.parse(localStorage.getItem("pools")) || { list: [] };
  let str = pools.list[index].status ? "arquivar" : "desarquivar";

  if (!confirm(`Tem certeza que deseja ${str} esta pool?`)) {
    return;
  }
  if (pools.list[index].status) {
    pools.list[index].priceCurrency1 = priceCurrency1;
    pools.list[index].priceCurrency2 = priceCurrency2;
  } else {
    delete pools.list[index].priceCurrency1;
    delete pools.list[index].priceCurrency2;
  }
  pools.list[index].status = !pools.list[index].status;
  pools.list[index].archivedDate = pools.list[index].status ? null : new Date().toString();

  localStorage.setItem("pools", JSON.stringify(pools)); // Atualiza o localStorage
  clickToPool(!pools.list[index].status); // Recarrega a lista
  deleteAllTooltips();
}

document.addEventListener("DOMContentLoaded", function () {
  window.poolList = document.getElementById("poolList");

  // Carrega as pools ao carregar a página
  loadPools();
});

function clickToPool(status) {
  if (status) {
    document
      .querySelector("#filter button:nth-child(2)")
      .classList.remove("btn-secondary");
    document
      .querySelector("#filter button:nth-child(2)")
      .classList.add("btn-outline-secondary");

    document
      .querySelector("#filter button:nth-child(1)")
      .classList.add("btn-secondary");
    document
      .querySelector("#filter button:nth-child(1)")
      .classList.remove("btn-outline-secondary");
  } else {
    document
      .querySelector("#filter button:nth-child(1)")
      .classList.remove("btn-secondary");
    document
      .querySelector("#filter button:nth-child(1)")
      .classList.add("btn-outline-secondary");

    document
      .querySelector("#filter button:nth-child(2)")
      .classList.add("btn-secondary");
    document
      .querySelector("#filter button:nth-child(2)")
      .classList.remove("btn-outline-secondary");
  }

  loadPools(status);
}

function deleteAllTooltips() {
  document.querySelectorAll(".tooltip").forEach((tooltip) => {
    tooltip.remove();
  });
}

function changeLiquid(index) {
  window.liquidModal = new bootstrap.Modal(
    document.getElementById("liquidModal")
  );

  let pools = JSON.parse(localStorage.getItem("pools")) || { list: [] };
  let pool = pools.list[index];

  updateStep(0, 'liquid-');

  document.getElementById('poolName').innerText = `${pool.currency1.symbol}/${pool.currency2.symbol}`;
  document.getElementById('poolIndex').value = index;
  document.getElementById('token1').innerText = pool.currency1.symbol;
  document.getElementById('token2').innerText = pool.currency2.symbol;

  window.liquidModal.show();
}

document.getElementById("saveLiquid").addEventListener("click", function (e) {

  let pools = JSON.parse(localStorage.getItem("pools")) || { list: [] };
  let index = document.getElementById('poolIndex').value;
  let pool = pools.list[index];

  if (pool.changes === undefined) {
    pool.changes = [];
  }
  pool.changes.push({
    type: document.getElementById('type').value,
    date: document.getElementById('changeDate').value + ' 00:00:01',
    dollar: document.getElementById('changeDollar').value,
    tokens1: parseFloat(document.getElementById('changeCurrency1').value),
    tokens2: parseFloat(document.getElementById('changeCurrency2').value)
  });

  pools.list[index] = pool;
  localStorage.setItem("pools", JSON.stringify(pools));

  loadPools();
  window.liquidModal.hide();
});