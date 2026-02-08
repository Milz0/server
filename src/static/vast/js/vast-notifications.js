// vast-notifications.js - Modern notification system
(function () {
	'use strict';

	window.VastNotifications = {
		history: [],
		maxHistory: 50,
		soundEnabled: true,

		init: function () {
			if ($('#vast-notification-container').length === 0) {
				$('body').append(`
					<div id="vast-notification-container" style="position: fixed; top: 70px; right: 20px; z-index: 9999; width: 400px; max-width: 90vw;"></div>
				`);
			}
			
			if ($('#vast-notification-toggle').length === 0) {
				$('#vast-status').before(`
					<div class="mb-3 d-flex justify-content-between align-items-center">
						<h5 class="mb-0">Status</h5>
						<button id="vast-notification-toggle" class="btn btn-sm btn-outline-secondary">
							<i class="fas fa-bell"></i> Notifications <span id="notification-badge" class="badge bg-danger" style="display: none;">0</span>
						</button>
					</div>
				`);
			}
			
			if ($('#notificationCenterModal').length === 0) {
				$('body').append(this.createNotificationCenterModal());
			}
			
			this.setupEventListeners();
		},

		setupEventListeners: function () {
			$('#vast-notification-toggle').off('click').on('click', function () {
				VastNotifications.showNotificationCenter();
			});
		},

		createNotificationCenterModal: function () {
			return `
				<div class="modal fade" id="notificationCenterModal" tabindex="-1" role="dialog" aria-labelledby="notificationCenterModalLabel" aria-hidden="true">
					<div class="modal-dialog modal-lg modal-dialog-scrollable" role="document">
						<div class="modal-content">
							<div class="modal-header bg-primary text-white">
								<h5 class="modal-title" id="notificationCenterModalLabel">
									<i class="fas fa-bell"></i> Notification Center
								</h5>
								<button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
							</div>
							<div class="modal-body" style="max-height: 500px; overflow-y: auto;">
								<div id="notification-history-list"></div>
							</div>
							<div class="modal-footer">
								<button type="button" class="btn btn-sm btn-outline-danger" id="clearNotificationHistory">
									<i class="fas fa-trash"></i> Clear History
								</button>
								<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
							</div>
						</div>
					</div>
				</div>
			`;
		},

		showNotificationCenter: function () {
			this.renderNotificationHistory();
			$('#notificationCenterModal').modal('show');
			
			$('#notification-badge').text('0').hide();
			
			this.history.forEach(n => n.read = true);
		},

		renderNotificationHistory: function () {
			const container = $('#notification-history-list');
			
			if (this.history.length === 0) {
				container.html(`
					<div class="text-center text-muted py-5">
						<i class="fas fa-bell-slash fa-3x mb-3"></i>
						<p>No notifications yet</p>
					</div>
				`);
				return;
			}
			
			let html = '';
			
			const today = new Date().toDateString();
			const yesterday = new Date(Date.now() - 86400000).toDateString();
			
			const grouped = {
				today: [],
				yesterday: [],
				older: []
			};
			
			this.history.slice().reverse().forEach(notification => {
				const notifDate = new Date(notification.timestamp).toDateString();
				if (notifDate === today) {
					grouped.today.push(notification);
				} else if (notifDate === yesterday) {
					grouped.yesterday.push(notification);
				} else {
					grouped.older.push(notification);
				}
			});
			
			if (grouped.today.length > 0) {
				html += '<h6 class="text-muted mt-2 mb-2"><i class="fas fa-calendar-day"></i> Today</h6>';
				grouped.today.forEach(n => {
					html += this.createHistoryItem(n);
				});
			}
			
			if (grouped.yesterday.length > 0) {
				html += '<h6 class="text-muted mt-3 mb-2"><i class="fas fa-calendar-day"></i> Yesterday</h6>';
				grouped.yesterday.forEach(n => {
					html += this.createHistoryItem(n);
				});
			}
			
			if (grouped.older.length > 0) {
				html += '<h6 class="text-muted mt-3 mb-2"><i class="fas fa-calendar-alt"></i> Older</h6>';
				grouped.older.forEach(n => {
					html += this.createHistoryItem(n);
				});
			}
			
			container.html(html);
			
			$('#clearNotificationHistory').off('click').on('click', function () {
				if (confirm('Clear all notification history?')) {
					VastNotifications.history = [];
					VastNotifications.renderNotificationHistory();
				}
			});
		},

		createHistoryItem: function (notification) {
			const typeColors = {
				success: 'success',
				error: 'danger',
				warning: 'warning',
				info: 'info'
			};
			
			const typeIcons = {
				success: 'fa-check-circle',
				error: 'fa-exclamation-circle',
				warning: 'fa-exclamation-triangle',
				info: 'fa-info-circle'
			};
			
			const color = typeColors[notification.type] || 'secondary';
			const icon = typeIcons[notification.type] || 'fa-bell';
			const time = new Date(notification.timestamp).toLocaleTimeString();
			
			return `
				<div class="card mb-2 border-${color}">
					<div class="card-body py-2">
						<div class="d-flex align-items-start">
							<div class="me-2 text-${color}">
								<i class="fas ${icon} fa-lg"></i>
							</div>
							<div class="flex-grow-1">
								<div class="d-flex justify-content-between align-items-start">
									<strong class="text-${color}">${notification.title}</strong>
									<small class="text-muted">${time}</small>
								</div>
								<p class="mb-0 small">${notification.message}</p>
								${notification.details ? `<div class="mt-1 p-2 bg-light rounded small" style="max-height: 100px; overflow-y: auto;"><code>${notification.details}</code></div>` : ''}
							</div>
						</div>
					</div>
				</div>
			`;
		},

		toast: function (type, title, message, options = {}) {
			const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
			const duration = options.duration || (type === 'error' ? 8000 : 5000);
			const sticky = options.sticky || false;
			
			const typeColors = {
				success: 'success',
				error: 'danger',
				warning: 'warning',
				info: 'info'
			};
			
			const typeIcons = {
				success: 'fa-check-circle',
				error: 'fa-exclamation-circle',
				warning: 'fa-exclamation-triangle',
				info: 'fa-info-circle'
			};
			
			const color = typeColors[type] || 'secondary';
			const icon = typeIcons[type] || 'fa-bell';
			
			this.addToHistory(type, title, message, options.details);
			
			const toastHtml = `
				<div id="${id}" class="alert alert-${color} alert-dismissible fade show shadow-sm mb-2" role="alert" style="animation: slideInRight 0.3s ease-out;">
					<div class="d-flex align-items-start">
						<div class="me-2">
							<i class="fas ${icon} fa-lg"></i>
						</div>
						<div class="flex-grow-1">
							<strong class="d-block">${title}</strong>
							<small>${message}</small>
							${options.action ? `<div class="mt-2">${options.action}</div>` : ''}
						</div>
						<button type="button" class="btn-close ms-2" data-bs-dismiss="alert" aria-label="Close"></button>
					</div>
					${!sticky && duration > 0 ? `
						<div class="progress mt-2" style="height: 3px;">
							<div class="progress-bar bg-white" role="progressbar" style="width: 100%; transition: width ${duration}ms linear;"></div>
						</div>
					` : ''}
				</div>
			`;
			
			$('#vast-notification-container').append(toastHtml);
			
			if (this.soundEnabled && (type === 'error' || type === 'warning')) {
				this.playSound(type);
			}
			
			if (!sticky && duration > 0) {
				setTimeout(() => {
					$(`#${id} .progress-bar`).css('width', '0%');
				}, 100);
			}
			
			if (!sticky && duration > 0) {
				setTimeout(() => {
					this.dismissToast(id);
				}, duration);
			}
		},

		dismissToast: function (id) {
			$(`#${id}`).fadeOut(300, function () {
				$(this).remove();
			});
		},

		addToHistory: function (type, title, message, details) {
			const notification = {
				type: type,
				title: title,
				message: message,
				details: details,
				timestamp: Date.now(),
				read: false
			};
			
			this.history.push(notification);
			
			if (this.history.length > this.maxHistory) {
				this.history.shift();
			}
			
			const unreadCount = this.history.filter(n => !n.read).length;
			if (unreadCount > 0) {
				$('#notification-badge').text(unreadCount).show();
			}
		},

		progress: function (title, current, total, message) {
			const id = 'progress-notification';
			const percent = Math.round((current / total) * 100);
			
			if ($(`#${id}`).length === 0) {
				const html = `
					<div id="${id}" class="alert alert-info shadow-sm mb-2" role="alert">
						<div class="d-flex align-items-start">
							<div class="me-2">
								<i class="fas fa-spinner fa-spin fa-lg"></i>
							</div>
							<div class="flex-grow-1">
								<strong class="d-block" id="${id}-title">${title}</strong>
								<small id="${id}-message">${message}</small>
								<div class="progress mt-2" style="height: 20px;">
									<div id="${id}-bar" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: ${percent}%">
										${current} / ${total}
									</div>
								</div>
							</div>
						</div>
					</div>
				`;
				$('#vast-notification-container').prepend(html);
			} else {
				$(`#${id}-title`).text(title);
				$(`#${id}-message`).text(message);
				$(`#${id}-bar`).css('width', percent + '%').text(`${current} / ${total}`);
			}
			
			if (current >= total) {
				setTimeout(() => {
					$(`#${id}`).fadeOut(300, function () {
						$(this).remove();
					});
				}, 2000);
			}
		},

		playSound: function (type) {
			if (!this.soundEnabled) return;
			
			try {
				const audioContext = new (window.AudioContext || window.webkitAudioContext)();
				const oscillator = audioContext.createOscillator();
				const gainNode = audioContext.createGain();
				
				oscillator.connect(gainNode);
				gainNode.connect(audioContext.destination);
				
				const frequencies = {
					success: [523.25, 659.25],
					error: [329.63, 261.63],
					warning: [440, 440],
					info: [523.25]
				};
				
				const freq = frequencies[type] || frequencies.info;
				
				oscillator.frequency.value = freq[0];
				gainNode.gain.value = 0.1;
				
				oscillator.start();
				
				if (freq[1]) {
					setTimeout(() => {
						oscillator.frequency.value = freq[1];
					}, 100);
				}
				
				setTimeout(() => {
					gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
					oscillator.stop(audioContext.currentTime + 0.3);
				}, 150);
				
			} catch (e) {
				console.warn('Could not play sound:', e);
			}
		},

		success: function (title, message, options) {
			this.toast('success', title, message, options);
		},

		error: function (title, message, options) {
			this.toast('error', title, message, options);
		},

		warning: function (title, message, options) {
			this.toast('warning', title, message, options);
		},

		info: function (title, message, options) {
			this.toast('info', title, message, options);
		}
	};

	$(document).ready(function () {
		VastNotifications.init();
	});

})();