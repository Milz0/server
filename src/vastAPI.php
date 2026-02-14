<?php

require_once(dirname(__FILE__) . "/inc/load.php");

header('Content-Type: application/json');

if (!Login::getInstance()->isLoggedin()) {
    echo json_encode(['success' => false, 'error' => 'Authentication required']);
    exit;
}

try {
    AccessControl::getInstance()->checkPermission(DAccessControl::SERVER_CONFIG_ACCESS);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Permission denied']);
    exit;
}

$action = '';
if (isset($_POST['action'])) {
    $action = $_POST['action'];
} else if (isset($_GET['action'])) {
    $action = $_GET['action'];
}

if ($action !== DVastAction::GET_INSTANCE_AGENT_STATS && $action !== 'getInstanceAgentStats') {
    echo json_encode([
        'success' => false,
        'error' => 'Deprecated endpoint. Use vast.php for Vast actions.'
    ]);
    exit;
}

// Forward to the unified Vast handler (same logic as vast.php AJAX handling).
try {
    $handler = new VastHandler();
    $handler->handle(DVastAction::GET_INSTANCE_AGENT_STATS);
    // VastHandler->handle() exits
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
