// vast-modal-bulk.js - Bulk operations
(function () {
    'use strict';

    window.VastModals = window.VastModals || {};

    window.VastModals.Bulk = {

        showRentModal: function () {
            const selectedCount = VastApp.selectedOffers.length;
            
            $('#bulk-rent-count').text(selectedCount);

            const timestamp = Math.floor(Date.now() / 1000);
            $('#bulk-label-prefix').val('agent').removeClass('is-invalid is-valid');
            $('#bulk-disk').val('25').removeClass('is-invalid is-valid');

            let totalHourly = 0;
            
            VastApp.selectedOffers.forEach(function (offer) {
                totalHourly += (offer.dph_total || 0);
            });
            
            const totalDaily = totalHourly * 24;
            const totalMonthly = totalHourly * 24 * 30;
            
            $('#bulk-rent-total-hourly').text(totalHourly.toFixed(3));
            $('#bulk-rent-total-daily').text(totalDaily.toFixed(2));
            $('#bulk-rent-total-monthly').text(totalMonthly.toFixed(2));
            
            let offersList = '<div class="table-responsive">';
            offersList += '<table class="table table-sm table-striped table-hover mb-0" style="font-size: 0.85rem;">';
            offersList += '<thead class="thead-light" style="position: sticky; top: 0; z-index: 1;">';
            offersList += '<tr>';
            offersList += '<th style="width: 40px;">#</th>';
            offersList += '<th>GPU</th>';
            offersList += '<th>Location</th>';
            offersList += '<th class="text-right" style="width: 100px;">Cost/hr</th>';
            offersList += '</tr>';
            offersList += '</thead>';
            offersList += '<tbody>';
            
            VastApp.selectedOffers.forEach(function (offer, index) {
                const hourlyCost = offer.dph_total || 0;
                
                offersList += '<tr>';
                offersList += '<td class="text-muted">' + (index + 1) + '</td>';
                offersList += '<td><strong>' + (offer.num_gpus || 1) + 'x ' + (offer.gpu_name || 'N/A') + '</strong></td>';
                offersList += '<td><small class="text-muted">' + VastUtils.getCountryName(offer.geolocation) + '</small></td>';
                offersList += '<td class="text-right">';
                offersList += '<span class="badge badge-info">$' + hourlyCost.toFixed(3) + '/hr</span>';
                offersList += '</td>';
                offersList += '</tr>';
            });
            
            offersList += '</tbody>';
            offersList += '</table>';
            offersList += '</div>';

            $('#bulk-rent-offers-list').html(offersList);

            $('#bulkRentModal').modal('show');
        },

        executeRent: function(prefix, disk, image) {
            const totalCount = VastApp.selectedOffers.length;
            let successCount = 0;
            let failCount = 0;
            const results = [];
            
            VastNotifications.info(
                `Creating ${totalCount} Instances`,
                'Bulk creation in progress...',
                { sticky: true }
            );
            
            let statusHtml = '<div class="alert alert-info alert-dismissible fade show" role="alert">';
            statusHtml += '<button type="button" class="close" data-dismiss="alert">&times;</button>';
            statusHtml += '<h5 class="mb-2"><i class="fas fa-rocket"></i> Bulk Rent Started</h5>';
            statusHtml += '<div class="mb-2">';
            statusHtml += '  <div class="progress" style="height: 25px;">';
            statusHtml += '    <div id="bulk-progress-bar" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%">0 / ' + totalCount + '</div>';
            statusHtml += '  </div>';
            statusHtml += '</div>';
            statusHtml += '<div id="bulk-status-details" style="max-height: 300px; overflow-y: auto; font-size: 0.9em;">';
            statusHtml += '  <p class="mb-1"><i class="fas fa-info-circle text-info"></i> Creating ' + totalCount + ' instance' + (totalCount > 1 ? 's' : '') + '...</p>';
            statusHtml += '</div>';
            statusHtml += '</div>';
            
            $('#vast-status').html(statusHtml);
            
            function createNext(index) {
                if (index >= totalCount) {
                    if (failCount === 0) {
                        VastNotifications.success(
                            `✅ ${successCount} Instances Created`,
                            'All instances started successfully',
                            {
                                duration: 8000,
                                action: `<button class="vast-toast-action" onclick="$('a[href=\\'#instances\\']').tab('show'); VastAPI.loadInstances();">
                                            <i class="fas fa-eye"></i> View Instances
                                         </button>`
                            }
                        );
                    } else if (successCount === 0) {
                        VastNotifications.error(
                            'Bulk Rent Failed',
                            `All ${failCount} instance${failCount !== 1 ? 's' : ''} failed`,
                            { sticky: true }
                        );
                    } else {
                        VastNotifications.warning(
                            `${successCount} Created, ${failCount} Failed`,
                            'Bulk rent completed with errors',
                            {
                                duration: 8000,
                                action: `<button class="vast-toast-action" onclick="$('a[href=\\'#instances\\']').tab('show'); VastAPI.loadInstances();">
                                            <i class="fas fa-eye"></i> View Instances
                                         </button>`
                            }
                        );
                    }
                    
                    VastModals.Bulk.showRentSummary(successCount, failCount, results, prefix);
                    return;
                }
                
                const offer = VastApp.selectedOffers[index];
                const label = prefix + '-' + (index + 1);
                const progress = Math.round(((index + 1) / totalCount) * 100);
                
                $('#bulk-progress-bar')
                    .css('width', progress + '%')
                    .text((index + 1) + ' / ' + totalCount);
                
                $('#bulk-status-details').append(
                    '<p class="mb-1" id="instance-status-' + index + '">' +
                    '<i class="fas fa-spinner fa-spin text-info"></i> ' +
                    '<strong>' + label + '</strong> (' + (offer.num_gpus || 1) + 'x ' + (offer.gpu_name || 'N/A') + ')...' +
                    '</p>'
                );
                
                const detailsDiv = $('#bulk-status-details');
                detailsDiv.scrollTop(detailsDiv[0].scrollHeight);
                
                $.ajax({
                    url: 'vast.php',
                    method: 'POST',
                    data: {
                        action: 'createInstance',
                        offer_id: offer.id,
                        label: label,
                        disk: disk,
                        image: image
                    },
                    dataType: 'json',
                    success: function (response) {
                        if (response.success) {
                            successCount++;
                            results.push({
                                success: true,
                                label: label,
                                instanceId: response.instance_id,
                                voucher: response.voucher,
                                gpu: (offer.num_gpus || 1) + 'x ' + (offer.gpu_name || 'N/A'),
                                cost: '$' + (offer.dph_total || 0).toFixed(3) + '/hr',
                                location: VastUtils.getCountryName(offer.geolocation)
                            });
                            
                            $('#instance-status-' + index).html(
                                '<i class="fas fa-check-circle text-success"></i> ' +
                                '<strong>' + label + '</strong> → #' + response.instance_id +
                                (response.voucher ? ' <small class="text-muted">[' + response.voucher + ']</small>' : '')
                            );
                        } else {
                            failCount++;
                            const errorMsg = response.error || response.message || 'Unknown error';
                            results.push({
                                success: false,
                                label: label,
                                gpu: (offer.num_gpus || 1) + 'x ' + (offer.gpu_name || 'N/A'),
                                error: errorMsg,
                                location: VastUtils.getCountryName(offer.geolocation)
                            });
                            
                            $('#instance-status-' + index).html(
                                '<i class="fas fa-times-circle text-danger"></i> ' +
                                '<strong>' + label + '</strong> - ' +
                                '<span class="text-danger">' + VastUtils.truncate(errorMsg, 50) + '</span>'
                            );
                        }
                    },
                    error: function (xhr) {
                        failCount++;
                        let errorMsg = 'Request failed';
                        try {
                            const response = JSON.parse(xhr.responseText);
                            errorMsg = response.error || response.message || errorMsg;
                        } catch (e) {
                            errorMsg = xhr.statusText || errorMsg;
                        }
                        
                        results.push({
                            success: false,
                            label: label,
                            gpu: (offer.num_gpus || 1) + 'x ' + (offer.gpu_name || 'N/A'),
                            error: errorMsg,
                            location: VastUtils.getCountryName(offer.geolocation)
                        });
                        
                        $('#instance-status-' + index).html(
                            '<i class="fas fa-times-circle text-danger"></i> ' +
                            '<strong>' + label + '</strong> - ' +
                            '<span class="text-danger">' + VastUtils.truncate(errorMsg, 50) + '</span>'
                        );
                    },
                    complete: function () {
                        setTimeout(function () {
                            createNext(index + 1);
                        }, 500);
                    }
                });
            }
            
            createNext(0);
        },
        
        showRentSummary: function(successCount, failCount, results, prefix) {
            const totalCount = successCount + failCount;
            
            let summaryHtml = '<div class="alert alert-' + (failCount === 0 ? 'success' : 'warning') + ' alert-dismissible fade show" role="alert">';
            summaryHtml += '<button type="button" class="close" data-dismiss="alert">&times;</button>';
            
            if (failCount === 0) {
                summaryHtml += '<h5 class="mb-3"><i class="fas fa-check-circle"></i> 🎉 All ' + successCount + ' Instances Created!</h5>';
            } else if (successCount === 0) {
                summaryHtml += '<h5 class="mb-3"><i class="fas fa-exclamation-triangle"></i> Bulk Rent Failed</h5>';
            } else {
                summaryHtml += '<h5 class="mb-3"><i class="fas fa-exclamation-triangle"></i> ' + successCount + ' Succeeded, ' + failCount + ' Failed</h5>';
            }
            
            summaryHtml += '<div class="row text-center mb-3">';
            summaryHtml += '  <div class="col-4">';
            summaryHtml += '    <h3 class="mb-0 text-success">' + successCount + '</h3>';
            summaryHtml += '    <small class="text-muted">Created</small>';
            summaryHtml += '  </div>';
            summaryHtml += '  <div class="col-4">';
            summaryHtml += '    <h3 class="mb-0 text-danger">' + failCount + '</h3>';
            summaryHtml += '    <small class="text-muted">Failed</small>';
            summaryHtml += '  </div>';
            summaryHtml += '  <div class="col-4">';
            summaryHtml += '    <h3 class="mb-0 text-info">' + totalCount + '</h3>';
            summaryHtml += '    <small class="text-muted">Total</small>';
            summaryHtml += '  </div>';
            summaryHtml += '</div>';
            
            if (successCount > 0) {
                summaryHtml += '<h6 class="text-success mb-2"><i class="fas fa-check-circle"></i> Created Instances</h6>';
                summaryHtml += '<div style="max-height: 200px; overflow-y: auto;">';
                summaryHtml += '<table class="table table-sm table-striped mb-3" style="font-size: 0.85rem;">';
                summaryHtml += '<thead class="thead-light"><tr>';
                summaryHtml += '<th>Label</th><th>ID</th><th>GPU</th><th>Cost</th><th>Voucher</th>';
                summaryHtml += '</tr></thead><tbody>';
                
                results.filter(r => r.success).forEach(function(result) {
                    summaryHtml += '<tr>';
                    summaryHtml += '<td><strong>' + result.label + '</strong></td>';
                    summaryHtml += '<td><span class="badge badge-secondary">#' + result.instanceId + '</span></td>';
                    summaryHtml += '<td><small>' + result.gpu + '</small></td>';
                    summaryHtml += '<td><small>' + result.cost + '</small></td>';
                    summaryHtml += '<td><small><code>' + (result.voucher || 'N/A') + '</code></small></td>';
                    summaryHtml += '</tr>';
                });
                
                summaryHtml += '</tbody></table></div>';
            }
            
            if (failCount > 0) {
                summaryHtml += '<h6 class="text-danger mb-2"><i class="fas fa-times-circle"></i> Failed Instances</h6>';
                summaryHtml += '<div style="max-height: 150px; overflow-y: auto;">';
                summaryHtml += '<table class="table table-sm table-striped mb-3" style="font-size: 0.85rem;">';
                summaryHtml += '<thead class="thead-light"><tr>';
                summaryHtml += '<th>Label</th><th>GPU</th><th>Error</th>';
                summaryHtml += '</tr></thead><tbody>';
                
                results.filter(r => !r.success).forEach(function(result) {
                    summaryHtml += '<tr>';
                    summaryHtml += '<td><strong>' + result.label + '</strong></td>';
                    summaryHtml += '<td><small>' + result.gpu + '</small></td>';
                    summaryHtml += '<td><small class="text-danger">' + VastUtils.truncate(result.error, 40) + '</small></td>';
                    summaryHtml += '</tr>';
                });
                
                summaryHtml += '</tbody></table></div>';
            }
            
            if (successCount > 0) {
                summaryHtml += '<div class="alert alert-light mb-0 py-2">';
                summaryHtml += '<small><strong><i class="fas fa-info-circle text-info"></i> Next:</strong> ';
                summaryHtml += 'Instances starting (1-3 min) → Agents auto-register → Check <strong>Instances</strong> tab</small>';
                summaryHtml += '</div>';
            }
            
            summaryHtml += '</div>';
            
            $('#vast-status').html(summaryHtml);
            
            VastApp.selectedOffers = [];
            $('.offer-checkbox').prop('checked', false);
            $('#selectAllOffers').prop('checked', false);
            VastModals.updateBulkButtons();
            
            if (successCount > 0) {
                setTimeout(function () {
                    $('a[href="#instances"]').tab('show');
                    VastApp.currentTab = 'instances';
                    VastAPI.loadInstances();
                }, 3000);
            }
        },

        executeDestroy: function() {
            const selectedCount = VastApp.selectedInstances.length;
            
            const confirmed = confirm(
                '⚠️ BULK DESTROY WARNING ⚠️\n\n' +
                `You are about to destroy ${selectedCount} instance${selectedCount !== 1 ? 's' : ''}.\n\n` +
                'This will:\n' +
                '• Immediately terminate all selected instances\n' +
                '• Delete all data permanently\n' +
                '• Stop billing for these instances\n\n' +
                'This action CANNOT be undone!\n\n' +
                'Are you absolutely sure?'
            );
            
            if (!confirmed) {
                return;
            }

            let successCount = 0;
            let failCount = 0;

            VastNotifications.info(
                `Destroying ${selectedCount} Instances`,
                'Bulk destruction in progress...',
                { sticky: true }
            );

            function destroyNext(index) {
                if (index >= VastApp.selectedInstances.length) {
                    if (failCount === 0) {
                        VastNotifications.success(
                            `✅ ${successCount} Instances Destroyed`,
                            'All instances terminated',
                            { duration: 6000 }
                        );
                    } else if (successCount === 0) {
                        VastNotifications.error(
                            'Bulk Destroy Failed',
                            `All ${failCount} instance${failCount !== 1 ? 's' : ''} failed`,
                            { sticky: true }
                        );
                    } else {
                        VastNotifications.warning(
                            `${successCount} Destroyed, ${failCount} Failed`,
                            'Bulk destroy completed with errors',
                            { duration: 8000 }
                        );
                    }
                    
                    VastApp.selectedInstances = [];
                    $('#instancesTableBody input[type="checkbox"]').prop('checked', false);
                    $('#selectAllInstances').prop('checked', false);
                    $('#bulkDestroyBtn').hide();
                    $('#selectedInstancesCount').text('0');

                    $('#vast-status').html(
                        '<div class="alert alert-' + (failCount === 0 ? 'success' : 'warning') + ' alert-dismissible fade show">' +
                        '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
                        '<strong><i class="fas fa-' + (failCount === 0 ? 'check-circle' : 'exclamation-triangle') + '"></i> Bulk Destruction Complete:</strong> ' +
                        successCount + ' succeeded, ' + failCount + ' failed.' +
                        '</div>'
                    );
                    
                    VastAPI.loadInstances();
                    VastAPI.loadAccountBalance();
                    return;
                }

                const instanceId = VastApp.selectedInstances[index];

                $.ajax({
                    url: 'vast.php',
                    method: 'POST',
                    data: {
                        action: 'destroyInstance',
                        instance_id: instanceId
                    },
                    dataType: 'json',
                    success: function (response) {
                        if (response.success) {
                            successCount++;
                        } else {
                            failCount++;
                        }
                    },
                    error: function () {
                        failCount++;
                    },
                    complete: function () {
                        const progress = Math.round(((index + 1) / selectedCount) * 100);
                        
                        $('#vast-status').html(
                            '<div class="alert alert-info">' +
                            '<i class="fas fa-spinner fa-spin"></i> Destroying... ' +
                            (index + 1) + ' / ' + selectedCount +
                            '<div class="progress mt-2" style="height: 20px;">' +
                            '<div class="progress-bar progress-bar-striped progress-bar-animated" style="width: ' + progress + '%">' +
                            progress + '%' +
                            '</div>' +
                            '</div>' +
                            '</div>'
                        );
                        
                        setTimeout(function () {
                            destroyNext(index + 1);
                        }, 500);
                    }
                });
            }

            destroyNext(0);
        },

        init: function () {
            $('#bulkRentBtn').off('click').on('click', function () {
                if (VastApp.selectedOffers.length === 0) {
                    VastNotifications.warning(
                        'No Offers Selected',
                        'Select at least one offer',
                        { duration: 3000 }
                    );
                    return;
                }
                VastModals.Bulk.showRentModal();
            });

            $('#confirmBulkRent').off('click').on('click', function () {
                const prefix = $('#bulk-label-prefix').val().trim();
                const disk = parseFloat($('#bulk-disk').val());
                const image = $('#bulk-image').val().trim();

                if (!prefix || prefix.length < 2) {
                    VastNotifications.warning(
                        'Invalid Prefix',
                        'Enter at least 2 characters',
                        { duration: 3000 }
                    );
                    $('#bulk-label-prefix').focus();
                    return;
                }

                if (isNaN(disk) || disk < 5 || disk > 1000) {
                    VastNotifications.warning(
                        'Invalid Disk Size',
                        'Must be between 5-1000 GB',
                        { duration: 3000 }
                    );
                    $('#bulk-disk').focus();
                    return;
                }

                $('#bulkRentModal').modal('hide');
                VastModals.Bulk.executeRent(prefix, disk, image);
            });

            $('#bulkDestroyBtn').off('click').on('click', function () {
                if (VastApp.selectedInstances.length === 0) {
                    VastNotifications.warning(
                        'No Instances Selected',
                        'Select at least one instance',
                        { duration: 3000 }
                    );
                    return;
                }
                VastModals.Bulk.executeDestroy();
            });

            $('#bulk-label-prefix').on('input', function () {
                const prefix = $(this).val();
                if (prefix.length < 2) {
                    $(this).addClass('is-invalid').removeClass('is-valid');
                } else {
                    $(this).removeClass('is-invalid').addClass('is-valid');
                }
            });

            $('#bulk-disk').on('input', function () {
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