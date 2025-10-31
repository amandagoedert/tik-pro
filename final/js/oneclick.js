(function (window) {
	loadUpsellData();
})(this);

function loadUpsellData() {
	var urlParams = new URLSearchParams(window.location.search);
	var venda = urlParams.get('fpay');
	var domain = urlParams.get('domain');

	var newDomain = (typeof domain !== 'undefined' && domain !== null && domain !== 'null') ? domain : '';
    var fpay = (typeof venda !== 'undefined' && venda !== null && venda !== 'null') ? venda : '';

	var upsells = document.querySelectorAll('[data-fornpay]') || [];
	upsells.forEach(upsell => {
		var hash_upsell = upsell.getAttribute('data-fornpay');

        if(!newDomain || !fpay){
            console.warn('Não é possível processar o pagamento de upsell, sem ter vindo de uma compra anterior legítima.');
            upsell.ariaDisabled = true;
            upsell.style.pointerEvents = 'none';
            upsell.style.opacity = '0.5';
            return;
        }

		upsell.addEventListener('click', event => {
			event.target.innerHTML = "Aguarde, processando pagamento...";
			event.target.remove();

			window.location.href = `${newDomain}/process-upsell?uh=${hash_upsell}&fpay=${venda}&domain=${newDomain}`;
		})
	});

	var downsell = document.querySelectorAll('[data-downsell]') || [];
	downsell.forEach(downsell => {
		var url_downsell = downsell.getAttribute('data-downsell');

        if(!newDomain || !fpay){
            console.warn('Não é possível processar o pagamento de upsell, sem ter vindo de uma compra anterior legítima.');
            downsell.ariaDisabled = true;
            downsell.style.pointerEvents = 'none';
            downsell.style.opacity = '0.5';
            return;
        }

		downsell.addEventListener('click', event => {
			event.target.innerHTML = "Aguarde, processando pagamento...";
			event.target.remove();

			window.location.href = `${url_downsell}?fpay=${venda}&domain=${newDomain}`;
		})
	});
}
