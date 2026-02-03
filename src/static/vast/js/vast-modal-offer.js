// vast-modal-offer.js - Offer details modal
(function () {
    'use strict';

    window.VastModals = window.VastModals || {};

    window.VastModals.Offer = {

        showDetails: function (offer) {
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
                (offer.cpu_cores_effective || 0).toFixed(2) + ' effective'
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
            $('#offer-detail-public-ip').html(
                offer.public_ipaddr 
                    ? '<span class="badge badge-success badge-pill"><i class="fas fa-check-circle"></i> Available</span>' 
                    : '<span class="badge badge-secondary badge-pill"><i class="fas fa-times-circle"></i> Not Available</span>'
            );

            const location = VastUtils.getCountryName(offer.geolocation);
            const continent = VastUtils.getContinent(offer.geolocation);
            $('#offer-detail-location').html(
                '<i class="fas fa-map-marker-alt"></i> ' + 
                location + ' <small class="text-muted">(' + continent + ')</small>'
            );

            const reliability = offer.reliability2 ? (offer.reliability2 * 100).toFixed(1) : null;
            let reliabilityBadge = 'secondary';
            let reliabilityIcon = 'fa-question';
            let reliabilityText = 'N/A';

            if (reliability !== null) {
                reliabilityText = reliability + '%';
                
                if (reliability >= 99) {
                    reliabilityBadge = 'success';
                    reliabilityIcon = 'fa-star';
                } else if (reliability >= 95) {
                    reliabilityBadge = 'info';
                    reliabilityIcon = 'fa-star-half-alt';
                } else if (reliability >= 90) {
                    reliabilityBadge = 'warning';
                    reliabilityIcon = 'fa-exclamation-triangle';
                } else {
                    reliabilityBadge = 'danger';
                    reliabilityIcon = 'fa-times-circle';
                }
            }

            $('#offer-detail-reliability').html(
                '<span class="badge badge-' + reliabilityBadge + ' badge-pill">' +
                '<i class="fas ' + reliabilityIcon + '"></i> ' + reliabilityText +
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

            let verificationHtml = '';
            if (offer.verification === 'verified') {
                verificationHtml = '<span class="badge badge-success badge-pill"><i class="fas fa-check-circle"></i> Verified</span>';
            } else if (offer.verification === 'deverified') {
                verificationHtml = '<span class="badge badge-danger badge-pill"><i class="fas fa-times-circle"></i> Deverified</span>';
            } else {
                verificationHtml = '<span class="badge badge-secondary badge-pill"><i class="fas fa-question-circle"></i> Unverified</span>';
            }
            $('#offer-detail-verified').html(verificationHtml);

            const hostingType = offer.hosting_type === 1 
                ? '<span class="badge badge-primary badge-pill"><i class="fas fa-building"></i> Datacenter</span>'
                : '<span class="badge badge-secondary badge-pill"><i class="fas fa-home"></i> Consumer</span>';
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
                const offerId = $('#offer-detail-id').text();
                
                VastNotifications.info(
                    'Compare Feature',
                    'Offer comparison feature coming soon!',
                    { duration: 3000 }
                );
            });
        }
    };

})();