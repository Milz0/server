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
        autoRefreshDelay: 15000, // 15 seconds
        refreshInProgress: false,
        lastRefreshTime: null,

        isInitialized: false,
        initStartTime: null,

        init: function () {
            this.initStartTime = Date.now();

            // Determine actual current tab from active tab pane
            const activePane = $('.tab-pane.active');
            if (activePane.length) {
                this.currentTab = activePane.attr('id');
            }

            console.log('[VastApp] Initialized with currentTab:', this.currentTab);

            this.setupEventListeners();
            this.loadInitialData();
        },

        loadInitialData: function () {
            const self = this;
            const promises = [];

            promises.push(VastAPI.loadInstances());
            promises.push(VastAPI.loadAccountBalance());

            $.when.apply($, promises).always(function () {
                VastAPI.checkAutoDestroy();

                // Only start auto-refresh if CURRENTLY on instances tab
                if (self.currentTab === 'instances') {
                    self.startAutoRefresh();
                } else {
                    console.log('[VastApp] Not on instances tab (' + self.currentTab + '), skipping auto-refresh start');
                }

                self.isInitialized = true;
            }).fail(function (error) {
                self.showNotification('error', 'Initialization Failed', 'Check your API key in Settings');
            });
        },

        setupEventListeners: function () {
            const self = this;

            // Tab switching - detect Bootstrap tab change
            $(document).off('shown.bs.tab').on('shown.bs.tab', function (e) {
                // Get the newly active tab pane
                const activePane = $('.tab-pane.active');
                if (activePane.length) {
                    const targetTab = activePane.attr('id');
                    self.handleTabChange(targetTab);
                }
            });

            // Auto-refresh toggle
            $('#autoRefreshToggle').off('change').on('change', function () {
                const isEnabled = $(this).is(':checked');
                if (isEnabled) {
                    self.startAutoRefresh();
                } else {
                    self.stopAutoRefresh();
                }
            });

            // Refresh when tab becomes visible
            document.addEventListener('visibilitychange', function () {
                if (!document.hidden && self.currentTab === 'instances' && self.autoRefreshEnabled) {
                    console.log('[VastApp] Page became visible, refreshing instances');
                    VastAPI.loadInstances(true);
                }
            });
        },

        handleTabChange: function (tabName) {
            const previousTab = this.currentTab;
            this.currentTab = tabName;

            console.log(`[VastApp] Tab changed: ${previousTab} → ${tabName}`);

            if (tabName === 'instances') {
                // Load instances when switching to instances tab
                VastAPI.loadInstances();

                // Start auto-refresh if not already running
                if (!this.autoRefreshEnabled) {
                    this.startAutoRefresh();
                }
            } else {
                // Stop auto-refresh when leaving instances tab
                if (this.autoRefreshEnabled) {
                    this.stopAutoRefresh();
                }
            }
        },

        /**
         * Start auto-refresh cycle for instances
         * Only runs when on instances tab and document is visible
         */
        startAutoRefresh: function () {
            // Don't start if already running
            if (this.autoRefreshInterval) {
                console.log('[VastApp] Auto-refresh already running');
                return;
            }

            // Don't start if not on instances tab
            if (this.currentTab !== 'instances') {
                console.log('[VastApp] Not on instances tab, cannot start auto-refresh');
                return;
            }

            this.autoRefreshEnabled = true;
            $('#autoRefreshToggle').prop('checked', true);

            console.log('[VastApp] Auto-refresh STARTED (15s interval)');

            const self = this;

            // Set up interval
            this.autoRefreshInterval = setInterval(function () {
                if (self.currentTab === 'instances' &&
                    !document.hidden &&
                    !self.refreshInProgress) {

                    self.refreshInProgress = true;
                    self.lastRefreshTime = Date.now();

                    console.log('[VastApp] Auto-refresh cycle triggered');

                    $.when(
                        VastAPI.loadInstances(true),
                        VastAPI.checkAutoDestroy()
                    ).always(function () {
                        self.refreshInProgress = false;
                    });
                }
            }, this.autoRefreshDelay);
        },

        /**
         * Stop auto-refresh cycle
         */
        stopAutoRefresh: function () {
            if (this.autoRefreshInterval) {
                clearInterval(this.autoRefreshInterval);
                this.autoRefreshInterval = null;
            }

            this.autoRefreshEnabled = false;
            $('#autoRefreshToggle').prop('checked', false);

            console.log('[VastApp] Auto-refresh STOPPED');
        },

        /**
         * Force an immediate refresh
         */
        forceRefresh: function () {
            if (this.refreshInProgress) {
                this.showNotification('warning', 'Refresh In Progress', 'Please wait for current refresh to complete');
                return;
            }

            if (this.currentTab === 'instances') {
                this.refreshInProgress = true;
                this.lastRefreshTime = Date.now();

                console.log('[VastApp] Force refresh triggered');
                this.showNotification('info', 'Refreshing...', 'Fetching latest data');

                const self = this;
                $.when(
                    VastAPI.loadInstances(false),
                    VastAPI.checkAutoDestroy(),
                    VastAPI.loadAccountBalance()
                ).always(function () {
                    self.refreshInProgress = false;
                    self.showNotification('success', 'Instances Refreshed', 'Last updated: ' + new Date().toLocaleTimeString());
                });
            } else if (this.currentTab === 'offers') {
                this.showNotification('info', 'Offer Search', 'Click "Search Offers" to load GPU listings');
            }
        },

        /**
         * Display notification to user
         */
        showNotification: function (type, title, message) {
            if (typeof VastNotifications === 'undefined') {
                console.warn('[VastApp] VastNotifications not available, using fallback');
                alert(`${title}\n${message}`);
                return;
            }

            try {
                VastNotifications[type](title,message,{duration:3000});
            } catch (e) {
                console.error('[VastApp] Error showing notification:', e);
                alert(`${title}\n${message}`);
            }
        },

        /**
         * Get current application status
         */
        getStatus: function () {
            return {
                initialized: this.isInitialized,
                currentTab: this.currentTab,
                autoRefresh: {
                    enabled: this.autoRefreshEnabled,
                    interval: this.autoRefreshDelay,
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

        /**
         * Reset application state
         */
        reset: function () {
            console.log('[VastApp] Resetting application state');
            
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

    // Initialize app when DOM is ready
    $(document).ready(function () {
        setTimeout(function () {
            VastApp.init();
        }, 100);
    });

})();