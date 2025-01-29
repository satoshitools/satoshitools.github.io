// Salva a pool no localStorage
function savePoolToLocalStorage(poolData) {
  let pools = JSON.parse(localStorage.getItem("pools")) || [];
  pools.push(poolData);
  localStorage.setItem("pools", JSON.stringify(pools));
}

async function updatePrices() {
    let pools = JSON.parse(localStorage.getItem("pools")) || [];

  const currencies = pools
    .map((pool) => [pool.currency1.id, pool.currency2.id])
    .flat();
  const uniqueCurrencies = [...new Set(currencies)];

  window.priceData = await fetchPrices(uniqueCurrencies);
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault(); // Bloqueia o envio
      }
    });
  });

  const currency1Input = document.getElementById("currency1");
  const currency2Input = document.getElementById("currency2");
  const poolForm = document.getElementById("poolForm");
  const createPool = document.getElementById("createPool");

  // Evento de envio do formulário
  createPool.addEventListener("click", async function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (!validateStep(4)) return;

    // Validações básicas
    if (!currency1Input.dataset.coinId || !currency2Input.dataset.coinId) {
      alert("Selecione moedas válidas para criar a pool.");
      return;
    }

    window.formModal.hide();

    // Coleta os dados do formulário
    const poolData = {
      status: true,
      startDate: document.getElementById("startDate").value,
      url: document.getElementById("url").value,
      currency1: {
        name: currency1Input.value,
        id: currency1Input.dataset.coinId,
        thumb: currency1Input.dataset.coinThumb,
        symbol: currency1Input.dataset.coinSymbol,
      },
      currency2: {
        name: currency2Input.value,
        id: currency2Input.dataset.coinId,
        thumb: currency2Input.dataset.coinThumb,
        symbol: currency2Input.dataset.coinSymbol,
      },
      tokens1: document.getElementById("tokens1").value,
      tokens2: document.getElementById("tokens2").value,
      feeTokens1: 0,
      feeTokens2: 0,
      currentTokens1: document.getElementById("tokens1").value,
      currentTokens2: document.getElementById("tokens2").value,
      dollars: document.getElementById("dollars").value,
      fee: document.getElementById("fee").value || 0,
      minRange: document.getElementById("minRange").value,
      maxRange: document.getElementById("maxRange").value,
    };

    // Salva a pool no localStorage
    savePoolToLocalStorage(poolData);

    // Limpa os campos do formulário
    poolForm.reset();
    await updatePrices();
    loadPools(); // Atualiza a lista de pools

    clearSelection(
      window.currency1Input,
      window.currency1Results,
      window.clearCurrency1
    );
    clearSelection(
      window.currency2Input,
      window.currency2Results,
      window.clearCurrency2
    );
  });
});

