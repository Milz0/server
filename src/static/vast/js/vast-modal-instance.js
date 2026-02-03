// vast-modal-instance.js - Single instance creation and details modals
(function () {
    'use strict';

    window.VastModals = window.VastModals || {};

    window.VastModals.Instance = {

        currentOffer: null,

        showCreateModal: function (offerId, offerData) {
            this.currentOffer = offerData;
            
            $('#modal-offer-id').val(offerId);
            
            const timestamp = Math.floor(Date.now() / 1000);
            $('#modal-label').val('hashtopolis-agent-' + timestamp).removeClass('is-invalid is-valid');
            $('#modal-disk').val('25').removeClass('is-invalid is-valid');
            $('#modal-image').val($('#vastImage').val() || 'nvidia/cuda:12.0.0-base-ubuntu22.04');
            
            const hourlyCost = offerData.dph_total || 0;
            const dailyCost = hourlyCost * 24;
            const monthlyCost = hourlyCost * 24 * 30;
            
            $('#modal-cost-hourly').text(hourlyCost.toFixed(3));
            $('#modal-cost-daily').text(dailyCost.toFixed(2));
            $('#modal-cost-monthly').text(monthlyCost.toFixed(2));
            
            $('#modal-gpu-info').text((offerData.num_gpus || 1) + 'x ' + (offerData.gpu_name || 'N/A'));
            $('#modal-vram-info').text(VastUtils.formatBytes((offerData.gpu_ram || 0) * 1024 * 1024 * 1024));
            $('#modal-cpu-info').text((offerData.cpu_cores || 0) + ' cores');
            $('#modal-ram-info').text(VastUtils.formatBytes((offerData.cpu_ram || 0) * 1024 * 1024 * 1024));
            
            const location = VastUtils.getCountryName(offerData.geolocation);
            const continent = VastUtils.getContinent(offerData.geolocation);
            $('#modal-location-info').html(location + ' <small class="text-muted">(' + continent + ')</small>');

            const reliability = offerData.reliability2 ? (offerData.reliability2 * 100).toFixed(1) + '%' : 'N/A';
            $('#modal-reliability-info').text(reliability);

            $('#createInstanceModal').modal('show');
        },

        showDetails: function (instance) {
            const hourlyCost = instance.dph_total || 0;
            const dailyCost = hourlyCost * 24;
            const monthlyCost = hourlyCost * 24 * 30;
            
            $('#detail-price-hourly').text('$' + hourlyCost.toFixed(3) + '/hr');
            $('#detail-price-daily').text('$' + dailyCost.toFixed(2) + '/day');
            $('#detail-price-monthly').text('$' + monthlyCost.toFixed(2) + '/mo');
            
            $('#detail-id').text(instance.id || 'N/A');
            $('#detail-label').html('<strong>' + (instance.label || 'N/A') + '</strong>');

            const statusBadge = VastUtils.getStatusBadge(instance.actual_status || instance.intended_status);
            const statusIcon = VastUtils.getStatusIcon(instance.actual_status || instance.intended_status);
            $('#detail-status').html(
                '<span class="badge badge-' + statusBadge + '">' +
                '<i class="fas ' + statusIcon + '"></i> ' + 
                (instance.actual_status || instance.intended_status || 'Unknown').toUpperCase() + 
                '</span>'
            );

            $('#detail-machine-id').text(instance.machine_id || 'N/A');

            if (instance.start_date) {
                const uptimeSeconds = Math.floor(Date.now() / 1000) - instance.start_date;
                const uptimeStr = VastUtils.formatUptime(uptimeSeconds);
                $('#detail-uptime').text(uptimeStr);
                $('#detail-uptime-row').show();
            } else {
                $('#detail-uptime-row').hide();
            }

            $('#detail-gpu').text(instance.gpu_name || 'N/A');
            $('#detail-gpu-count').text((instance.num_gpus || 0) + ' GPU' + (instance.num_gpus > 1 ? 's' : ''));
            $('#detail-cpu').text((instance.cpu_cores || 0) + ' cores @ ' + (instance.cpu_cores_effective || 0) + ' effective');
            $('#detail-ram').text(instance.cpu_ram ? (instance.cpu_ram / 1024).toFixed(1) + ' GB' : 'N/A');
            $('#detail-disk').text(instance.disk_space ? instance.disk_space.toFixed(1) + ' GB' : 'N/A');

            if (instance.agentStats) {
                const stats = instance.agentStats;
                
                let agentHtml = '<div class="alert alert-info mt-2 mb-3">';
                agentHtml += '<h6 class="mb-2"><i class="fas fa-robot"></i> <strong>Hashtopolis Agent Status</strong></h6>';
                
                agentHtml += '<div class="row">';
                agentHtml += '<div class="col-md-6">';
                agentHtml += '<strong>Agent Name:</strong> ' + (stats.agentName || 'N/A') + '<br>';
                agentHtml += '<strong>Status:</strong> ';
                if (stats.isActive === 'yes') {
                    agentHtml += '<span class="badge badge-success"><i class="fas fa-check-circle"></i> Active</span>';
                } else {
                    agentHtml += '<span class="badge badge-secondary"><i class="fas fa-times-circle"></i> Inactive</span>';
                }
                agentHtml += '</div>';
                
                agentHtml += '<div class="col-md-6">';
                if (stats.gpuUtil) {
                    agentHtml += '<strong>GPU Utilization:</strong><br>';
                    agentHtml += '<div class="progress mt-1" style="height: 25px;">';
                    
                    const gpuUtil = parseFloat(stats.gpuUtil);
                    let progressClass = 'bg-success';
                    if (gpuUtil < 30) progressClass = 'bg-danger';
                    else if (gpuUtil < 70) progressClass = 'bg-warning';
                    
                    agentHtml += '<div class="progress-bar ' + progressClass + '" role="progressbar" style="width: ' + gpuUtil + '%">';
                    agentHtml += gpuUtil.toFixed(1) + '%';
                    agentHtml += '</div>';
                    agentHtml += '</div>';
                } else {
                    agentHtml += '<strong>GPU Utilization:</strong> <span class="text-muted">N/A</span>';
                }
                agentHtml += '</div>';
                agentHtml += '</div>';
                
                if (stats.lastAct) {
                    const lastSeen = VastUtils.timeAgo(stats.lastAct * 1000);
                    agentHtml += '<div class="mt-2"><small class="text-muted"><i class="fas fa-clock"></i> Last seen: ' + lastSeen + '</small></div>';
                }
                
                agentHtml += '</div>';
                
                $('#detail-agent-stats').html(agentHtml).show();
            } else {
                $('#detail-agent-stats').hide();
            }

            $('#detail-ssh-host').text(instance.ssh_host || 'N/A');
            $('#detail-ssh-port').text(instance.ssh_port || 'N/A');

            const sshCommand = 'ssh -p ' + (instance.ssh_port || '22') + ' root@' + (instance.ssh_host || 'N/A');
            $('#detail-ssh-command').text(sshCommand).attr('title', sshCommand);

            $('#detail-ssh-command').css('cursor', 'pointer').off('click').on('click', function () {
                VastUtils.copyToClipboard(sshCommand);
                
                VastNotifications.success(
                    'Copied to Clipboard',
                    'SSH command ready to paste',
                    { duration: 2000 }
                );
                
                $(this).addClass('text-success');
                setTimeout(() => {
                    $(this).removeClass('text-success');
                }, 500);
            });

            $('#detail-price').text('$' + (instance.dph_total || 0).toFixed(3) + ' / hour');

            const location = VastUtils.getCountryName(instance.geolocation);
            const continent = VastUtils.getContinent(instance.geolocation);
            $('#detail-location').html(location + ' <small class="text-muted">(' + continent + ')</small>');

            $('#detail-image').text(VastUtils.truncate(instance.image_uuid || 'N/A', 40))
                .attr('title', instance.image_uuid || 'N/A');

            $('#detail-created').text(
                instance.start_date 
                    ? new Date(instance.start_date * 1000).toLocaleString() 
                    : 'N/A'
            );

            $('#detail-end-date').text(
                instance.end_date && instance.end_date < 1800000000
                    ? new Date(instance.end_date * 1000).toLocaleString()
                    : 'Unlimited'
            );

            $('#detail-json').text(JSON.stringify(instance, null, 2));

            $('#destroyFromDetailsBtn')
                .data('instance-id', instance.id)
                .data('instance-label', instance.label || 'N/A');

            $('#instanceDetailsModal').modal('show');
        },

        init: function () {
            $('#confirmCreateInstance').off('click').on('click', function () {
                const offerId = parseInt($('#modal-offer-id').val());
                const label = $('#modal-label').val().trim();
                const disk = parseFloat($('#modal-disk').val());
                const image = $('#modal-image').val().trim();

                if (!label || label.length < 2) {
                    VastNotifications.warning(
                        'Invalid Label',
                        'Enter at least 2 characters',
                        { duration: 3000 }
                    );
                    $('#modal-label').focus();
                    return;
                }

                if (isNaN(disk) || disk < 5 || disk > 1000) {
                    VastNotifications.warning(
                        'Invalid Disk Size',
                        'Must be between 5-1000 GB',
                        { duration: 3000 }
                    );
                    $('#modal-disk').focus();
                    return;
                }

                $('#createInstanceModal').modal('hide');
                VastAPI.createInstance(offerId, label, disk, image);
            });

            $('#destroyFromDetailsBtn').off('click').on('click', function () {
                const instanceId = $(this).data('instance-id');
                const instanceLabel = $(this).data('instance-label');
                
                const confirmed = confirm(
                    '⚠️ DESTROY INSTANCE ⚠️\n\n' +
                    'Instance #' + instanceId + ' (' + instanceLabel + ')\n\n' +
                    'This will:\n' +
                    '• Immediately terminate the instance\n' +
                    '• Delete all data permanently\n' +
                    '• Stop billing for this instance\n' +
                    '• Remove the associated agent\n\n' +
                    'This action CANNOT be undone!\n\n' +
                    'Are you absolutely sure?'
                );
                
                if (!confirmed) {
                    return;
                }
                
                $('#instanceDetailsModal').modal('hide');
                VastAPI.destroyInstance(instanceId);
            });

            $('#toggleJsonBtn').off('click').on('click', function () {
                $('#detail-json-container').slideToggle(200);
                const icon = $(this).find('i');
                icon.toggleClass('fa-eye fa-eye-slash');
            });

            $('#copyJsonBtn').off('click').on('click', function () {
                const jsonText = $('#detail-json').text();
                VastUtils.copyToClipboard(jsonText);
                
                VastNotifications.success(
                    'Copied to Clipboard',
                    'Instance JSON data copied',
                    { duration: 2000 }
                );
                
                const originalText = $(this).html();
                $(this).html('<i class="fas fa-check"></i> Copied!');
                setTimeout(() => {
                    $(this).html(originalText);
                }, 1500);
            });

            $('#copyInstanceIdBtn').off('click').on('click', function () {
                const instanceId = $('#detail-id').text();
                VastUtils.copyToClipboard(instanceId);
                
                VastNotifications.success(
                    'Copied to Clipboard',
                    `Instance ID: ${instanceId}`,
                    { duration: 2000 }
                );
                
                $(this).find('i').removeClass('fa-copy').addClass('fa-check');
                setTimeout(() => {
                    $(this).find('i').removeClass('fa-check').addClass('fa-copy');
                }, 1000);
            });

            $('#copyInstanceMachineIdBtn').off('click').on('click', function () {
                const machineId = $('#detail-machine-id').text();
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

            $('#modal-label').on('input', function () {
                const label = $(this).val();
                if (label.length < 2) {
                    $(this).addClass('is-invalid').removeClass('is-valid');
                } else {
                    $(this).removeClass('is-invalid').addClass('is-valid');
                }
            });

            $('#modal-disk').on('input', function () {
                const disk = parseFloat($(this).val());
                if (isNaN(disk) || disk < 5 || disk > 1000) {
                    $(this).addClass('is-invalid').removeClass('is-valid');
                } else {
                    $(this).removeClass('is-invalid').addClass('is-valid');
                }
            });
        }
    };

})();