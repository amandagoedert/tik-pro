(function (window) {
    const STORAGE_KEYS = {
        total: 'rewardTotal',
        pendingPopupId: 'pendingRewardPopupId',
        pendingStart: 'pendingRewardStart',
        pendingEnd: 'pendingRewardEnd',
        pendingDuration: 'pendingRewardDuration'
    };
    const DEFAULT_DURATION = 1500;

    function parseAmount(value) {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : null;
        }
        const cleaned = value.toString().replace(',', '.');
        const parsed = parseFloat(cleaned);
        return Number.isFinite(parsed) ? parsed : null;
    }

    function formatAmount(value) {
        return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function animateCounter(element, start, end, duration) {
        const startTime = performance.now();

        function step(currentTime) {
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const currentValue = start + (end - start) * progress;
            element.textContent = formatAmount(currentValue);
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                element.textContent = formatAmount(end);
            }
        }

        element.textContent = formatAmount(start);
        requestAnimationFrame(step);
    }

    function clearPending() {
        sessionStorage.removeItem(STORAGE_KEYS.pendingPopupId);
        sessionStorage.removeItem(STORAGE_KEYS.pendingStart);
        sessionStorage.removeItem(STORAGE_KEYS.pendingEnd);
        sessionStorage.removeItem(STORAGE_KEYS.pendingDuration);
    }

    function resetProgress() {
        sessionStorage.removeItem(STORAGE_KEYS.total);
        clearPending();
    }

    function getCounterSelector(popupId) {
        return `.elementor-${popupId} .elementor-counter-number`;
    }

    function getCounterElement(popupId) {
        return document.querySelector(getCounterSelector(popupId));
    }

    function ensureDuration(duration) {
        const parsed = parseInt(duration, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DURATION;
    }

    function registerReward(popupId, options) {
        if (!popupId) {
            return null;
        }
        const settings = options || {};

        const existingPendingPopup = sessionStorage.getItem(STORAGE_KEYS.pendingPopupId);
        if (existingPendingPopup && existingPendingPopup.toString() === popupId.toString()) {
            const pendingStart = parseAmount(sessionStorage.getItem(STORAGE_KEYS.pendingStart));
            const pendingEnd = parseAmount(sessionStorage.getItem(STORAGE_KEYS.pendingEnd));
            if (pendingStart !== null && pendingEnd !== null) {
                return {
                    rewardValue: pendingEnd - pendingStart,
                    currentTotal: pendingStart,
                    newTotal: pendingEnd
                };
            }
        }

        const counterElement = getCounterElement(popupId);
        if (!counterElement) {
            console.warn('RewardFlow: contador não encontrado para o popup', popupId);
            return null;
        }
        const rewardValue = parseAmount(
            settings.amount !== undefined ? settings.amount : counterElement.getAttribute('data-to-value')
        );
        if (rewardValue === null) {
            console.warn('RewardFlow: valor da recompensa inválido para o popup', popupId);
            return null;
        }

        const currentTotal = parseAmount(sessionStorage.getItem(STORAGE_KEYS.total)) || 0;
        const newTotal = currentTotal + rewardValue;

        sessionStorage.setItem(STORAGE_KEYS.total, newTotal.toFixed(2));
        sessionStorage.setItem(STORAGE_KEYS.pendingPopupId, popupId.toString());
        sessionStorage.setItem(STORAGE_KEYS.pendingStart, currentTotal.toFixed(2));
        sessionStorage.setItem(STORAGE_KEYS.pendingEnd, newTotal.toFixed(2));
        sessionStorage.setItem(STORAGE_KEYS.pendingDuration, ensureDuration(settings.duration).toString());

        return {
            rewardValue,
            currentTotal,
            newTotal
        };
    }

    function waitForElementor(callback) {
        if (
            window.elementorProFrontend &&
            window.elementorProFrontend.modules &&
            window.elementorProFrontend.modules.popup
        ) {
            callback(window.elementorProFrontend);
        } else {
            requestAnimationFrame(function () {
                waitForElementor(callback);
            });
        }
    }

    function showPendingReward() {
        const popupId = sessionStorage.getItem(STORAGE_KEYS.pendingPopupId);
        const endAmount = parseAmount(sessionStorage.getItem(STORAGE_KEYS.pendingEnd));
        if (!popupId || endAmount === null) {
            clearPending();
            return;
        }

        const startAmount = parseAmount(sessionStorage.getItem(STORAGE_KEYS.pendingStart));
        const duration = ensureDuration(sessionStorage.getItem(STORAGE_KEYS.pendingDuration));
        const counterElement = getCounterElement(popupId);

        if (!counterElement) {
            console.warn('RewardFlow: contador pendente não encontrado para o popup', popupId);
            clearPending();
            return;
        }

        const startValue = Number.isFinite(startAmount) ? startAmount : 0;

        waitForElementor(function (elementorFrontendInstance) {
            counterElement.setAttribute('data-from-value', startValue.toString());
            counterElement.setAttribute('data-to-value', endAmount.toString());
            counterElement.textContent = formatAmount(startValue);

            elementorFrontendInstance.modules.popup.showPopup({ id: popupId });
            animateCounter(counterElement, startValue, endAmount, duration);
            clearPending();
        });
    }

    window.rewardFlow = {
        STORAGE_KEYS,
        parseAmount,
        formatAmount,
        animateCounter,
        registerReward,
        resetProgress,
        showPendingReward,
        clearPending
    };

    document.addEventListener('DOMContentLoaded', showPendingReward);
})(window);
