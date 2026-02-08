// vast-main.js - Main application logic
(function () {
	'use strict';

	window.VastApp = {
		currentTab: 'instances',
		currentInstances: [],
		selectedInstances: [],
		selectedOffers: [],
		accountBalance: null,
		currentHourlyCost: 0,
		
		autoRefreshEnabled: false,
		autoRefreshInterval: null,
		refreshInProgress: false,
		lastRefreshTime: null,
		
		isInitialized: false,
		initStartTime: null,
		
		init: function () {
			this.initStartTime = Date.now();
			
			this.setupEventListeners();
			
			const activeTab = $('.nav-link.active').attr('href');
			if (activeTab) {
				this.currentTab = activeTab.replace('#', '');
			}
			
			this.loadInitialData();
		},
		
		loadInitialData: function() {
			const self = this;
			const promises = [];
			
			promises.push(VastAPI.loadInstances());
			promises.push(VastAPI.loadAccountBalance());
			
			$.when.apply($, promises).always(function() {
				VastAPI.checkAutoDestroy();
				
				if (self.currentTab === 'instances') {
					self.startAutoRefresh();
				}
				
				self.isInitialized = true;
			}).fail(function(error) {
				if (window.VastNotifications) {
					VastNotifications.error(
						'Initialization Failed',
						'Check your API key in Settings',
						{ duration: 8000 }
					);
				}
			});
		},

		setupEventListeners: function () {
			const self = this;
			
			$('a[data-bs-toggle="tab"]').on('shown.bs.tab', function (e) {
				const targetTab = $(e.target).attr('href').replace('#', '');
				self.handleTabChange(targetTab);
			});
			
			$('#autoRefreshToggle').off('change').on('change', function () {
				const isEnabled = $(this).is(':checked');
				
				if (isEnabled) {
					self.startAutoRefresh();
				} else {
					self.stopAutoRefresh();
				}
			});
			
			document.addEventListener('visibilitychange', function() {
				if (!document.hidden && self.currentTab === 'instances' && self.autoRefreshEnabled) {
					VastAPI.loadInstances(true);
				}
			});
			
			window.addEventListener('beforeunload', function(e) {
				const runningCount = self.currentInstances.filter(i => 
					i.actual_status === 'running'
				).length;
				
				if (runningCount > 0) {
					const message = `You have ${runningCount} running instance${runningCount !== 1 ? 's' : ''}. They will continue to run and accrue costs.`;
					e.preventDefault();
					e.returnValue = message;
					return message;
				}
			});
			
			$(document).on('keydown', function(e) {
				if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
					e.preventDefault();
					self.forceRefresh();
					return false;
				}
				
				if ((e.ctrlKey || e.metaKey) && e.key === '1') {
					e.preventDefault();
					$('a[href="#instances"]').tab('show');
				}
				
				if ((e.ctrlKey || e.metaKey) && e.key === '2') {
					e.preventDefault();
					$('a[href="#offers"]').tab('show');
				}
			});
		},
		
		handleTabChange: function(tabName) {
			const previousTab = this.currentTab;
			this.currentTab = tabName;
			
			if (tabName === 'instances') {
				VastAPI.loadInstances();
				
				if (!this.autoRefreshEnabled) {
					this.startAutoRefresh();
				}
			}
		},

		startAutoRefresh: function () {
			if (this.autoRefreshInterval) {
				clearInterval(this.autoRefreshInterval);
				this.autoRefreshInterval = null;
			}

			this.autoRefreshEnabled = true;
			$('#autoRefreshToggle').prop('checked', true);
			
			const self = this;
			
			this.autoRefreshInterval = setInterval(function () {
				if (self.currentTab === 'instances' && 
					!document.hidden && 
					!self.refreshInProgress) {
					
					self.refreshInProgress = true;
					self.lastRefreshTime = Date.now();
					
					$.when(
						VastAPI.loadInstances(true),
						VastAPI.checkAutoDestroy()
					).always(function() {
						self.refreshInProgress = false;
					});
				}
			}, 30000);
		},

		stopAutoRefresh: function () {
			if (this.autoRefreshInterval) {
				clearInterval(this.autoRefreshInterval);
				this.autoRefreshInterval = null;
			}
			
			this.autoRefreshEnabled = false;
			$('#autoRefreshToggle').prop('checked', false);
		},
		
		forceRefresh: function() {
			if (this.refreshInProgress) {
				if (window.VastNotifications) {
					VastNotifications.warning(
						'Refresh In Progress',
						'Please wait...',
						{ duration: 2000 }
					);
				}
				return;
			}
			
			if (this.currentTab === 'instances') {
				this.refreshInProgress = true;
				this.lastRefreshTime = Date.now();
				
				const self = this;
				$.when(
					VastAPI.loadInstances(false),
					VastAPI.checkAutoDestroy(),
					VastAPI.loadAccountBalance()
				).always(function() {
					self.refreshInProgress = false;
				});
			} else if (this.currentTab === 'offers') {
				if (window.VastNotifications) {
					VastNotifications.info(
						'Search Offers',
						'Click "Load Offers" to search',
						{ duration: 2000 }
					);
				}
			}
		},
		
		getStatus: function() {
			return {
				initialized: this.isInitialized,
				currentTab: this.currentTab,
				autoRefresh: {
					enabled: this.autoRefreshEnabled,
					inProgress: this.refreshInProgress,
					lastRefresh: this.lastRefreshTime ? new Date(this.lastRefreshTime).toISOString() : null,
					lastRefreshAgo: this.lastRefreshTime ? VastUtils.timeAgo(this.lastRefreshTime) : 'never'
				},
				instances: {
					total: this.currentInstances.length,
					selected: this.selectedInstances.length,
					running: this.currentInstances.filter(i => i.actual_status === 'running').length
				},
				offers: {
					selected: this.selectedOffers.length
				},
				account: {
					balance: this.accountBalance,
					hourlyCost: this.currentHourlyCost
				}
			};
		},
		
		reset: function() {
			this.stopAutoRefresh();
			
			this.currentInstances = [];
			this.selectedInstances = [];
			this.selectedOffers = [];
			this.accountBalance = null;
			this.currentHourlyCost = 0;
			this.refreshInProgress = false;
			this.lastRefreshTime = null;
		}
	};

	$(document).ready(function () {
		VastApp.init();
	});

})();