// Função para buscar moedas da API CoinGecko
async function searchCrypto(query, resultContainer) {
    if (!query) {
        resultContainer.style.display = "none";
        resultContainer.innerHTML = "";
        return;
    }

    const apiUrl = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`;
    try {
        const response = await fetch(apiUrl, {
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Erro ao buscar moedas. Tente novamente mais tarde.");
        }

        const data = await response.json();
        displaySearchResults(data.coins, resultContainer);
    } catch (error) {
        console.error("Erro na busca:", error);
        resultContainer.innerHTML = `<li class="list-group-item text-danger">Erro ao buscar moedas.</li>`;
        resultContainer.style.display = "block";
    }
}

// Exibe os resultados da busca com imagem
function displaySearchResults(coins, resultContainer) {
    resultContainer.innerHTML = "";
    if (coins.length === 0) {
        resultContainer.innerHTML = `<li class="list-group-item">Nenhuma moeda encontrada.</li>`;
    } else {
        coins.forEach((coin) => {
            const listItem = document.createElement("li");
            listItem.className = "list-group-item d-flex align-items-center";
            listItem.dataset.coinId = coin.id;
            listItem.dataset.coinName = coin.name;
            listItem.dataset.coinThumb = coin.thumb;
            listItem.dataset.coinSymbol = coin.symbol;

            listItem.innerHTML = `
                <img src="${coin.thumb}" alt="${coin.name}" class="me-2" style="width: 24px; height: 24px;">
                <span>${coin.name} (${coin.symbol.toUpperCase()})</span>
            `;

            listItem.addEventListener("click", function () {
                selectCoin(coin.name, coin.id, coin.thumb, coin.symbol, resultContainer);
            });
            resultContainer.appendChild(listItem);
        });
    }
    resultContainer.style.display = "block";
}

// Define a moeda selecionada no campo de entrada
function selectCoin(name, id, thumb, symbol, resultContainer) {
    const inputField =
        resultContainer === window.currency1Results ? window.currency1Input : window.currency2Input;
    inputField.value = name;
    inputField.dataset.coinId = id;
    inputField.dataset.coinThumb = thumb;
    inputField.dataset.coinSymbol = symbol;
    resultContainer.style.display = "none";
}

// Função de debounce para limitar requisições
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}



// Função para selecionar uma moeda
function selectCoin(name, id, thumb, symbol, resultContainer) {
    const inputField =
        resultContainer === window.currency1Results ? window.currency1Input : window.currency2Input;
    const clearButton =
        resultContainer === window.currency1Results ? window.clearCurrency1 : window.clearCurrency2;

    // Defina os valores no campo de entrada e desabilite-o
    inputField.value = name + " (" + symbol.toUpperCase() + ")";
    inputField.dataset.coinId = id;
    inputField.dataset.coinThumb = thumb;
    inputField.dataset.coinSymbol = symbol;
    inputField.disabled = true;

    // Adicione a imagem no campo de entrada (ou como parte do botão)
    const icon = document.createElement("img");
    icon.src = thumb;
    icon.alt = name;
    inputField.parentElement.insertBefore(icon, inputField);

    // Mostre o botão de limpeza
    clearButton.style.display = "block";

    // Esconda os resultados
    resultContainer.style.display = "none";
}

// Função para limpar a seleção
function clearSelection(inputField, resultContainer, clearButton) {
    inputField.value = "";
    inputField.disabled = false;
    inputField.removeAttribute("data-coin-id");
    inputField.removeAttribute("data-coin-thumb");
    inputField.removeAttribute("data-coin-symbol");

    // Remova a imagem associada
    const icon = inputField.parentElement.querySelector("img");
    if (icon) {
        icon.remove();
    }

    // Esconda o botão de limpeza e os resultados
    clearButton.style.display = "none";
    resultContainer.style.display = "none";
}

// Configuração inicial no DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
    window.currency1Input = document.getElementById("currency1");
    window.currency2Input = document.getElementById("currency2");
    window.currency1Results = document.getElementById("currency1Results");
    window.currency2Results = document.getElementById("currency2Results");
    window.clearCurrency1 = document.getElementById("clearCurrency1");
    window.clearCurrency2 = document.getElementById("clearCurrency2");

    const handleCurrency1Input = debounce(function () {
        searchCrypto(window.currency1Input.value, window.currency1Results);
    }, 500);

    const handleCurrency2Input = debounce(function () {
        searchCrypto(window.currency2Input.value, window.currency2Results);
    }, 500);

    // Adicionar eventos para os campos de entrada
    window.currency1Input.addEventListener("keyup", handleCurrency1Input);
    window.currency2Input.addEventListener("keyup", handleCurrency2Input);

    // Adicionar eventos para os botões de limpeza
    window.clearCurrency1.addEventListener("click", function () {
        clearSelection(window.currency1Input, window.currency1Results, window.clearCurrency1);
    });
    window.clearCurrency2.addEventListener("click", function () {
        clearSelection(window.currency2Input, window.currency2Results, window.clearCurrency2);
    });
});
