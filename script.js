document.addEventListener('DOMContentLoaded', function () {
    const amountInput = document.getElementById('amount');
    const fromCurrencySelect = document.getElementById('fromCurrency');
    const toCurrencySelect = document.getElementById('toCurrency');
    const convertedAmountInput = document.getElementById('convertedAmount');
    const swapBtn = document.getElementById('swapBtn');
    const rateText = document.getElementById('rateText');
    const rateChange = document.getElementById('rateChange');
    const lastUpdated = document.getElementById('lastUpdated');
    const popularConversions = document.getElementById('popularConversions');
    const topCryptos = document.getElementById('topCryptos').querySelector('tbody');
    const themeToggle = document.querySelector('.theme-toggle');
    const themeIcon = document.getElementById('themeIcon');
    const ctx = document.getElementById('chart').getContext('2d');

    let exchangeRates = {};

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Exchange Rate History',
                data: [],
                borderColor: '#6c5ce7',
                backgroundColor: 'rgba(108, 92, 231, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: false, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            themeIcon.classList.replace('fa-sun', 'fa-moon');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        }
    });

    const cryptoList = [
        { id: 'bitcoin', symbol: 'BTC' },
        { id: 'ethereum', symbol: 'ETH' },
        { id: 'tether', symbol: 'USDT' },
        { id: 'binancecoin', symbol: 'BNB' },
        { id: 'ripple', symbol: 'XRP' },
        { id: 'solana', symbol: 'SOL' },
        { id: 'usd', symbol: 'USD' },
        { id: 'eur', symbol: 'EUR' },
        { id: 'gbp', symbol: 'GBP' }
    ];

    async function fetchExchangeRates() {
        const ids = cryptoList.map(c => c.id).join(',');
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

        try {
            const res = await fetch(url);
            const data = await res.json();

            exchangeRates = {};
            cryptoList.forEach(c => {
                exchangeRates[c.id] = {
                    price: data[c.id]?.usd || 0,
                    change24h: data[c.id]?.usd_24h_change || 0,
                    symbol: c.symbol
                };
            });

            updateDateTime();
            calculateConversion();
            populatePopularConversions();
            populateTopCryptos();
            generateHistoricalData();
        } catch (err) {
            console.error('Failed to fetch exchange rates:', err);
        }
    }

    function updateDateTime() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        lastUpdated.textContent = `Last updated: ${now.toLocaleDateString('en-US', options)}`;
    }

    function calculateConversion() {
        const amount = parseFloat(amountInput.value) || 0;
        const fromCurrency = fromCurrencySelect.value;
        const toCurrency = toCurrencySelect.value;

        if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) return;

        const amountInUSD = amount * exchangeRates[fromCurrency].price;
        const convertedAmount = amountInUSD / exchangeRates[toCurrency].price;
        convertedAmountInput.value = convertedAmount.toFixed(8);

        const fromSymbol = exchangeRates[fromCurrency].symbol;
        const toSymbol = exchangeRates[toCurrency].symbol;
        const rate = (exchangeRates[fromCurrency].price / exchangeRates[toCurrency].price).toFixed(8);
        rateText.textContent = `1 ${fromSymbol} = ${rate} ${toSymbol}`;

        const change = exchangeRates[toCurrency].change24h - exchangeRates[fromCurrency].change24h;
        rateChange.className = change >= 0 ? 'rate-change positive' : 'rate-change negative';
        rateChange.innerHTML = `${change >= 0 ? '<i class="fas fa-caret-up"></i>' : '<i class="fas fa-caret-down"></i>'} ${Math.abs(change).toFixed(2)}%`;
    }

    function swapCurrencies() {
        const temp = fromCurrencySelect.value;
        fromCurrencySelect.value = toCurrencySelect.value;
        toCurrencySelect.value = temp;
        calculateConversion();
        generateHistoricalData();
    }

    function generateHistoricalData() {
        const days = 7;
        const labels = [];
        const data = [];

        const fromCurrency = fromCurrencySelect.value;
        const toCurrency = toCurrencySelect.value;
        const baseRate = exchangeRates[fromCurrency].price / exchangeRates[toCurrency].price;

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            const fluctuation = 1 + (Math.random() * 0.1 - 0.05);
            data.push((baseRate * fluctuation).toFixed(8));
        }

        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.data.datasets[0].label = `${exchangeRates[fromCurrency].symbol}/${exchangeRates[toCurrency].symbol} Exchange Rate`;
        chart.update();
    }

    function populatePopularConversions() {
        popularConversions.innerHTML = '';
        const baseCurrency = fromCurrencySelect.value;
        const baseSymbol = exchangeRates[baseCurrency].symbol;

        cryptoList.forEach(c => {
            if (c.id !== baseCurrency && exchangeRates[c.id]) {
                const rate = (exchangeRates[baseCurrency].price / exchangeRates[c.id].price).toFixed(8);
                const item = document.createElement('div');
                item.className = 'popular-item';
                item.innerHTML = `
                    <div class="pair">${baseSymbol} → ${exchangeRates[c.id].symbol}</div>
                    <div class="rate">1 ${baseSymbol} = ${rate} ${exchangeRates[c.id].symbol}</div>
                `;
                item.addEventListener('click', () => {
                    toCurrencySelect.value = c.id;
                    calculateConversion();
                    generateHistoricalData();
                });
                popularConversions.appendChild(item);
            }
        });
    }

    function populateTopCryptos() {
        topCryptos.innerHTML = '';
        const top = cryptoList.slice(0, 6);
        top.forEach((c, index) => {
            const data = exchangeRates[c.id];
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="https://cryptologos.cc/logos/${c.id}-${c.symbol.toLowerCase()}-logo.png"
                             alt="${c.symbol}" width="24" height="24" onerror="this.style.display='none'">
                        ${c.id.charAt(0).toUpperCase() + c.id.slice(1)} <span style="color: var(--secondary-color);">${c.symbol}</span>
                    </div>
                </td>
                <td>$${data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="${data.change24h >= 0 ? 'positive' : 'negative'}">
                    ${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(2)}%
                </td>
                <td>-</td>
            `;
            row.addEventListener('click', () => {
                fromCurrencySelect.value = c.id;
                calculateConversion();
                generateHistoricalData();
                populatePopularConversions();
            });
            topCryptos.appendChild(row);
        });
    }

    async function init() {
        await fetchExchangeRates();

        amountInput.addEventListener('input', calculateConversion);
        fromCurrencySelect.addEventListener('change', () => {
            calculateConversion();
            generateHistoricalData();
            populatePopularConversions();
        });
        toCurrencySelect.addEventListener('change', () => {
            calculateConversion();
            generateHistoricalData();
        });
        swapBtn.addEventListener('click', swapCurrencies);
    }

    init();
});
