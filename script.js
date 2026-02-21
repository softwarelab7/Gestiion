document.addEventListener('DOMContentLoaded', () => {
    const amountInput = document.getElementById('amount');
    const baseValue = document.getElementById('base-amount');
    const ivaValue = document.getElementById('iva-amount');
    const totalValue = document.getElementById('total-amount');

    const calcMode = document.getElementById('calc-mode');
    const inputLabel = document.getElementById('input-label');
    const modeTotalLabel = document.getElementById('mode-total');
    const modeBaseLabel = document.getElementById('mode-base');

    const rateChips = document.querySelectorAll('.rate-chip');

    let ivaRate = 0.19;

    rateChips.forEach(chip => {
        chip.addEventListener('click', () => {
            rateChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            ivaRate = parseFloat(chip.dataset.rate);

            // Update the info box text
            document.querySelector('.info-box p').textContent = `Tarifa seleccionada: ${ivaRate * 100}%`;

            calculateIVA();
        });
    });

    function formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 2
        }).format(amount);
    }

    function formatInput(value) {
        // Remove everything except numbers
        let rawValue = value.replace(/\D/g, '');
        if (!rawValue) return '';

        // Manually format with dots as thousands separators for maximum compatibility
        return rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    function calculateIVA() {
        // Remove dots to get the numeric value
        const rawValue = amountInput.value.replace(/\./g, '');
        const inputValue = parseFloat(rawValue) || 0;

        let base, iva, total;

        if (!calcMode.checked) {
            // "Desglosar" Mode: Input is TOTAL
            total = inputValue;
            base = total / (1 + ivaRate);
            iva = total - base;
        } else {
            // "Sumar" Mode: Input is BASE
            base = inputValue;
            iva = base * ivaRate;
            total = base + iva;
        }

        // Update the label in the UI to show the current rate
        document.querySelector('.result-item:nth-child(2) .label').textContent = `IVA (${ivaRate * 100}%):`;

        baseValue.textContent = formatCurrency(base);
        ivaValue.textContent = formatCurrency(iva);
        totalValue.textContent = formatCurrency(total);
    }

    calcMode.addEventListener('change', () => {
        if (calcMode.checked) {
            inputLabel.textContent = "Monto Base (COP)";
            modeBaseLabel.classList.add('active');
            modeTotalLabel.classList.remove('active');
        } else {
            inputLabel.textContent = "Monto Total (COP)";
            modeTotalLabel.classList.add('active');
            modeBaseLabel.classList.remove('active');
        }
        calculateIVA();
    });

    const copyBtn = document.getElementById('copy-btn');
    const saveBtn = document.getElementById('save-btn');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history');

    // Load history on start
    renderHistory();

    function getHistory() {
        const history = localStorage.getItem('iva_history');
        return history ? JSON.parse(history) : [];
    }

    function saveToHistory(item) {
        let history = getHistory();
        history.unshift(item); // Add to beginning
        history = history.slice(0, 5); // Keep last 5
        localStorage.setItem('iva_history', JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        const history = getHistory();
        if (history.length === 0) {
            historyList.innerHTML = '<p class="empty-msg">No hay cálculos guardados.</p>';
            return;
        }

        historyList.innerHTML = '';
        history.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="hist-info">
                    <span>${item.mode === 'total' ? 'Desglose' : 'Suma'} - ${item.input}</span>
                    <small>${item.date}</small>
                </div>
                <div class="hist-total">${item.total}</div>
            `;
            historyList.appendChild(div);
        });
    }

    amountInput.addEventListener('input', (e) => {
        // Save cursor position if needed (though for currency it can be tricky)
        const start = e.target.selectionStart;
        const oldLength = e.target.value.length;

        const formatted = formatInput(e.target.value);
        e.target.value = formatted;

        // Adjust cursor position
        const newLength = formatted.length;
        e.target.setSelectionRange(start + (newLength - oldLength), start + (newLength - oldLength));

        calculateIVA();
    });

    saveBtn.addEventListener('click', () => {
        const rawValue = amountInput.value;
        if (!rawValue || rawValue === '0') return;

        const item = {
            input: amountInput.value,
            total: totalValue.textContent,
            mode: !calcMode.checked ? 'total' : 'base',
            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        saveToHistory(item);

        // Visual feedback
        const originalText = saveBtn.innerHTML;
        saveBtn.style.background = '#10b981';
        saveBtn.querySelector('span').textContent = '¡Guardado!';
        setTimeout(() => {
            saveBtn.style.background = '';
            saveBtn.innerHTML = originalText;
        }, 1500);
    });

    copyBtn.addEventListener('click', () => {
        const textToCopy = `Calculadora de IVA Colombia\n--------------------------\nModo: ${!calcMode.checked ? 'Desglosar (de Total)' : 'Sumar (a Base)'}\nBase: ${baseValue.textContent}\nIVA (19%): ${ivaValue.textContent}\nTotal: ${totalValue.textContent}\n--------------------------`;

        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = copyBtn.innerHTML;
            copyBtn.classList.add('copied');
            copyBtn.querySelector('span').textContent = '¡Copiado!';

            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = originalText;
            }, 2000);
        });
    });

    const themeToggle = document.getElementById('theme-toggle');

    // Theme initialization
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.body.classList.add('dark');
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        const theme = document.body.classList.contains('dark') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
    });

    clearHistoryBtn.addEventListener('click', () => {
        localStorage.removeItem('iva_history');
        renderHistory();
    });
});
