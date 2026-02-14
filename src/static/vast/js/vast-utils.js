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

        generateQuirkyName: function () {
            const adjectives = [
                'rapid', 'swift', 'blazing', 'turbo', 'super', 'mega', 'ultra', 'quantum',
                'brute', 'hash', 'crack', 'cyber', 'digital', 'sonic', 'radical', 'awesome',
                'primal', 'savage', 'vivid', 'crisp', 'sleek', 'smooth', 'slick', 'clever',
                'smart', 'wise', 'mighty', 'fierce', 'bold', 'sharp', 'bright', 'wild',
                'epic', 'cosmic', 'stellar', 'atomic', 'binary', 'hex', 'crypto', 'cipher',
                'prime', 'algorithm', 'parallel', 'distributed', 'optimized', 'enhanced'
            ];

            const nouns = [
                'hashcat', 'hashbuster', 'cracker', 'breaker', 'smasher', 'crusher',
                'md5', 'sha256', 'bcrypt', 'argon2', 'scrypt', 'ntlm', 'des', 'aes',
                'wordlist', 'dictionary', 'rainbow', 'collision', 'brute', 'mask',
                'gpu', 'cuda', 'opencl', 'processor', 'compute', 'kernel',
                'cipher', 'cipher-text', 'plaintext', 'payload', 'exploit', 'vector',
                'hydra', 'john', 'hashcat', 'aircrack', 'sqlmap', 'metasploit',
                'entropy', 'decoder', 'encoder', 'mutator', 'permutation', 'iteration',
                'salt', 'pepper', 'nonce', 'token', 'key', 'passphrase', 'credential'
            ];

            const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
            const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

            return randomAdjective + '-' + randomNoun;
        },

        getCountryName: function (geolocation) {
            if (!geolocation) return 'Unknown';

            const countryMap = {
                // North America
                'US': 'United States', 'CA': 'Canada', 'MX': 'Mexico',
                'CR': 'Costa Rica', 'PA': 'Panama', 'GT': 'Guatemala',
                'HN': 'Honduras', 'SV': 'El Salvador', 'NI': 'Nicaragua',
                'BZ': 'Belize', 'CU': 'Cuba', 'DO': 'Dominican Republic',
                'HT': 'Haiti', 'JM': 'Jamaica', 'PR': 'Puerto Rico',

                // South America
                'BR': 'Brazil', 'AR': 'Argentina', 'CL': 'Chile',
                'CO': 'Colombia', 'PE': 'Peru', 'VE': 'Venezuela',
                'EC': 'Ecuador', 'BO': 'Bolivia', 'PY': 'Paraguay',
                'UY': 'Uruguay', 'GY': 'Guyana', 'SR': 'Suriname',
                'GF': 'French Guiana',

                // Europe
                'GB': 'United Kingdom', 'DE': 'Germany', 'FR': 'France', 'IT': 'Italy',
                'ES': 'Spain', 'NL': 'Netherlands', 'BE': 'Belgium', 'CH': 'Switzerland',
                'AT': 'Austria', 'SE': 'Sweden', 'NO': 'Norway', 'DK': 'Denmark',
                'FI': 'Finland', 'PL': 'Poland', 'CZ': 'Czech Republic', 'HU': 'Hungary',
                'RO': 'Romania', 'BG': 'Bulgaria', 'GR': 'Greece', 'PT': 'Portugal',
                'IE': 'Ireland', 'SK': 'Slovakia', 'HR': 'Croatia', 'LT': 'Lithuania',
                'LV': 'Latvia', 'EE': 'Estonia', 'SI': 'Slovenia', 'LU': 'Luxembourg',
                'MT': 'Malta', 'CY': 'Cyprus', 'IS': 'Iceland', 'UA': 'Ukraine',
                'RU': 'Russia', 'BY': 'Belarus', 'MD': 'Moldova', 'AL': 'Albania',
                'RS': 'Serbia', 'BA': 'Bosnia', 'MK': 'Macedonia', 'ME': 'Montenegro',

                // Asia
                'CN': 'China', 'JP': 'Japan', 'IN': 'India', 'KR': 'South Korea',
                'ID': 'Indonesia', 'TH': 'Thailand', 'VN': 'Vietnam', 'PH': 'Philippines',
                'MY': 'Malaysia', 'SG': 'Singapore', 'TW': 'Taiwan', 'HK': 'Hong Kong',
                'BD': 'Bangladesh', 'PK': 'Pakistan', 'TR': 'Turkey', 'IR': 'Iran',
                'IQ': 'Iraq', 'SA': 'Saudi Arabia', 'AE': 'UAE', 'IL': 'Israel',
                'KZ': 'Kazakhstan', 'UZ': 'Uzbekistan', 'MM': 'Myanmar', 'KH': 'Cambodia',
                'LA': 'Laos', 'NP': 'Nepal', 'LK': 'Sri Lanka', 'AF': 'Afghanistan',
                'MN': 'Mongolia', 'KG': 'Kyrgyzstan', 'TJ': 'Tajikistan', 'TM': 'Turkmenistan',
                'JO': 'Jordan', 'LB': 'Lebanon', 'SY': 'Syria', 'YE': 'Yemen',
                'OM': 'Oman', 'KW': 'Kuwait', 'QA': 'Qatar', 'BH': 'Bahrain',

                // Africa
                'ZA': 'South Africa', 'EG': 'Egypt', 'NG': 'Nigeria', 'KE': 'Kenya',
                'MA': 'Morocco', 'TN': 'Tunisia', 'DZ': 'Algeria', 'LY': 'Libya',
                'ET': 'Ethiopia', 'TZ': 'Tanzania', 'UG': 'Uganda', 'GH': 'Ghana',
                'SN': 'Senegal', 'CI': 'Ivory Coast', 'CM': 'Cameroon', 'ZW': 'Zimbabwe',
                'ZM': 'Zambia', 'MW': 'Malawi', 'BW': 'Botswana', 'MZ': 'Mozambique',
                'AO': 'Angola', 'SD': 'Sudan', 'MG': 'Madagascar', 'RW': 'Rwanda',

                // Oceania
                'AU': 'Australia', 'NZ': 'New Zealand', 'FJ': 'Fiji', 'PG': 'Papua New Guinea',
                'NC': 'New Caledonia', 'PF': 'French Polynesia', 'WS': 'Samoa', 'TO': 'Tonga'
            };

            // Extract country code (last part after comma)
            const parts = geolocation.split(',');
            const countryCode = parts.length > 1 ? parts[parts.length - 1].trim() : geolocation.trim();

            // Return country name or fallback to geolocation string
            return countryMap[countryCode] || geolocation;
        },

        getOfferBadges: function (offer) {
            let badges = '';

            // -----------------------------
            // Verification badge
            // -----------------------------
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

            // -----------------------------
            // Datacenter badge
            // -----------------------------
            if (offer.hosting_type === 1 || offer.hosting_type === '1') {
                badges += '<span class="badge bg-primary rounded-pill me-1" title="Datacenter">';
                badges += '<i class="fas fa-building"></i> DC';
                badges += '</span>';
            }

            // -----------------------------
            // Truthful reliability badge
            // -----------------------------
            let r = null;

            if (offer.reliability !== undefined && offer.reliability !== null) {
                r = Number(offer.reliability);
            } else if (offer.reliability2 !== undefined && offer.reliability2 !== null) {
                r = Number(offer.reliability2);
            }

            if (Number.isFinite(r)) {

                if (r > 1.0) r = r / 100.0;

                // Clamp
                if (r < 0) r = 0;
                if (r > 1) r = 1;

                const pct = r * 100;

                let reliabilityText;

                if (pct === 100) {
                    reliabilityText = '100%';
                } else {
                    let formatted = pct.toFixed(2);
                    formatted = formatted.replace(/\.00$/, '');        // 99.00 -> 99
                    formatted = formatted.replace(/(\.\d)0$/, '$1');   // 99.90 -> 99.9
                    reliabilityText = formatted + '%';
                }


                let reliabilityClass = 'secondary';
                let reliabilityIcon = 'fa-question';

                if (pct >= 99) {
                    reliabilityClass = 'success';
                    reliabilityIcon = 'fa-star';
                } else if (pct >= 95) {
                    reliabilityClass = 'info';
                    reliabilityIcon = 'fa-star-half-alt';
                } else if (pct >= 90) {
                    reliabilityClass = 'warning';
                    reliabilityIcon = 'fa-exclamation-triangle';
                } else {
                    reliabilityClass = 'danger';
                    reliabilityIcon = 'fa-times-circle';
                }

                badges += '<span class="badge bg-' + reliabilityClass + ' rounded-pill me-1" title="Reliability: ' + reliabilityText + '">';
                badges += '<i class="fas ' + reliabilityIcon + '"></i> ' + reliabilityText;
                badges += '</span>';
            }

            return badges;
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
            // Modern clipboard API
            if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(text)
                    .then(() => {
                        if (showNotification && window.VastNotifications) {
                            VastNotifications.success(
                                'Copied',
                                VastUtils.truncate(text, 40),
                                { duration: 1500 }
                            );
                        }
                    })
                    .catch(() => {
                        if (showNotification && window.VastNotifications) {
                            VastNotifications.error(
                                'Copy Failed',
                                'Could not copy to clipboard',
                                { duration: 3000 }
                            );
                        }
                    });
            } else {
                // Fallback for older browsers
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
                } finally {
                    document.body.removeChild(textarea);
                }
            }
        },

        formatBytes: function (bytes, decimals = 2) {
            if (bytes === 0) return '0 Bytes';
            if (!bytes || bytes < 0) return 'N/A';

            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));

            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        },

        formatCurrency: function (amount, currency = 'USD', decimals = 2) {
            if (amount === null || amount === undefined || isNaN(amount)) return 'N/A';

            const numAmount = parseFloat(amount);

            if (currency === 'USD') {
                return '$' + numAmount.toFixed(decimals);
            }

            return numAmount.toFixed(decimals) + ' ' + currency;
        },

        truncate: function (text, maxLength = 50) {
            if (!text) return '';
            text = String(text);
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength - 3) + '...';
        },

        safeJSONParse: function (str, fallback = null) {
            if (!str) return fallback;
            try {
                return JSON.parse(str);
            } catch (e) {
                console.warn('[VastUtils] JSON parse error:', e);
                return fallback;
            }
        },

        debounce: function (func, wait = 300) {
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

        throttle: function (func, limit = 100) {
            let inThrottle;
            return function (...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        generateId: function (prefix = 'id') {
            return prefix + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        },

        timeAgo: function (timestamp) {
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

        formatDateTime: function (timestamp, format = 'full') {
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

        isValidIP: function (ip) {
            if (!ip) return false;
            const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
            if (!ipv4Regex.test(ip)) return false;
            return ip.split('.').every(part => {
                const num = parseInt(part);
                return num >= 0 && num <= 255;
            });
        },

        parseSSHConnection: function (sshHost, sshPort) {
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

        escapeHtml: function (text) {
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

        parseQueryString: function (queryString) {
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

        buildQueryString: function (params) {
            if (!params || Object.keys(params).length === 0) return '';

            return Object.keys(params)
                .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
                .join('&');
        },

        deepClone: function (obj) {
            if (obj === null || typeof obj !== 'object') return obj;
            try {
                return JSON.parse(JSON.stringify(obj));
            } catch (e) {
                console.warn('[VastUtils] Deep clone error:', e);
                return obj;
            }
        },

        isEmpty: function (obj) {
            if (!obj) return true;
            if (Array.isArray(obj)) return obj.length === 0;
            if (typeof obj === 'object') return Object.keys(obj).length === 0;
            return false;
        },

        formatNumber: function (num, decimals = 0) {
            if (num === null || num === undefined || isNaN(num)) return 'N/A';

            const numValue = parseFloat(num);
            const parts = numValue.toFixed(decimals).split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

            return parts.join('.');
        },

        percentage: function (value, total, decimals = 1) {
            if (!total || total === 0) return '0%';
            return ((value / total) * 100).toFixed(decimals) + '%';
        },

        clamp: function (num, min, max) {
            return Math.min(Math.max(num, min), max);
        },

        randomString: function (length = 8, charset = 'alphanumeric') {
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