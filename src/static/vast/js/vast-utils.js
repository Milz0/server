// vast-utils.js - Utility functions
(function () {
	'use strict';

	const VastUtils = {

		getStatusBadge: function (status) {
			if (!status) return 'secondary';
			status = status.toLowerCase();
			if (status === 'running') return 'success';
			if (status === 'starting' || status === 'loading' || status === 'created') return 'info';
			if (status === 'stopped') return 'warning';
			if (status === 'exited') return 'danger';
			return 'secondary';
		},

		getStatusIcon: function (status) {
			if (!status) return 'fa-question-circle';
			status = status.toLowerCase();
			if (status === 'running') return 'fa-check-circle';
			if (status === 'starting' || status === 'loading' || status === 'created') return 'fa-spinner fa-spin';
			if (status === 'stopped') return 'fa-pause-circle';
			if (status === 'exited') return 'fa-times-circle';
			return 'fa-circle';
		},

		getContinent: function (geolocation) {
			if (!geolocation) return 'Unknown';

			const parts = geolocation.split(',');
			const countryCode = parts.length > 1 ? parts[parts.length - 1].trim() : '';

			const continentMapping = {
				'US': 'North America', 'CA': 'North America', 'MX': 'North America',
				'CR': 'North America', 'PA': 'North America', 'GT': 'North America',
				'HN': 'North America', 'SV': 'North America', 'NI': 'North America',
				'BZ': 'North America', 'CU': 'North America', 'DO': 'North America',
				'HT': 'North America', 'JM': 'North America', 'PR': 'North America',
				'BR': 'South America', 'AR': 'South America', 'CL': 'South America',
				'CO': 'South America', 'PE': 'South America', 'VE': 'South America',
				'EC': 'South America', 'BO': 'South America', 'PY': 'South America',
				'UY': 'South America', 'GY': 'South America', 'SR': 'South America',
				'GF': 'South America',
				'GB': 'Europe', 'DE': 'Europe', 'FR': 'Europe', 'IT': 'Europe',
				'ES': 'Europe', 'NL': 'Europe', 'BE': 'Europe', 'CH': 'Europe',
				'AT': 'Europe', 'SE': 'Europe', 'NO': 'Europe', 'DK': 'Europe',
				'FI': 'Europe', 'PL': 'Europe', 'CZ': 'Europe', 'HU': 'Europe',
				'RO': 'Europe', 'BG': 'Europe', 'GR': 'Europe', 'PT': 'Europe',
				'IE': 'Europe', 'SK': 'Europe', 'HR': 'Europe', 'LT': 'Europe',
				'LV': 'Europe', 'EE': 'Europe', 'SI': 'Europe', 'LU': 'Europe',
				'MT': 'Europe', 'CY': 'Europe', 'IS': 'Europe', 'UA': 'Europe',
				'RU': 'Europe', 'BY': 'Europe', 'MD': 'Europe', 'AL': 'Europe',
				'RS': 'Europe', 'BA': 'Europe', 'MK': 'Europe', 'ME': 'Europe',
				'CN': 'Asia', 'JP': 'Asia', 'IN': 'Asia', 'KR': 'Asia',
				'ID': 'Asia', 'TH': 'Asia', 'VN': 'Asia', 'PH': 'Asia',
				'MY': 'Asia', 'SG': 'Asia', 'TW': 'Asia', 'HK': 'Asia',
				'BD': 'Asia', 'PK': 'Asia', 'TR': 'Asia', 'IR': 'Asia',
				'IQ': 'Asia', 'SA': 'Asia', 'AE': 'Asia', 'IL': 'Asia',
				'KZ': 'Asia', 'UZ': 'Asia', 'MM': 'Asia', 'KH': 'Asia',
				'LA': 'Asia', 'NP': 'Asia', 'LK': 'Asia', 'AF': 'Asia',
				'MN': 'Asia', 'KG': 'Asia', 'TJ': 'Asia', 'TM': 'Asia',
				'JO': 'Asia', 'LB': 'Asia', 'SY': 'Asia', 'YE': 'Asia',
				'OM': 'Asia', 'KW': 'Asia', 'QA': 'Asia', 'BH': 'Asia',
				'ZA': 'Africa', 'EG': 'Africa', 'NG': 'Africa', 'KE': 'Africa',
				'MA': 'Africa', 'TN': 'Africa', 'DZ': 'Africa', 'LY': 'Africa',
				'ET': 'Africa', 'TZ': 'Africa', 'UG': 'Africa', 'GH': 'Africa',
				'SN': 'Africa', 'CI': 'Africa', 'CM': 'Africa', 'ZW': 'Africa',
				'ZM': 'Africa', 'MW': 'Africa', 'BW': 'Africa', 'MZ': 'Africa',
				'AO': 'Africa', 'SD': 'Africa', 'MG': 'Africa', 'RW': 'Africa',
				'AU': 'Oceania', 'NZ': 'Oceania', 'FJ': 'Oceania', 'PG': 'Oceania',
				'NC': 'Oceania', 'PF': 'Oceania', 'WS': 'Oceania', 'TO': 'Oceania'
			};

			return continentMapping[countryCode] || 'Unknown';
		},

		getCountryName: function (geolocation) {
			if (!geolocation) return 'Unknown';
			const parts = geolocation.split(',');
			return parts[0].trim();
		},

		getOfferBadges: function (offer) {
			let badges = '';

			const verification = offer.verification;

			if (verification === 'verified') {
				badges += '<span class="badge bg-success rounded-pill me-1" title="Verified Host">';
				badges += '<i class="fas fa-check-circle"></i> Verified';
				badges += '</span>';
			} else if (verification === 'deverified') {
				badges += '<span class="badge bg-danger rounded-pill me-1" title="Deverified - Was verified but no longer meets requirements">';
				badges += '<i class="fas fa-times-circle"></i> Deverified';
				badges += '</span>';
			} else {
				badges += '<span class="badge bg-secondary rounded-pill me-1" title="Unverified Host">';
				badges += '<i class="fas fa-question-circle"></i> Unverified';
				badges += '</span>';
			}

			if (offer.hosting_type === 1) {
				badges += '<span class="badge bg-primary rounded-pill me-1" title="Datacenter">';
				badges += '<i class="fas fa-building"></i> DC';
				badges += '</span>';
			}

			if (offer.reliability2 !== undefined && offer.reliability2 !== null) {
				const reliabilityPct = (offer.reliability2 * 100).toFixed(0);
				let reliabilityClass = 'secondary';
				let reliabilityIcon = 'fa-question';

				if (reliabilityPct >= 99) {
					reliabilityClass = 'success';
					reliabilityIcon = 'fa-star';
				} else if (reliabilityPct >= 95) {
					reliabilityClass = 'info';
					reliabilityIcon = 'fa-star-half-alt';
				} else if (reliabilityPct >= 90) {
					reliabilityClass = 'warning';
					reliabilityIcon = 'fa-exclamation-triangle';
				} else {
					reliabilityClass = 'danger';
					reliabilityIcon = 'fa-times-circle';
				}

				badges += '<span class="badge bg-' + reliabilityClass + ' rounded-pill me-1" title="Reliability: ' + reliabilityPct + '%">';
				badges += '<i class="fas ' + reliabilityIcon + '"></i> ' + reliabilityPct + '%';
				badges += '</span>';
			}

			return badges;
		},

		getInstanceTypeBadge: function (instance) {
			if (instance.intended_status === 'running') {
				return '<span class="badge bg-success rounded-pill" title="On-Demand Instance"><i class="fas fa-server"></i> On-Demand</span>';
			} else if (instance.intended_status === 'stopped') {
				return '<span class="badge bg-warning rounded-pill" title="Bid Instance"><i class="fas fa-gavel"></i> Bid</span>';
			} else {
				return '<span class="badge bg-secondary rounded-pill" title="Unknown Type"><i class="fas fa-question"></i> Unknown</span>';
			}
		},

		isBidInstance: function (instance) {
			if (instance.max_bid_price !== undefined && instance.max_bid_price !== null) {
				return true;
			}
			return false;
		},

		formatUptime: function (seconds) {
			if (!seconds || seconds < 0) return '0s';
			
			const minutes = Math.floor(seconds / 60);
			const hours = Math.floor(minutes / 60);
			const days = Math.floor(hours / 24);
			const secs = Math.floor(seconds % 60);

			if (days > 0) {
				return `${days}d ${hours % 24}h ${minutes % 60}m`;
			} else if (hours > 0) {
				return `${hours}h ${minutes % 60}m ${secs}s`;
			} else if (minutes > 0) {
				return `${minutes}m ${secs}s`;
			} else {
				return `${secs}s`;
			}
		},

		copyToClipboard: function (text, showNotification = false) {
			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(text).then(function() {
					if (showNotification && window.VastNotifications) {
						VastNotifications.success(
							'Copied',
							VastUtils.truncate(text, 40),
							{ duration: 1500 }
						);
					}
				}).catch(function (err) {
					if (showNotification && window.VastNotifications) {
						VastNotifications.error(
							'Copy Failed',
							'Could not copy to clipboard',
							{ duration: 3000 }
						);
					}
				});
			} else {
				const textarea = document.createElement('textarea');
				textarea.value = text;
				textarea.style.position = 'fixed';
				textarea.style.opacity = '0';
				document.body.appendChild(textarea);
				textarea.select();
				try {
					document.execCommand('copy');
					if (showNotification && window.VastNotifications) {
						VastNotifications.success(
							'Copied',
							VastUtils.truncate(text, 40),
							{ duration: 1500 }
						);
					}
				} catch (err) {
					if (showNotification && window.VastNotifications) {
						VastNotifications.error(
							'Copy Failed',
							'Could not copy to clipboard',
							{ duration: 3000 }
						);
					}
				}
				document.body.removeChild(textarea);
			}
		},

		formatBytes: function(bytes, decimals = 2) {
			if (bytes === 0) return '0 Bytes';
			if (!bytes || bytes < 0) return 'N/A';
			
			const k = 1024;
			const dm = decimals < 0 ? 0 : decimals;
			const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
			const i = Math.floor(Math.log(bytes) / Math.log(k));
			
			return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
		},

		formatCurrency: function(amount, currency = 'USD', decimals = 2) {
			if (amount === null || amount === undefined || isNaN(amount)) return 'N/A';
			
			const numAmount = parseFloat(amount);
			
			if (currency === 'USD') {
				return '$' + numAmount.toFixed(decimals);
			}
			
			return numAmount.toFixed(decimals) + ' ' + currency;
		},

		truncate: function(text, maxLength = 50) {
			if (!text) return '';
			text = String(text);
			if (text.length <= maxLength) return text;
			return text.substring(0, maxLength - 3) + '...';
		},

		safeJSONParse: function(str, fallback = null) {
			if (!str) return fallback;
			try {
				return JSON.parse(str);
			} catch (e) {
				return fallback;
			}
		},

		debounce: function(func, wait = 300) {
			let timeout;
			return function executedFunction(...args) {
				const later = () => {
					clearTimeout(timeout);
					func(...args);
				};
				clearTimeout(timeout);
				timeout = setTimeout(later, wait);
			};
		},

		throttle: function(func, limit = 100) {
			let inThrottle;
			return function(...args) {
				if (!inThrottle) {
					func.apply(this, args);
					inThrottle = true;
					setTimeout(() => inThrottle = false, limit);
				}
			};
		},

		generateId: function(prefix = 'id') {
			return prefix + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
		},

		timeAgo: function(timestamp) {
			if (!timestamp) return 'Unknown';
			
			const ts = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
			const now = Date.now();
			const secondsAgo = Math.floor((now - ts) / 1000);
			
			if (secondsAgo < 0) return 'just now';
			if (secondsAgo < 60) return secondsAgo + ' second' + (secondsAgo === 1 ? '' : 's') + ' ago';
			
			const minutesAgo = Math.floor(secondsAgo / 60);
			if (minutesAgo < 60) {
				return minutesAgo + ' minute' + (minutesAgo === 1 ? '' : 's') + ' ago';
			}
			
			const hoursAgo = Math.floor(minutesAgo / 60);
			if (hoursAgo < 24) {
				return hoursAgo + ' hour' + (hoursAgo === 1 ? '' : 's') + ' ago';
			}
			
			const daysAgo = Math.floor(hoursAgo / 24);
			if (daysAgo < 30) {
				return daysAgo + ' day' + (daysAgo === 1 ? '' : 's') + ' ago';
			}
			
			const monthsAgo = Math.floor(daysAgo / 30);
			if (monthsAgo < 12) {
				return monthsAgo + ' month' + (monthsAgo === 1 ? '' : 's') + ' ago';
			}
			
			const yearsAgo = Math.floor(monthsAgo / 12);
			return yearsAgo + ' year' + (yearsAgo === 1 ? '' : 's') + ' ago';
		},

		formatDateTime: function(timestamp, format = 'full') {
			if (!timestamp) return 'Unknown';
			
			const ts = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
			const date = new Date(ts);
			
			if (format === 'full') {
				return date.toLocaleString();
			} else if (format === 'date') {
				return date.toLocaleDateString();
			} else if (format === 'time') {
				return date.toLocaleTimeString();
			} else if (format === 'iso') {
				return date.toISOString();
			}
			
			return date.toLocaleString();
		},

		isValidIP: function(ip) {
			if (!ip) return false;
			const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
			if (!ipv4Regex.test(ip)) return false;
			return ip.split('.').every(part => {
				const num = parseInt(part);
				return num >= 0 && num <= 255;
			});
		},

		parseSSHConnection: function(sshHost, sshPort) {
			if (!sshHost) return null;
			
			const port = sshPort || 22;
			
			return {
				host: sshHost,
				port: port,
				command: `ssh -p ${port} root@${sshHost}`,
				url: `ssh://root@${sshHost}:${port}`,
				scpUpload: `scp -P ${port} <local-file> root@${sshHost}:~/`,
				scpDownload: `scp -P ${port} root@${sshHost}:<remote-file> ./`
			};
		},

		escapeHtml: function(text) {
			if (!text) return '';
			const map = {
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#039;'
			};
			return String(text).replace(/[&<>"']/g, m => map[m]);
		},

		parseQueryString: function(queryString) {
			const params = {};
			const query = queryString || window.location.search.substring(1);
			
			if (!query) return params;
			
			const pairs = query.split('&');
			pairs.forEach(pair => {
				const [key, value] = pair.split('=');
				params[decodeURIComponent(key)] = decodeURIComponent(value || '');
			});
			
			return params;
		},

		buildQueryString: function(params) {
			if (!params || Object.keys(params).length === 0) return '';
			
			return Object.keys(params)
				.map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
				.join('&');
		},

		deepClone: function(obj) {
			if (obj === null || typeof obj !== 'object') return obj;
			try {
				return JSON.parse(JSON.stringify(obj));
			} catch (e) {
				return obj;
			}
		},

		isEmpty: function(obj) {
			if (!obj) return true;
			if (Array.isArray(obj)) return obj.length === 0;
			if (typeof obj === 'object') return Object.keys(obj).length === 0;
			return false;
		},

		formatNumber: function(num, decimals = 0) {
			if (num === null || num === undefined || isNaN(num)) return 'N/A';
			
			const numValue = parseFloat(num);
			const parts = numValue.toFixed(decimals).split('.');
			parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
			
			return parts.join('.');
		},

		percentage: function(value, total, decimals = 1) {
			if (!total || total === 0) return 0;
			return ((value / total) * 100).toFixed(decimals);
		},

		clamp: function(num, min, max) {
			return Math.min(Math.max(num, min), max);
		},

		randomString: function(length = 8, charset = 'alphanumeric') {
			const charsets = {
				'alphanumeric': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
				'alpha': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
				'numeric': '0123456789',
				'hex': '0123456789abcdef'
			};
			
			const chars = charsets[charset] || charsets.alphanumeric;
			let result = '';
			
			for (let i = 0; i < length; i++) {
				result += chars.charAt(Math.floor(Math.random() * chars.length));
			}
			
			return result;
		}
	};

	window.VastUtils = VastUtils;
})();