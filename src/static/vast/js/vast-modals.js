// vast-modals.js - Modal management coordinator
(function () {
	'use strict';

	window.VastModals = window.VastModals || {};

	VastModals.updateBulkButtons = function () {
		const selectedOffersCount = VastApp.selectedOffers.length;
		
		if (selectedOffersCount > 0) {
			$('#bulkRentBtn').show();
			$('#selectedOffersCount').text(selectedOffersCount);
			
			const buttonText = selectedOffersCount === 1 
				? 'Rent 1 Offer' 
				: `Rent ${selectedOffersCount} Offers`;
			$('#bulkRentBtn').find('.btn-text').text(buttonText);
		} else {
			$('#bulkRentBtn').hide();
		}

		const selectedInstancesCount = VastApp.selectedInstances.length;
		
		if (selectedInstancesCount > 0) {
			$('#bulkDestroyBtn').show();
			$('#selectedInstancesCount').text(selectedInstancesCount);
			
			const buttonText = selectedInstancesCount === 1 
				? 'Destroy 1 Instance' 
				: `Destroy ${selectedInstancesCount} Instances`;
			$('#bulkDestroyBtn').find('.btn-text').text(buttonText);
		} else {
			$('#bulkDestroyBtn').hide();
		}
	};

	VastModals.clearSelections = function () {
		VastApp.selectedOffers = [];
		$('.offer-checkbox').prop('checked', false);
		$('#selectAllOffers').prop('checked', false);
		
		VastApp.selectedInstances = [];
		$('.instance-checkbox').prop('checked', false);
		$('#selectAllInstances').prop('checked', false);
		
		VastModals.updateBulkButtons();
	};

	VastModals.getSelectionSummary = function () {
		return {
			offers: {
				count: VastApp.selectedOffers.length,
				ids: VastApp.selectedOffers.map(o => o.id),
				totalCost: VastApp.selectedOffers.reduce((sum, o) => sum + (o.dph_total || 0), 0)
			},
			instances: {
				count: VastApp.selectedInstances.length,
				ids: VastApp.selectedInstances
			}
		};
	};

	VastModals.showCreateModal = function(offerId, offerData) {
		if (!VastModals.Instance || !VastModals.Instance.showCreateModal) {
			console.error('Instance modal system not loaded');
			VastNotifications.error(
				'Modal System Error',
				'Instance modal system not available',
				{ duration: 5000 }
			);
			return;
		}
		
		return VastModals.Instance.showCreateModal(offerId, offerData);
	};

	VastModals.showInstanceDetails = function(instance) {
		if (!VastModals.Instance || !VastModals.Instance.showDetails) {
			console.error('Instance modal system not loaded');
			VastNotifications.error(
				'Modal System Error',
				'Instance modal system not available',
				{ duration: 5000 }
			);
			return;
		}
		
		return VastModals.Instance.showDetails(instance);
	};

	VastModals.showOfferDetails = function(offer) {
		if (!VastModals.Offer || !VastModals.Offer.showDetails) {
			console.error('Offer modal system not loaded');
			VastNotifications.error(
				'Modal System Error',
				'Offer modal system not available',
				{ duration: 5000 }
			);
			return;
		}
		
		return VastModals.Offer.showDetails(offer);
	};

	VastModals.showBulkRentModal = function() {
		if (!VastModals.Bulk || !VastModals.Bulk.showRentModal) {
			console.error('Bulk modal system not loaded');
			VastNotifications.error(
				'Modal System Error',
				'Bulk operations system not available',
				{ duration: 5000 }
			);
			return;
		}
		
		return VastModals.Bulk.showRentModal();
	};

	VastModals.handleModalError = function(modalName, error) {
		console.error(`Error in ${modalName} modal:`, error);
		
		VastNotifications.error(
			`Modal Error: ${modalName}`,
			error.message || error.toString(),
			{ duration: 8000 }
		);
	};

	VastModals.checkSystems = function() {
		const systems = {
			Instance: !!(VastModals.Instance && VastModals.Instance.init),
			Offer: !!(VastModals.Offer && VastModals.Offer.init),
			Bulk: !!(VastModals.Bulk && VastModals.Bulk.init)
		};

		const allLoaded = Object.values(systems).every(loaded => loaded);
		
		if (!allLoaded) {
			const missing = Object.keys(systems).filter(key => !systems[key]);
			console.warn('Missing modal systems:', missing);
			
			if (missing.length === Object.keys(systems).length) {
				VastNotifications.error(
					'Modal Systems Missing',
					`No modal systems loaded: ${missing.join(', ')}`,
					{ duration: 8000 }
				);
			}
		}

		return { systems, allLoaded };
	};

	VastModals.init = function () {
		try {
			const status = VastModals.checkSystems();
			
			const subsystems = ['Instance', 'Offer', 'Bulk'];
			const initialized = [];
			const failed = [];
			
			subsystems.forEach(function(name) {
				try {
					if (VastModals[name] && VastModals[name].init) {
						VastModals[name].init();
						initialized.push(name);
					} else {
						console.warn(`${name} system not found or no init method`);
					}
				} catch (error) {
					console.error(`Failed to initialize ${name} system:`, error);
					failed.push(name);
					VastModals.handleModalError(name, error);
				}
			});
			
			if (failed.length === subsystems.length) {
				console.error('All modal systems failed to initialize');
				
				VastNotifications.error(
					'Modal System Critical Error',
					'All modal systems failed to load',
					{ duration: 10000 }
				);
			} else if (failed.length > 0) {
				console.error('Some modal systems failed:', failed);
			}
			
			VastModals.initKeyboardShortcuts();
			
		} catch (error) {
			console.error('Critical modal initialization error:', error);
			VastModals.handleModalError('Coordinator', error);
		}
	};

	VastModals.initKeyboardShortcuts = function() {
		$(document).on('keydown', function(e) {
			if ($(e.target).is('input, textarea, select')) {
				return;
			}
			
			if (e.key === 'Escape') {
				$('.modal').modal('hide');
			}
			
			if ((e.ctrlKey || e.metaKey) && e.key === 'a' && VastApp.currentTab === 'offers') {
				e.preventDefault();
				$('#selectAllOffers').prop('checked', true).trigger('change');
			}
		});
	};

	VastModals.state = {
		currentModal: null,
		modalHistory: []
	};

	$(document).on('show.bs.modal', '.modal', function() {
		const modalId = $(this).attr('id');
		VastModals.state.currentModal = modalId;
		VastModals.state.modalHistory.push({
			id: modalId,
			opened: new Date(),
			action: 'opened'
		});
	});

	$(document).on('hide.bs.modal', '.modal', function() {
		const modalId = $(this).attr('id');
		VastModals.state.modalHistory.push({
			id: modalId,
			closed: new Date(),
			action: 'closed'
		});
		VastModals.state.currentModal = null;
	});

	VastModals.getHistory = function() {
		return VastModals.state.modalHistory;
	};

	VastModals.clearHistory = function() {
		VastModals.state.modalHistory = [];
	};

	$(document).ready(function () {
		setTimeout(function() {
			VastModals.init();
		}, 100);
	});

})();