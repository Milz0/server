// vast-offers.js - Offer management and display
(function () {
    'use strict';

    function toNumber(v) {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }

    // Vast can return reliability as "reliability" or "reliability2" (0..1)
    function getReliability01(offer) {
        if (!offer) return null;
        let r = toNumber(offer.reliability);
        if (r === null) r = toNumber(offer.reliability2);
        if (r === null) return null;

        // Defensive: if somehow it comes as percent already
        if (r > 1.0) r = r / 100.0;

        // Clamp
        if (r < 0) r = 0;
        if (r > 1) r = 1;

        return r;
    }

    // Unverified handling: accept either verified bool or verification string
    function isVerified(offer) {
        // Some shapes: offer.verified === true/false
        if (typeof offer.verified === 'boolean') return offer.verified;

        // Other shapes: offer.verification = "verified" | "unverified" | etc.
        if (typeof offer.verification === 'string') {
            return offer.verification.toLowerCase() === 'verified';
        }

        // If unknown, treat as unverified (safer)
        return false;
    }

    // Datacenter handling: existing code expects hosting_type === 1
    // Keep compatibility but be defensive about types.
    function isDatacenter(offer) {
        const ht = offer.hosting_type;

        // Vast commonly uses numeric codes
        if (ht === 1 || ht === '1') return true;

        // If it uses string enums (rare), support them too
        if (typeof ht === 'string' && ht.toLowerCase().includes('datacenter')) return true;

        // If it provides a boolean-ish flag
        if (typeof offer.datacenter === 'boolean') return offer.datacenter;

        return false;
    }

    const VastOffers = {

        displayOffers: function (offers) {
            if (!offers || offers.length === 0) {
                $('#offersContainer').html(
                    '<div class="text-center py-5">' +
                    '<i class="fas fa-search fa-3x text-muted mb-3"></i>' +
                    '<p class="text-muted">No offers found matching your criteria.</p>' +
                    '<p class="text-muted"><small>Try adjusting your filters or search parameters.</small></p>' +
                    '</div>'
                );
                $('#offerCount').text('');
                $('#paginationContainer').empty();
                return;
            }

            if (!VastApp.originalOffers) {
                VastApp.originalOffers = offers;
            }

            const includeUnverified = $('#includeUnverified').is(':checked');
            const datacenterOnly = $('#datacenterOnly').is(':checked');

            let filteredOffers = offers.slice();
            const originalCount = filteredOffers.length;

            // Verified filter (client-side)
            if (!includeUnverified) {
                filteredOffers = filteredOffers.filter(function (offer) {
                    return isVerified(offer);
                });
            }

            // Datacenter filter (client-side)
            if (datacenterOnly) {
                filteredOffers = filteredOffers.filter(function (offer) {
                    return isDatacenter(offer);
                });
            }

            // Continent filter (client-side)
            if (VastApp.continentFilter && VastApp.continentFilter !== '') {
                filteredOffers = filteredOffers.filter(function (offer) {
                    const offerContinent = VastUtils.getContinent(offer.geolocation);
                    return offerContinent === VastApp.continentFilter;
                });
            }

            const filteredCount = originalCount - filteredOffers.length;

            if (filteredOffers.length === 0) {
                $('#offersContainer').html(
                    '<div class="text-center py-5">' +
                    '<i class="fas fa-filter fa-3x text-muted mb-3"></i>' +
                    '<p class="text-muted">No offers found matching your filters.</p>' +
                    '<p class="text-muted"><small>' + filteredCount + ' offer' + (filteredCount !== 1 ? 's' : '') + ' filtered out.</small></p>' +
                    '<button class="btn btn-outline-secondary btn-sm mt-2" id="resetFiltersFromEmpty">' +
                    '<i class="fas fa-undo"></i> Reset Filters' +
                    '</button>' +
                    '</div>'
                );

                $('#resetFiltersFromEmpty').click(function () {
                    $('#clearFiltersBtn').click();
                });

                $('#offerCount').text('');
                $('#paginationContainer').empty();
                return;
            }

            const sortBy = $('#sortBy').val();
            filteredOffers = this.sortOffers(filteredOffers, sortBy);

            VastApp.allFilteredOffers = filteredOffers;
            VastApp.currentPage = VastApp.currentPage || 1;
            VastApp.offersPerPage = parseInt($('#offersPerPage').val()) || 50;

            const totalOffers = filteredOffers.length;
            const totalPages = Math.ceil(totalOffers / VastApp.offersPerPage);
            const startIndex = (VastApp.currentPage - 1) * VastApp.offersPerPage;
            const endIndex = Math.min(startIndex + VastApp.offersPerPage, totalOffers);
            const displayOffers = filteredOffers.slice(startIndex, endIndex);

            let countHtml = 'Showing <strong>' + (startIndex + 1) + '-' + endIndex + '</strong> of <strong>' + totalOffers + '</strong> offer' + (totalOffers !== 1 ? 's' : '');
            if (filteredCount > 0) {
                countHtml += ' <small class="text-muted">(' + filteredCount + ' filtered)</small>';
            }
            countHtml += ' <span class="text-muted">• Page ' + VastApp.currentPage + ' of ' + totalPages + '</span>';

            $('#offerCount').html(countHtml);

            let html = '<div class="table-responsive">';
            html += '<table class="table table-striped table-hover table-bordered vast-offers-table">';
            html += '<thead>';
            html += '<tr>';
            html += '<th class="text-center" style="width: 40px;"><input type="checkbox" id="selectAllOffers" title="Select All"></th>';
            html += '<th><i class="fas fa-microchip me-1"></i>GPU</th>';
            html += '<th class="text-center" style="width: 70px;"><i class="fas fa-hashtag me-1"></i>Count</th>';
            html += '<th class="text-center" style="width: 90px;"><i class="fas fa-tachometer-alt me-1"></i>FLOPS/$</th>';
            html += '<th class="text-center" style="width: 100px;"><i class="fas fa-bolt me-1"></i>Total FLOPS</th>';
            html += '<th class="text-center" style="width: 100px;"><i class="fas fa-download me-1"></i>Down</th>';
            html += '<th class="text-center" style="width: 100px;"><i class="fas fa-upload me-1"></i>Up</th>';
            html += '<th class="text-center" style="width: 100px;"><i class="fas fa-dollar-sign me-1"></i>Price</th>';
            html += '<th><i class="fas fa-map-marker-alt me-1"></i>Location</th>';
            html += '<th class="text-center" style="width: 150px;"><i class="fas fa-shield-alt me-1"></i>Status</th>';
            html += '<th class="text-center" style="width: 100px;">Actions</th>';
            html += '</tr>';
            html += '</thead>';
            html += '<tbody>';

            displayOffers.forEach(function (offer) {
                const flopsPerDollar = offer.flops_per_dphtotal ? offer.flops_per_dphtotal.toFixed(1) : 'N/A';
                const totalFlops = offer.total_flops ? offer.total_flops.toFixed(1) : 'N/A';
                const downloadSpeed = offer.inet_down ? offer.inet_down.toFixed(0) : 'N/A';
                const uploadSpeed = offer.inet_up ? offer.inet_up.toFixed(0) : 'N/A';

                let priceClass = 'text-success fw-bold';
                const price = offer.dph_total || 0;

                if (price > 5) {
                    priceClass = 'text-danger fw-bold';
                } else if (price > 2) {
                    priceClass = 'text-warning fw-bold';
                } else if (price > 1) {
                    priceClass = 'text-info fw-bold';
                }

                // Existing badges + add truthful reliability text
                let badges = VastUtils.getOfferBadges(offer);

                html += '<tr class="offer-row" data-offer-id="' + offer.id + '">';
                html += '<td class="text-center align-middle" onclick="event.stopPropagation();"><input type="checkbox" class="offer-checkbox" data-offer-id="' + offer.id + '"></td>';
                html += '<td class="align-middle"><strong>' + (offer.gpu_name || 'N/A') + '</strong></td>';
                html += '<td class="text-center align-middle"><span class="badge bg-secondary">' + (offer.num_gpus || 0) + '</span></td>';
                html += '<td class="text-center align-middle"><span class="text-info">' + flopsPerDollar + '</span></td>';
                html += '<td class="text-center align-middle"><span class="text-primary fw-bold">' + totalFlops + '</span></td>';
                html += '<td class="text-center align-middle">' + downloadSpeed + ' <small class="text-muted">Mbps</small></td>';
                html += '<td class="text-center align-middle">' + uploadSpeed + ' <small class="text-muted">Mbps</small></td>';
                html += '<td class="text-center align-middle"><span class="' + priceClass + '">' + VastUtils.formatCurrency(price, 'USD', 3) + '</span><br><small class="text-muted">/ hour</small></td>';
                html += '<td class="align-middle">';
                html += '<small><i class="fas fa-globe me-1 text-muted"></i>' + VastUtils.getCountryName(offer.geolocation) + '</small><br>';
                html += '<small class="text-muted">' + VastUtils.getContinent(offer.geolocation) + '</small>';
                html += '</td>';
                html += '<td class="text-center align-middle">' + badges + '</td>';
                html += '<td class="text-center align-middle" onclick="event.stopPropagation();">';
                html += '<button class="btn btn-sm btn-success rent-btn" data-offer-id="' + offer.id + '" title="Rent this offer">';
                html += '<i class="fas fa-plus-circle"></i> Rent';
                html += '</button>';
                html += '</td>';
                html += '</tr>';
            });

            html += '</tbody>';
            html += '</table>';
            html += '</div>';

            $('#offersContainer').html(html);

            this.renderPagination(totalPages);

            VastApp.currentOffers = displayOffers;

            this.attachEventHandlers();
        },

        renderPagination: function (totalPages) {
            if (totalPages <= 1) {
                $('#paginationContainer').empty();
                return;
            }

            let html = '<nav aria-label="Offers pagination"><ul class="pagination pagination-sm justify-content-center mb-2">';

            html += '<li class="page-item' + (VastApp.currentPage === 1 ? ' disabled' : '') + '">';
            html += '<a class="page-link" href="#" data-page="' + (VastApp.currentPage - 1) + '">Previous</a>';
            html += '</li>';

            let startPage = Math.max(1, VastApp.currentPage - 3);
            let endPage = Math.min(totalPages, startPage + 6);

            if (endPage - startPage < 6) {
                startPage = Math.max(1, endPage - 6);
            }

            if (startPage > 1) {
                html += '<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>';
                if (startPage > 2) {
                    html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
                }
            }

            for (let i = startPage; i <= endPage; i++) {
                html += '<li class="page-item' + (i === VastApp.currentPage ? ' active' : '') + '">';
                html += '<a class="page-link" href="#" data-page="' + i + '">' + i + '</a>';
                html += '</li>';
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
                }
                html += '<li class="page-item"><a class="page-link" href="#" data-page="' + totalPages + '">' + totalPages + '</a></li>';
            }

            html += '<li class="page-item' + (VastApp.currentPage === totalPages ? ' disabled' : '') + '">';
            html += '<a class="page-link" href="#" data-page="' + (VastApp.currentPage + 1) + '">Next</a>';
            html += '</li>';

            html += '</ul></nav>';

            $('#paginationContainer').html(html);

            $('.page-link').click(function (e) {
                e.preventDefault();
                if ($(this).parent().hasClass('disabled') || $(this).parent().hasClass('active')) {
                    return;
                }
                const page = parseInt($(this).data('page'));
                VastApp.currentPage = page;
                VastOffers.displayOffers(VastApp.originalOffers);

                $('html, body').animate({
                    scrollTop: $('#offersContainer').offset().top - 100
                }, 300);
            });
        },

        attachEventHandlers: function () {
            $('#selectAllOffers').off('change').on('change', function () {
                const isChecked = $(this).is(':checked');
                $('.offer-checkbox').prop('checked', isChecked);
                VastOffers.updateSelectedOffers();
            });

            $('.offer-checkbox').off('change').on('change', function () {
                VastOffers.updateSelectedOffers();
            });

            $('.rent-btn').off('click').on('click', function (e) {
                e.stopPropagation();
                const offerId = parseInt($(this).attr('data-offer-id'));
                const offerData = VastApp.currentOffers.find(o => o.id === offerId);
                VastModals.showCreateModal(offerData.id, offerData);
            });

            $('.offer-row').off('click').on('click', function () {
                const offerId = parseInt($(this).attr('data-offer-id'));
                const offerData = VastApp.currentOffers.find(o => o.id === offerId);
                VastModals.showOfferDetails(offerData);
            });
        },

        updateSelectedOffers: function () {
            VastApp.selectedOffers = [];

            $('.offer-checkbox:checked').each(function () {
                const offerId = parseInt($(this).data('offer-id'));
                const offer = VastApp.currentOffers.find(o => o.id === offerId);
                if (offer) {
                    VastApp.selectedOffers.push(offer);
                }
            });

            VastModals.updateBulkButtons();
        },

        sortOffers: function (offers, sortBy) {
            const lastUnderscore = sortBy.lastIndexOf('_');
            const field = sortBy.substring(0, lastUnderscore);
            const direction = sortBy.substring(lastUnderscore + 1);

            return offers.sort(function (a, b) {
                let valA = 0;
                let valB = 0;

                switch (field) {
                    case 'dph_total':
                        valA = parseFloat(a.dph_total) || 0;
                        valB = parseFloat(b.dph_total) || 0;
                        break;
                    case 'num_gpus':
                        valA = parseInt(a.num_gpus) || 0;
                        valB = parseInt(b.num_gpus) || 0;
                        break;
                    case 'flops_per_dphtotal':
                        valA = parseFloat(a.flops_per_dphtotal) || 0;
                        valB = parseFloat(b.flops_per_dphtotal) || 0;
                        break;
                    case 'inet_down':
                        valA = parseFloat(a.inet_down) || 0;
                        valB = parseFloat(b.inet_down) || 0;
                        break;
                    case 'inet_up':
                        valA = parseFloat(a.inet_up) || 0;
                        valB = parseFloat(b.inet_up) || 0;
                        break;
                    case 'reliability': {
                        const ra = getReliability01(a) || 0;
                        const rb = getReliability01(b) || 0;
                        valA = ra;
                        valB = rb;
                        break;
                    }
                    default:
                        valA = parseFloat(a[field]) || 0;
                        valB = parseFloat(b[field]) || 0;
                        break;
                }

                if (direction === 'asc') {
                    return valA - valB;
                } else {
                    return valB - valA;
                }
            });
        },

        init: function () {
            $('#loadOffersBtn').off('click').on('click', function () {
                const instanceType = $('#instanceType').val();

                // These were missing -> caused "continent is not defined"
                const continent = $('#continentFilter').val();
                const datacenterOnly = $('#datacenterOnly').is(':checked');
                const includeUnverified = $('#includeUnverified').is(':checked');

                const gpuFilter = $('#gpuFilter').val().trim();
                const minGpuCount = parseInt($('#minGpuCount').val()) || 0;
                const maxPrice = parseFloat($('#maxPrice').val()) || 999999;

                // UI uses percent (0-100)
                const minReliabilityPct = parseFloat($('#minReliability').val());
                const minReliability = (Number.isFinite(minReliabilityPct) ? (minReliabilityPct / 100) : 0);

                const loadAll = $('#loadAllOffers').is(':checked');
                const limit = loadAll ? 1000 : (parseInt($('#offerLimit').val()) || 100);

                if (maxPrice < 0.001 && maxPrice !== 999999) {
                    VastNotifications.warning(
                        'Invalid Price',
                        'Maximum price must be at least $0.001/hour',
                        { duration: 4000 }
                    );
                    return;
                }

                if (minReliability < 0 || minReliability > 1) {
                    VastNotifications.warning(
                        'Invalid Reliability',
                        'Reliability must be between 0% and 100%',
                        { duration: 4000 }
                    );
                    return;
                }

                VastApp.currentPage = 1;
                VastApp.originalOffers = null;

                // Client-side filters (ONLY used in displayOffers)
                VastApp.continentFilter = continent;
                VastApp.datacenterOnly = datacenterOnly;
                VastApp.includeUnverified = includeUnverified;

                // API filters (ONLY send valid Vast/back-end keys)
                let filters = {
                    "limit": limit,
                    "type": instanceType
                };

                if (gpuFilter) {
                    filters.gpu_name = { "in": [gpuFilter.toUpperCase()] };
                }
                if (minGpuCount > 0) {
                    filters.gpu_num = minGpuCount; // backend maps to num_gpus gte
                }
                if (maxPrice < 999999) {
                    filters.totalHour = maxPrice; // backend maps to dph_total lte
                }
                if (Number.isFinite(minReliabilityPct) && minReliabilityPct > 0) {
                    // Send percent; backend converts 95->0.95 and 100->0.999
                    filters.reliability = minReliabilityPct;
                }

                // IMPORTANT: do NOT send continent/datacenter/include_unverified to backend
                VastAPI.loadOffers(filters);
            });

            $('#clearFiltersBtn').off('click').on('click', function () {
                $('#instanceType').val('on-demand');
                $('#continentFilter').val('');
                $('#datacenterOnly').prop('checked', false);
                $('#includeUnverified').prop('checked', false);
                $('#loadAllOffers').prop('checked', true);
                $('#gpuFilter').val('');
                $('#minGpuCount').val('');
                $('#maxPrice').val('');
                $('#minReliability').val('');
                $('#sortBy').val('dph_total_asc');
                $('#offerLimit').val('100').prop('disabled', true).css('opacity', '0.5');
                $('#offersPerPage').val('50');
                $('#offersContainer').empty();
                $('#offerCount').text('');
                $('#paginationContainer').empty();
                VastApp.selectedOffers = [];
                VastApp.originalOffers = null;
                VastApp.continentFilter = '';
                VastApp.datacenterOnly = false;
                VastApp.includeUnverified = false;
                VastApp.currentPage = 1;
                VastModals.updateBulkButtons();
            });

            $('#sortBy').off('change').on('change', function () {
                if (VastApp.originalOffers && VastApp.originalOffers.length > 0) {
                    VastOffers.displayOffers(VastApp.originalOffers);
                }
            });

            $('#offersPerPage').off('change').on('change', function () {
                if (VastApp.originalOffers && VastApp.originalOffers.length > 0) {
                    VastApp.currentPage = 1;
                    VastOffers.displayOffers(VastApp.originalOffers);
                }
            });

            $('#includeUnverified, #datacenterOnly, #continentFilter').off('change').on('change', function () {
                if (VastApp.originalOffers && VastApp.originalOffers.length > 0) {
                    VastApp.continentFilter = $('#continentFilter').val();
                    VastApp.datacenterOnly = $('#datacenterOnly').is(':checked');
                    VastApp.includeUnverified = $('#includeUnverified').is(':checked');

                    VastApp.currentPage = 1;
                    VastOffers.displayOffers(VastApp.originalOffers);
                }
            });

            $('#loadAllOffers').off('change').on('change', function () {
                const isChecked = $(this).is(':checked');
                $('#offerLimit').prop('disabled', isChecked);

                if (isChecked) {
                    $('#offerLimit').css('opacity', '0.5');
                } else {
                    $('#offerLimit').css('opacity', '1');
                }
            });

            if ($('#loadAllOffers').is(':checked')) {
                $('#offerLimit').prop('disabled', true).css('opacity', '0.5');
            }
        }

    };

    $(document).ready(function () {
        VastOffers.init();
    });

    window.VastOffers = VastOffers;
})();
