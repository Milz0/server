// vast-api.js - All AJAX communication with backend
(function () {
    'use strict';

    const VastAPI = {
        _lastAutoDestroyNotification: null,
        _lastAutoDestroyCheck: null,
        _lastIdleInstances: null,

        loadOffers: function (filters) {
            $('#offersLoading').show();
            $('#offersError').hide();
            $('#offersContainer').empty();
            $('#offerCount').text('');
            VastApp.selectedOffers = [];
            VastModals.updateBulkButtons();

            $.ajax({
                url: 'vast.php',
                type: 'POST',
                data: {
                    action: 'listOffers',
                    filters: filters
                },
                dataType: 'json',
                success: function (response) {
                    $('#offersLoading').hide();
                    if (response.success) {
                        VastOffers.displayOffers(response.offers);
                    } else {
                        $('#offersError').text(response.error || 'Unknown error').show();
                        VastNotifications.error(
                            'Failed to Load Offers',
                            response.error || 'Unknown error',
                            { duration: 5000 }
                        );
                    }
                },
                error: function (xhr, status, error) {
                    $('#offersLoading').hide();
                    $('#offersError').text('Request failed: ' + error).show();
                    VastNotifications.error(
                        'Network Error',
                        'Failed to communicate with server',
                        { duration: 5000 }
                    );
                }
            });
        },

        createInstance: function (offerId, label, disk) {
            $.ajax({
                url: 'vast.php',
                method: 'POST',
                data: {
                    action: 'createInstance',
                    offer_id: offerId,
                    label: label,
                    disk: disk
                },
                dataType: 'json',
                success: function (response) {
                    if (response.success) {
                        VastNotifications.success(
                            'Instance Created',
                            `#${response.instance_id} "${label}" is starting`,
                            { duration: 5000 }
                        );

                        setTimeout(function () {
                            $('button[data-bs-target="#instances"], a[href="#instances"]').trigger('click');
                            VastAPI.loadInstances(true);
                        }, 2000);

                    } else {
                        VastNotifications.error(
                            'Creation Failed',
                            response.message || response.error || 'Unknown error',
                            { duration: 8000 }
                        );
                    }
                },
                error: function (xhr, status, error) {
                    let errorMsg = 'Failed to create instance';

                    try {
                        const response = JSON.parse(xhr.responseText);
                        errorMsg = response.message || response.msg || response.error || errorMsg;
                    } catch (e) {
                        errorMsg = xhr.statusText || errorMsg;
                    }

                    VastNotifications.error(
                        'Network Error',
                        errorMsg,
                        { duration: 8000 }
                    );
                }
            });
        },

        bulkCreateInstances: function (offers, labelPrefix, disk) {
            let successCount = 0;
            let failCount = 0;
            let index = 0;

            function processNext() {
                if (index >= offers.length) {
                    if (successCount > 0) {
                        VastNotifications.success(
                            `Created ${successCount} Instance${successCount !== 1 ? 's' : ''}`,
                            failCount > 0 ? `${failCount} failed` : 'All successful',
                            {
                                duration: 5000,
                            }
                        );

                        setTimeout(function () {
                            $('a[href="#instances"]').tab('show');
                            VastApp.currentTab = 'instances';
                            VastAPI.loadInstances(true);
                            VastApp.startAutoRefresh();
                        }, 2000);
                    } else {
                        VastNotifications.error(
                            'Bulk Creation Failed',
                            'All instances failed to create',
                            { duration: 8000 }
                        );
                    }

                    return;
                }

                const offer = offers[index];
                const label = labelPrefix + '-' + (index + 1);

                $.ajax({
                    url: 'vast.php',
                    method: 'POST',
                    data: {
                        action: 'createInstance',
                        offer_id: offer.id,
                        label: label,
                        disk: disk
                    },
                    dataType: 'json',
                    success: function (response) {
                        if (response.success) {
                            successCount++;
                        } else {
                            failCount++;
                        }

                        index++;
                        setTimeout(processNext, 500);
                    },
                    error: function (xhr, status, error) {
                        failCount++;
                        index++;
                        setTimeout(processNext, 500);
                    }
                });
            }

            processNext();
        },

        fetchAgentStats: function (instances) {
            return $.ajax({
                url: 'vastAPI.php',
                method: 'POST',
                data: {
                    action: 'getInstanceAgentStats',
                    instances: JSON.stringify(instances)
                },
                dataType: 'json',
                timeout: 5000
            });
        },

        loadInstances: function (silent) {
            silent = silent !== false;

            if (!silent) {
                $('#instancesLoading').show();
                $('#instancesError').hide();
                $('#instancesContainer').empty();
            }

            VastAPI.loadAccountBalance();

            $.ajax({
                url: 'vast.php',
                method: 'POST',
                data: {
                    action: 'listInstances'
                },
                dataType: 'json',
                success: function (response) {
                    if (!silent) {
                        $('#instancesLoading').hide();
                    }

                    if (response.success) {
                        const instances = response.instances || [];

                        if (instances.length > 0) {
                            VastAPI.fetchAgentStats(instances)
                                .done(function (statsResponse) {
                                    if (statsResponse.success && statsResponse.data) {
                                        statsResponse.data.forEach(function (stat) {
                                            const instance = instances.find(function (i) {
                                                return i.id === stat.instanceId;
                                            });

                                            if (instance) {
                                                instance.agentStats = stat;
                                            }
                                        });
                                    }

                                    VastInstances.displayInstances(instances);

                                    // Show success notification on refresh (non-silent)
                                    if (!silent) {
                                        VastNotifications.success(
                                            'Instances Refreshed',
                                            `${instances.length} instance${instances.length !== 1 ? 's' : ''} loaded`,
                                            { duration: 3000 }
                                        );
                                    }
                                })
                                .fail(function (xhr, status, error) {
                                    VastInstances.displayInstances(instances);

                                    // Show success notification even if agent stats fail
                                    if (!silent) {
                                        VastNotifications.success(
                                            'Instances Refreshed',
                                            `${instances.length} instance${instances.length !== 1 ? 's' : ''} loaded`,
                                            { duration: 3000 }
                                        );
                                    }
                                });
                        } else {
                            VastInstances.displayInstances(instances);

                            // Show notification for no instances
                            if (!silent) {
                                VastNotifications.info(
                                    'Instances Refreshed',
                                    'No active instances',
                                    { duration: 2000 }
                                );
                            }
                        }
                    } else {
                        if (!silent) {
                            $('#instancesError').text(response.error || 'Unknown error').show();

                            VastNotifications.error(
                                'Failed to Load Instances',
                                response.error || 'Unknown error',
                                { duration: 5000 }
                            );
                        }
                    }
                },
                error: function (xhr, status, error) {
                    if (!silent) {
                        $('#instancesLoading').hide();
                        $('#instancesError').text('Request failed: ' + xhr.statusText).show();

                        VastNotifications.error(
                            'Network Error',
                            'Failed to load instances',
                            { duration: 5000 }
                        );
                    }
                }
            });
        },

        destroyInstance: function (instanceId) {
            if (!confirm('Destroy this instance? This cannot be undone and you will lose all data.')) {
                return;
            }

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
                        VastNotifications.success(
                            'Instance Destroyed',
                            `#${instanceId} terminated`,
                            { duration: 3000 }
                        );

                        VastAPI.loadInstances(true);
                        VastAPI.loadAccountBalance();

                    } else {
                        VastNotifications.error(
                            'Destruction Failed',
                            response.error || 'Unknown error',
                            { duration: 5000 }
                        );
                    }
                },
                error: function (xhr, status, error) {
                    VastNotifications.error(
                        'Network Error',
                        'Failed to destroy instance',
                        { duration: 5000 }
                    );
                }
            });
        },

        loadAccountBalance: function () {
            $.ajax({
                url: 'vast.php',
                method: 'POST',
                data: {
                    action: 'getUserInfo'
                },
                dataType: 'json',
                success: function (response) {
                    if (response.success && response.user) {
                        VastApp.accountBalance = parseFloat(response.user.credit) || 0;
                        VastInstances.updateBalanceDisplay();
                    }
                },
                error: function (xhr, status, error) {
                }
            });
        },

        checkAutoDestroy: function () {
            const self = this;

            $.ajax({
                url: 'vast.php',
                method: 'POST',
                data: {
                    action: 'autoDestroyCheck'
                },
                dataType: 'json',
                success: function (response) {
                    if (response.success) {
                        const checked = response.checked || 0;
                        const destroyed = response.destroyed || [];
                        const config = response.config || {};

                        if (destroyed.length > 0) {
                            let instanceList = destroyed.map(inst => `#${inst.id}`).join(', ');

                            VastNotifications.warning(
                                `Auto-Destroyed ${destroyed.length} Instance${destroyed.length !== 1 ? 's' : ''}`,
                                instanceList,
                                {
                                    duration: 10000,
                                }
                            );

                            VastAPI.loadInstances(true);
                            VastAPI.loadAccountBalance();
                        }

                        self._lastAutoDestroyCheck = Date.now();
                    }
                },
                error: function (xhr, status, error) {
                }
            });
        }
    };

    window.VastAPI = VastAPI;

})();