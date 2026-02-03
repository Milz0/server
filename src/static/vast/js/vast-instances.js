// vast-instances.js - Instance management and display
(function () {
    'use strict';

    const VastInstances = {
        currentInstances: [],
        lastInstanceCount: 0,

        getStatusBadge: function(status, instance) {
            const statusMap = {
                'running': {
                    class: 'success',
                    icon: 'fa-play-circle',
                    text: 'Running'
                },
                'loading': {
                    class: 'info',
                    icon: 'fa-spinner fa-spin',
                    text: 'Loading'
                },
                'created': {
                    class: 'info',
                    icon: 'fa-hourglass-start',
                    text: 'Starting'
                },
                'starting': {
                    class: 'info',
                    icon: 'fa-hourglass-start',
                    text: 'Starting'
                },
                'exited': {
                    class: 'secondary',
                    icon: 'fa-stop-circle',
                    text: 'Stopped'
                },
                'offline': {
                    class: 'warning',
                    icon: 'fa-exclamation-triangle',
                    text: 'Offline'
                },
                'error': {
                    class: 'danger',
                    icon: 'fa-times-circle',
                    text: 'Error'
                }
            };
            
            const statusInfo = statusMap[status] || {
                class: 'secondary',
                icon: 'fa-question-circle',
                text: status || 'Unknown'
            };
            
            return {
                html: '<i class="fas ' + statusInfo.icon + '"></i> ' + statusInfo.text.toUpperCase(),
                class: statusInfo.class
            };
        },

        getCostDisplay: function(instance) {
            if (!instance.dph_total) {
                return {
                    hourly: VastUtils.formatCurrency(0, 'USD', 3),
                    soFar: null,
                    daily: null,
                    priceClass: 'text-muted'
                };
            }
            
            const hourlyRate = parseFloat(instance.dph_total);
            
            let priceClass = 'text-success';
            if (hourlyRate > 2) {
                priceClass = 'text-danger';
            } else if (hourlyRate > 0.5) {
                priceClass = 'text-warning';
            }
            
            if (instance.actual_status === 'running' && instance.start_date && instance.start_date > 0) {
                const uptimeSeconds = Math.floor(Date.now() / 1000 - instance.start_date);
                const uptimeHours = uptimeSeconds / 3600;
                
                const currentCost = hourlyRate * uptimeHours;
                const dailyCost = hourlyRate * 24;
                
                return {
                    hourly: VastUtils.formatCurrency(hourlyRate, 'USD', 3),
                    soFar: VastUtils.formatCurrency(currentCost, 'USD', 4),
                    daily: VastUtils.formatCurrency(dailyCost, 'USD', 2),
                    priceClass: priceClass
                };
            }
            
            return {
                hourly: VastUtils.formatCurrency(hourlyRate, 'USD', 3),
                soFar: null,
                daily: null,
                priceClass: priceClass
            };
        },

        getGpuUtilDisplay: function(instance) {
            if (instance.agentStats && instance.agentStats.gpuUtil) {
                const stats = instance.agentStats;
                const avgUtil = parseFloat(stats.gpuUtil.replace('%', ''));
                
                let icon = '📊';
                let colorClass = '';
                
                if (avgUtil >= 80) {
                    icon = '🟢';
                    colorClass = 'text-success font-weight-bold';
                } else if (avgUtil >= 50) {
                    icon = '🟡';
                    colorClass = 'text-warning';
                } else if (avgUtil >= 5) {
                    icon = '🟠';
                    colorClass = 'text-warning';
                } else {
                    icon = '🔴';
                    colorClass = 'text-danger';
                }
                
                const age = stats.lastUpdate ? Math.floor(Date.now() / 1000 - stats.lastUpdate) : 0;
                let ageText = age + 's';
                if (age >= 60) {
                    ageText = Math.floor(age / 60) + 'm';
                }
                
                return '<small class="' + colorClass + '" title="Average GPU Utilization (updated ' + ageText + ' ago)">' + 
                       icon + ' ' + stats.gpuUtil + ' (' + ageText + ')</small>';
            }
            
            if (instance.actual_status === 'running') {
                return '<small class="text-muted" title="Waiting for Hashtopolis agent to connect">' +
                       '<i class="fas fa-hourglass-half"></i> Waiting for agent...</small>';
            }
            
            return '';
        },

        displayInstances: function (instances) {
            VastApp.currentInstances = instances || [];
            this.currentInstances = instances || [];

            const instanceCount = instances ? instances.length : 0;
            
            this.lastInstanceCount = instanceCount;

            this.updateInstanceCountBadge(instanceCount);

            let totalHourlyCost = 0;
            let runningCount = 0;
            
            if (instances && instances.length > 0) {
                instances.forEach(function (inst) {
                    totalHourlyCost += parseFloat(inst.dph_total) || 0;
                    if (inst.actual_status === 'running') {
                        runningCount++;
                    }
                });
            }

            VastApp.currentHourlyCost = totalHourlyCost;
            this.updateBalanceDisplay();

            if (!instances || instances.length === 0) {
                $('#instancesContainer').html(
                    '<div class="text-center py-5">' +
                    '<i class="fas fa-server fa-3x text-muted mb-3"></i>' +
                    '<p class="text-muted">No active instances</p>' +
                    '<p class="text-muted"><small>Create instances from the <strong>Search Offers</strong> tab</small></p>' +
                    '</div>'
                );
                return;
            }

            let html = '<div class="table-responsive">';
            html += '<table class="table table-striped table-hover table-bordered vast-instances-table">';
            html += '<thead class="thead-light">';
            html += '<tr>';
            html += '<th class="text-center" style="width: 40px;"><input type="checkbox" id="selectAllInstances" title="Select All"></th>';
            html += '<th style="width: 60px;"><i class="fas fa-hashtag mr-1"></i>ID</th>';
            html += '<th><i class="fas fa-info-circle mr-1"></i>Status Message</th>';
            html += '<th><i class="fas fa-microchip mr-1"></i>GPU</th>';
            html += '<th class="text-center" style="width: 120px;"><i class="fas fa-heartbeat mr-1"></i>Status</th>';
            html += '<th class="text-center" style="width: 140px;"><i class="fas fa-dollar-sign mr-1"></i>Cost</th>';
            html += '<th><i class="fas fa-map-marker-alt mr-1"></i>Location</th>';
            html += '<th class="text-center" style="width: 100px;"><i class="fas fa-clock mr-1"></i>Uptime</th>';
            html += '<th class="text-center" style="width: 180px;">Actions</th>';
            html += '</tr>';
            html += '</thead>';
            html += '<tbody>';

            const self = this;
            instances.forEach(function (instance) {
                const actualStatus = instance.actual_status || 'starting';
                
                const statusBadge = self.getStatusBadge(actualStatus, instance);
                
                const uptime = instance.start_date && instance.start_date > 0
                    ? VastUtils.formatUptime(Math.floor(Date.now() / 1000 - instance.start_date))
                    : (instance.actual_status === 'running' ? 'Running' : 'Starting...');
                
                const statusMessage = instance.status_msg || 
                    '<em class="text-muted"><i class="fas fa-spinner fa-pulse"></i> Initializing...</em>';

                const costInfo = self.getCostDisplay(instance);
                let costHtml = '<span class="font-weight-bold">' + costInfo.hourly + '</span>';
                costHtml += '<br><small class="text-muted">/ hour</small>';
                
                if (costInfo.soFar) {
                    costHtml += '<br><small class="text-info"><strong>' + costInfo.soFar + '</strong> so far</small>';
                    costHtml += '<br><small class="text-muted">(' + costInfo.daily + '/day)</small>';
                }

                let gpuDisplay = (instance.num_gpus || 0) + 'x ' + (instance.gpu_name || 'N/A');
                const gpuUtilDisplay = self.getGpuUtilDisplay(instance);
                
                if (gpuUtilDisplay) {
                    gpuDisplay += '<br>' + gpuUtilDisplay;
                }

                html += '<tr class="instance-row" data-instance-id="' + instance.id + '" data-instance=\'' + JSON.stringify(instance) + '\'>';
                html += '<td class="text-center align-middle" onclick="event.stopPropagation();"><input type="checkbox" class="instance-checkbox" data-instance-id="' + instance.id + '"></td>';
                html += '<td class="align-middle"><strong>' + instance.id + '</strong></td>';
                html += '<td class="align-middle"><small>' + statusMessage + '</small></td>';
                html += '<td class="align-middle">' + gpuDisplay + '</td>';
                
                html += '<td class="text-center align-middle">';
                html += '<span class="badge badge-' + statusBadge.class + '">';
                html += statusBadge.html;
                html += '</span>';
                html += '</td>';
                
                html += '<td class="text-center align-middle ' + costInfo.priceClass + '">' + costHtml + '</td>';
                
                html += '<td class="align-middle">';
                html += '<small><i class="fas fa-globe mr-1 text-muted"></i>' + VastUtils.getCountryName(instance.geolocation) + '</small>';
                html += '</td>';
                html += '<td class="text-center align-middle"><small>' + uptime + '</small></td>';
                html += '<td class="text-center align-middle" onclick="event.stopPropagation();">';

                html += '<button class="btn btn-sm btn-danger destroy-btn" data-instance-id="' + instance.id + '" title="Destroy Instance #' + instance.id + '">';
                html += '<i class="fas fa-trash-alt"></i>';
                html += '</button>';
                html += '</td>';
                html += '</tr>';
            });

            html += '</tbody>';
            html += '</table>';
            html += '</div>';

            $('#instancesContainer').html(html);

            this.attachEventHandlers();
        },

        updateInstanceCountBadge: function (count) {
            const badge = $('#instanceCountBadge');

            badge.text(count);

            badge.removeClass('badge-secondary badge-success badge-primary badge-warning badge-danger');

            if (count === 0) {
                badge.addClass('badge-secondary');
            } else if (count <= 2) {
                badge.addClass('badge-success');
            } else if (count <= 5) {
                badge.addClass('badge-primary');
            } else if (count <= 10) {
                badge.addClass('badge-warning');
            } else {
                badge.addClass('badge-danger');
            }
        },

        updateBalanceDisplay: function () {
            if (VastApp.accountBalance === null) {
                $('#accountBalanceSection').hide();
                return;
            }

            $('#accountBalanceSection').show();
            
            const balance = VastApp.accountBalance;
            const hourlyCost = VastApp.currentHourlyCost || 0;
            
            $('#accountBalance').text(VastUtils.formatCurrency(balance, 'USD', 2));
            $('#currentHourlyCost').text(VastUtils.formatCurrency(hourlyCost, 'USD', 3) + '/hr');

            if (hourlyCost > 0 && balance > 0) {
                const hoursRemaining = balance / hourlyCost;
                let runtimeText = '';
                let runtimeClass = '';

                if (hoursRemaining < 1) {
                    const minutes = Math.floor(hoursRemaining * 60);
                    runtimeText = '<span class="text-danger font-weight-bold">' + minutes + ' minutes</span>';
                    runtimeClass = 'text-danger';
                    
                    if (!this._warnedAboutLowBalance && minutes < 30) {
                        this._warnedAboutLowBalance = true;
                        VastNotifications.error(
                            'Critical: Low Balance',
                            `Only ${minutes} minutes of runtime remaining!`,
                            {
                                duration: 15000,
                                action: '<button class="vast-toast-action" onclick="window.open(\'https://cloud.vast.ai\', \'_blank\');">' +
                                       '<i class="fas fa-plus-circle"></i> Add Funds' +
                                       '</button>'
                            }
                        );
                    }
                } else if (hoursRemaining < 24) {
                    runtimeText = '<span class="text-warning font-weight-bold">' + hoursRemaining.toFixed(1) + ' hours</span>';
                    runtimeClass = 'text-warning';
                    
                    if (!this._warnedAboutLowBalance && hoursRemaining < 6) {
                        this._warnedAboutLowBalance = true;
                        VastNotifications.warning(
                            'Low Balance',
                            `Only ${hoursRemaining.toFixed(1)} hours remaining`,
                            {
                                duration: 8000,
                                action: '<button class="vast-toast-action" onclick="window.open(\'https://cloud.vast.ai\', \'_blank\');">' +
                                       '<i class="fas fa-plus-circle"></i> Add Funds' +
                                       '</button>'
                            }
                        );
                    }
                } else {
                    const days = Math.floor(hoursRemaining / 24);
                    const hours = Math.floor(hoursRemaining % 24);
                    runtimeText = '<span class="text-success font-weight-bold">' + days + 'd ' + hours + 'h</span>';
                    runtimeClass = 'text-success';
                    
                    this._warnedAboutLowBalance = false;
                }

                $('#runtimeEstimate').html(runtimeText);
                $('#runtimeEstimate').removeClass('text-success text-warning text-danger text-muted').addClass(runtimeClass);
            } else if (hourlyCost === 0) {
                $('#runtimeEstimate').html('<span class="text-muted">No active instances</span>');
                $('#runtimeEstimate').removeClass('text-success text-warning text-danger').addClass('text-muted');
            } else {
                $('#runtimeEstimate').html('<span class="text-danger font-weight-bold">Insufficient funds</span>');
                $('#runtimeEstimate').removeClass('text-success text-warning text-muted').addClass('text-danger');
            }
        },

        attachEventHandlers: function () {
            $('#selectAllInstances').off('change').on('change', function () {
                const isChecked = $(this).is(':checked');
                $('.instance-checkbox').prop('checked', isChecked);
                VastInstances.updateSelectedInstances();
            });

            $('.instance-checkbox').off('change').on('change', function () {
                VastInstances.updateSelectedInstances();
            });

            $('.destroy-btn').off('click').on('click', function (e) {
                e.stopPropagation();
                const instanceId = parseInt($(this).data('instance-id'));
                
                const instance = VastInstances.currentInstances.find(i => i.id === instanceId);
                
                let confirmMsg = `Destroy instance #${instanceId}?`;
                if (instance) {
                    const gpu = (instance.num_gpus || 0) + 'x ' + (instance.gpu_name || 'GPU');
                    const cost = instance.dph_total ? VastUtils.formatCurrency(instance.dph_total, 'USD', 3) + '/hr' : '';
                    confirmMsg = `Destroy instance #${instanceId}?\n\n${gpu}\n${cost}\n\nThis action cannot be undone!`;
                }
                
                if (confirm(confirmMsg)) {
                    VastAPI.destroyInstance(instanceId);
                }
            });

            $('.instance-row').off('click').on('click', function () {
                const instanceData = JSON.parse($(this).attr('data-instance'));
                VastModals.showInstanceDetails(instanceData);
            });
        },

        updateSelectedInstances: function () {
            const previousCount = VastApp.selectedInstances.length;
            VastApp.selectedInstances = [];
            
            $('.instance-checkbox:checked').each(function () {
                const instanceId = parseInt($(this).data('instance-id'));
                VastApp.selectedInstances.push(instanceId);
            });
            
            VastModals.updateBulkButtons();
        },

        getSummary: function() {
            const total = this.currentInstances.length;
            const running = this.currentInstances.filter(i => i.actual_status === 'running').length;
            const starting = this.currentInstances.filter(i => ['starting', 'created', 'loading'].includes(i.actual_status)).length;
            const offline = this.currentInstances.filter(i => ['offline', 'error', 'exited'].includes(i.actual_status)).length;
            
            return {
                total,
                running,
                starting,
                offline,
                hourlyCost: VastApp.currentHourlyCost || 0
            };
        },

        init: function () {
            $('#loadInstancesBtn').off('click').on('click', function () {
                VastAPI.loadInstances();
            });
        }
    };

    $(document).ready(function () {
        VastInstances.init();
    });

    window.VastInstances = VastInstances;
})();