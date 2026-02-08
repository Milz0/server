/**
 * Hashtopolis Utility Functions
 * Handles collapse/expand state persistence and Bootstrap 5 compatibility
 */

/**
 * Save collapse/expand state to localStorage
 * @param {string} elementId - The element ID to track
 */
function expansionCheck(elementId) {
    const isHidden = $(elementId).is(":hidden");
    if (isHidden === true) {
        window.localStorage.setItem(elementId, "yes");
    } else {
        window.localStorage.setItem(elementId, "no");
    }
}

/**
 * Restore collapse/expand state from localStorage on page load
 * @param {string} elementId - The element ID to restore
 */
function checkOnLoading(elementId) {
    const isExpanded = window.localStorage.getItem(elementId);
    if (isExpanded === "yes") {
        $(elementId).collapse("show");
    }
}

/**
 * Initialize Bootstrap 5 Tooltips on page load
 */
$(function () {
    $('[data-bs-toggle="tooltip"]').tooltip();
});