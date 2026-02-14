// vast-modal-offer.js - Offer details modal
(function () {
	'use strict';

	window.VastModals = window.VastModals || {};

	// --- helpers (local to this module) ---
	function toNumber(v) {
		const n = Number(v);
		return Number.isFinite(n) ? n : null;
	}

	// Vast can return reliability as reliability or reliability2 (0..1) - be defensive
	function getReliability01(offer) {
		if (!offer) return null;

		let r = toNumber(offer.reliability);
		if (r === null) r = toNumber(offer.reliability2);
		if (r === null) return null;

		// If percent accidentally passed
		if (r > 1.0) r = r / 100.0;

		// Clamp
		if (r < 0) r = 0;
		if (r > 1) r = 1;

		return r;
	}

	// Remove trailing zeros for decimal strings: "99.90" -> "99.9", "99.00" -> "99"
	function trimTrailingZeros(numStr) {
		if (typeof numStr !== 'string') return numStr;
		if (!numStr.includes('.')) return numStr;
		return numStr.replace(/\.?0+$/, (m) => (m === '.' ? '' : ''));
	}

	// Truthful reliability text:
	// - "100%" only if exactly 1.0
	// - >= 99.5% => up to 2 decimals (then trim zeros)
	// - else 1 decimal (then trim zeros)
	function formatReliabilityText(offer) {
		const r = getReliability01(offer);
		if (r === null) return null;

		// Truly perfect only
		if (r === 1) return '100%';

		const pct = r * 100;
		if (pct >= 99.5) {
			return trimTrailingZeros(pct.toFixed(2)) + '%';
		}
		return trimTrailingZeros(pct.toFixed(1)) + '%';
	}

	function reliabilityMeta(reliabilityText) {
		// returns { class, icon } based on numeric percent inside the text
		if (!reliabilityText) {
			return { badge: 'secondary', icon: 'fa-question' };
		}
		const n = parseFloat(reliabilityText.replace('%', ''));
		if (!Number.isFinite(n)) return { badge: 'secondary', icon: 'fa-question' };

		if (n >= 99) return { badge: 'success', icon: 'fa-star' };
		if (n >= 95) return { badge: 'info', icon: 'fa-star-half-alt' };
		if (n >= 90) return { badge: 'warning', icon: 'fa-exclamation-triangle' };
		return { badge: 'danger', icon: 'fa-times-circle' };
	}

	window.VastModals.Offer = {

		showDetails: function (offer) {
			offer = offer || {};

			$('#offer-detail-gpu').text(offer.gpu_name || 'N/A');
			$('#offer-detail-gpu-count').text(
				(offer.num_gpus || 0) + ' GPU' + (offer.num_gpus > 1 ? 's' : '')
			);

			$('#offer-detail-gpu-ram').text(
				offer.gpu_ram
					? VastUtils.formatBytes(offer.gpu_ram * 1024 * 1024 * 1024) + ' per GPU'
					: 'N/A'
			);

			$('#offer-detail-cpu-cores').text(
				(offer.cpu_cores || 0) + ' cores @ ' +
				(toNumber(offer.cpu_cores_effective) ?? 0).toFixed(2) + ' effective'
			);

			$('#offer-detail-ram').text(
				offer.cpu_ram
					? VastUtils.formatBytes(offer.cpu_ram * 1024 * 1024 * 1024)
					: 'N/A'
			);

			$('#offer-detail-disk').text(
				offer.disk_space
					? VastUtils.formatBytes(offer.disk_space * 1024 * 1024 * 1024)
					: 'N/A'
			);

			$('#offer-detail-price').text(
				VastUtils.formatCurrency(offer.dph_total || 0, 'USD', 3) + ' / hour'
			);

			const dailyCost = (offer.dph_total || 0) * 24;
			const monthlyCost = dailyCost * 30;
			$('#offer-detail-price-daily').text(
				VastUtils.formatCurrency(dailyCost, 'USD', 2) + ' / day'
			);
			$('#offer-detail-price-monthly').text(
				VastUtils.formatCurrency(monthlyCost, 'USD', 2) + ' / month'
			);

			$('#offer-detail-flops').text(
				offer.flops_per_dphtotal
					? offer.flops_per_dphtotal.toFixed(1) + ' TFLOPS/$'
					: 'N/A'
			);

			$('#offer-detail-cuda').text(offer.cuda_max_good || 'N/A');

			$('#offer-detail-pcie').text(
				offer.pcie_bw
					? offer.pcie_bw.toFixed(1) + ' GB/s'
					: 'N/A'
			);

			$('#offer-detail-direct-port').text(offer.direct_port_count || 0);

			$('#offer-detail-down').text(
				offer.inet_down
					? offer.inet_down.toFixed(0) + ' Mbps (' + (offer.inet_down / 1000).toFixed(2) + ' Gbps)'
					: 'N/A'
			);

			$('#offer-detail-up').text(
				offer.inet_up
					? offer.inet_up.toFixed(0) + ' Mbps (' + (offer.inet_up / 1000).toFixed(2) + ' Gbps)'
					: 'N/A'
			);

			// Public IP badge is static HTML - safe
			$('#offer-detail-public-ip').html(
				offer.public_ipaddr
					? '<span class="badge bg-success rounded-pill"><i class="fas fa-check-circle"></i> Available</span>'
					: '<span class="badge bg-secondary rounded-pill"><i class="fas fa-times-circle"></i> Not Available</span>'
			);

			// Location: avoid injecting raw strings into html
			const location = VastUtils.getCountryName(offer.geolocation);
			const continent = VastUtils.getContinent(offer.geolocation);
			$('#offer-detail-location').html(
				'<i class="fas fa-map-marker-alt"></i> ' +
				VastUtils.escapeHtml(String(location || 'Unknown')) +
				' <small class="text-muted">(' + VastUtils.escapeHtml(String(continent || 'Unknown')) + ')</small>'
			);

			// Reliability badge (truthful, no rounding-up lies, no trailing zeros)
			const reliabilityText = formatReliabilityText(offer); // e.g. "99.9%"
			const relMeta = reliabilityMeta(reliabilityText);
			$('#offer-detail-reliability').html(
				'<span class="badge bg-' + relMeta.badge + ' rounded-pill" title="Reliability: ' + (reliabilityText ? VastUtils.escapeHtml(reliabilityText) : 'N/A') + '">' +
				'<i class="fas ' + relMeta.icon + '"></i> ' + (reliabilityText ? VastUtils.escapeHtml(reliabilityText) : 'N/A') +
				'</span>'
			);

			$('#offer-detail-score').text(
				offer.score ? offer.score.toFixed(2) : 'N/A'
			);

			$('#offer-detail-duration').text(
				offer.duration
					? (offer.duration / 86400).toFixed(1) + ' days'
					: '∞ Unlimited'
			);

			$('#offer-detail-machine-id').text(offer.machine_id || 'N/A');

			// Verification badge is static HTML - safe
			let verificationHtml = '';
			if (offer.verification === 'verified') {
				verificationHtml = '<span class="badge bg-success rounded-pill"><i class="fas fa-check-circle"></i> Verified</span>';
			} else if (offer.verification === 'deverified') {
				verificationHtml = '<span class="badge bg-danger rounded-pill"><i class="fas fa-times-circle"></i> Deverified</span>';
			} else {
				verificationHtml = '<span class="badge bg-secondary rounded-pill"><i class="fas fa-question-circle"></i> Unverified</span>';
			}
			$('#offer-detail-verified').html(verificationHtml);

			// Hosting type: support numeric OR string
			const isDc = (offer.hosting_type === 1 || offer.hosting_type === '1');
			const hostingType = isDc
				? '<span class="badge bg-primary rounded-pill"><i class="fas fa-building"></i> Datacenter</span>'
				: '<span class="badge bg-secondary rounded-pill"><i class="fas fa-home"></i> Consumer</span>';
			$('#offer-detail-hosting-type').html(hostingType);

			$('#offer-detail-host-id').text(offer.host_id || 'N/A');
			$('#offer-detail-id').text(offer.id || 'N/A');

			if (offer.storage_type) {
				$('#offer-detail-storage-type').text(offer.storage_type).parent().show();
			} else {
				$('#offer-detail-storage-type').parent().hide();
			}

			if (offer.gpu_fmax && offer.dph_total && offer.dph_total > 0) {
				const tflops = offer.gpu_fmax * (offer.num_gpus || 1);
				const valueScore = tflops / offer.dph_total;
				$('#offer-detail-value-score').text(valueScore.toFixed(2) + ' TFLOPS/$');
			} else {
				$('#offer-detail-value-score').text('N/A');
			}

			// JSON: text() is safe
			$('#offer-detail-json').text(JSON.stringify(offer, null, 2));

			$('#quickRentOfferBtn')
				.data('offer-id', offer.id)
				.data('offer-data', offer);

			$('#offerDetailsModal').modal('show');
		},

		init: function () {
			$('#toggleOfferJsonBtn').off('click').on('click', function () {
				$('#offer-detail-json-container').slideToggle(200);
				const icon = $(this).find('i');
				if (icon.hasClass('fa-eye')) {
					icon.removeClass('fa-eye').addClass('fa-eye-slash');
					$(this).attr('title', 'Hide JSON');
				} else {
					icon.removeClass('fa-eye-slash').addClass('fa-eye');
					$(this).attr('title', 'Show JSON');
				}
			});

			$('#copyOfferJsonBtn').off('click').on('click', function () {
				const jsonText = $('#offer-detail-json').text();
				VastUtils.copyToClipboard(jsonText);

				VastNotifications.success(
					'Copied to Clipboard',
					'Offer JSON data copied',
					{ duration: 2000 }
				);

				const originalText = $(this).html();
				$(this).html('<i class="fas fa-check"></i> Copied!');
				setTimeout(() => {
					$(this).html(originalText);
				}, 1500);
			});

			$('#quickRentOfferBtn').off('click').on('click', function () {
				const offerId = $(this).data('offer-id');
				const offerData = $(this).data('offer-data');

				$('#offerDetailsModal').modal('hide');

				setTimeout(() => {
					VastModals.Instance.showCreateModal(offerId, offerData);
				}, 300);
			});

			$('#copyOfferIdBtn').off('click').on('click', function () {
				const offerId = $('#offer-detail-id').text();
				VastUtils.copyToClipboard(offerId);

				VastNotifications.success(
					'Copied to Clipboard',
					`Offer ID: ${offerId}`,
					{ duration: 2000 }
				);

				$(this).find('i').removeClass('fa-copy').addClass('fa-check');
				setTimeout(() => {
					$(this).find('i').removeClass('fa-check').addClass('fa-copy');
				}, 1000);
			});

			$('#copyMachineIdBtn').off('click').on('click', function () {
				const machineId = $('#offer-detail-machine-id').text();
				VastUtils.copyToClipboard(machineId);

				VastNotifications.success(
					'Copied to Clipboard',
					`Machine ID: ${machineId}`,
					{ duration: 2000 }
				);

				$(this).find('i').removeClass('fa-copy').addClass('fa-check');
				setTimeout(() => {
					$(this).find('i').removeClass('fa-check').addClass('fa-copy');
				}, 1000);
			});

			$('#compareOfferBtn').off('click').on('click', function () {
				VastNotifications.info(
					'Compare Feature',
					'Offer comparison feature coming soon!',
					{ duration: 3000 }
				);
			});
		}
	};

})();
