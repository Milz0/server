<?php

use DBA\QueryFilter;
use DBA\Config;
use DBA\Factory;
use DBA\Agent;
use DBA\AgentStat;
use DBA\OrderFilter;
use DBA\RegVoucher;

require_once(dirname(__FILE__) . "/inc/load.php");

// Set JSON header
header('Content-Type: application/json');

// Check if user is logged in
if (!Login::getInstance()->isLoggedin()) {
    echo json_encode(['success' => false, 'error' => 'Authentication required']);
    exit;
}

// Check permissions
try {
    AccessControl::getInstance()->checkPermission(DAccessControl::SERVER_CONFIG_ACCESS);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Permission denied']);
    exit;
}

// DEBUG - log what we received
error_log("========================================");
error_log("[vastAPI.php] ===== NEW REQUEST =====");
error_log("[vastAPI.php] REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD']);
error_log("[vastAPI.php] POST data: " . json_encode($_POST));
error_log("[vastAPI.php] GET data: " . json_encode($_GET));

// Get action from POST or GET
$action = '';
if (isset($_POST['action'])) {
    $action = $_POST['action'];
} else if (isset($_GET['action'])) {
    $action = $_GET['action'];
}

error_log("[vastAPI.php] Action: " . $action);

if (empty($action)) {
    echo json_encode([
        'success' => false, 
        'error' => 'No action specified'
    ]);
    exit;
}

// Handle agent stats requests
if ($action === 'getInstanceAgentStats') {
    try {
        error_log("[vastAPI.php] Getting agent stats for instances");
        
        $instances = isset($_POST['instances']) ? $_POST['instances'] : [];
        
        // If instances is JSON string, decode it
        if (is_string($instances)) {
            $instances = json_decode($instances, true);
        }
        
        error_log("[vastAPI.php] Processing " . count($instances) . " instances");
        
        $result = [];
        
        foreach ($instances as $instanceData) {
            $instanceId = $instanceData['id'];
            
            error_log("[vastAPI.php] ========================================");
            error_log("[vastAPI.php] Instance ID: $instanceId");
            
            // Initialize stats structure
            $agentStats = [
                'instanceId' => $instanceId,
                'agentFound' => false,
                'gpuUtil' => null,
                'gpuUtilRaw' => null,
                'gpuTemp' => null,
                'color' => null
            ];
            
            $agent = null;
            
            // Look up agent via RegVoucher
            try {
                $qF = new QueryFilter(RegVoucher::VAST_INSTANCE_ID, $instanceId, "=");
                $regVoucher = Factory::getRegVoucherFactory()->filter([Factory::FILTER => $qF], true);
                
                if ($regVoucher) {
                    $agentId = $regVoucher->getAgentId();
                    error_log("[vastAPI.php] Found RegVoucher, agentId: " . ($agentId ?? 'NULL'));
                    
                    if ($agentId) {
                        // Get agent directly by ID
                        $agent = Factory::getAgentFactory()->get($agentId);
                        
                        if ($agent) {
                            error_log("[vastAPI.php] ✅ Found agent #" . $agent->getId() . 
                                      " (Name: " . $agent->getAgentName() . ")");
                        } else {
                            error_log("[vastAPI.php] ⚠️ Agent ID $agentId not found");
                        }
                    } else {
                        error_log("[vastAPI.php] ⚠️ RegVoucher exists but no agent registered yet");
                    }
                } else {
                    error_log("[vastAPI.php] ⚠️ No RegVoucher found for instance $instanceId");
                }
            } catch (Exception $e) {
                error_log("[vastAPI.php] ❌ Error looking up agent: " . $e->getMessage());
            }
            
            // Get GPU stats if agent found
            if ($agent) {
                $agentStats['agentFound'] = true;
                $agentStats['agentId'] = $agent->getId();
                $agentStats['agentName'] = $agent->getAgentName();
                $agentStats['isActive'] = ($agent->getIsActive() == 1);
                
                error_log("[vastAPI.php] 📊 Fetching GPU stats...");
                
                // Get GPU utilization (last 60 seconds)
                $qF1 = new QueryFilter(AgentStat::AGENT_ID, $agent->getId(), "=");
                $qF2 = new QueryFilter(AgentStat::STAT_TYPE, DAgentStatsType::GPU_UTIL, "=");
                $qF3 = new QueryFilter(AgentStat::TIME, time() - 60, ">");
                $oF = new OrderFilter(AgentStat::TIME, "DESC");
                
                $gpuUtilStat = Factory::getAgentStatFactory()->filter([
                    Factory::FILTER => [$qF1, $qF2, $qF3],
                    Factory::ORDER => $oF
                ], true);
                
                if ($gpuUtilStat) {
                    $age = time() - $gpuUtilStat->getTime();
                    error_log("[vastAPI.php] ✅ GPU util: " . $gpuUtilStat->getValue() . " (age: {$age}s)");
                    
                    $agentStats['gpuUtil'] = AgentUtils::getDeviceUtilStatusValue($gpuUtilStat);
                    $agentStats['gpuUtilRaw'] = $gpuUtilStat->getValue();
                    $agentStats['color'] = AgentUtils::getDeviceUtilStatusColor($gpuUtilStat, $agent);
                    $agentStats['lastUpdate'] = $gpuUtilStat->getTime();
                    
                    $utilValues = explode(",", $gpuUtilStat->getValue());
                    $agentStats['gpuUtilPerDevice'] = array_map('intval', $utilValues);
                } else {
                    error_log("[vastAPI.php] ⚠️ No GPU util stats in last 60s");
                }
                
                // Get GPU temperature
                $qF2 = new QueryFilter(AgentStat::STAT_TYPE, DAgentStatsType::GPU_TEMP, "=");
                $gpuTempStat = Factory::getAgentStatFactory()->filter([
                    Factory::FILTER => [$qF1, $qF2, $qF3],
                    Factory::ORDER => $oF
                ], true);
                
                if ($gpuTempStat) {
                    error_log("[vastAPI.php] ✅ GPU temp: " . $gpuTempStat->getValue());
                    
                    $agentStats['gpuTemp'] = AgentUtils::getDeviceTempStatusValue($gpuTempStat);
                    $agentStats['gpuTempRaw'] = $gpuTempStat->getValue();
                    $tempValues = explode(",", $gpuTempStat->getValue());
                    $agentStats['gpuTempPerDevice'] = array_map('intval', $tempValues);
                }
            }
            
            $result[] = $agentStats;
        }
        
        error_log("[vastAPI.php] ========================================");
        error_log("[vastAPI.php] ✅ Returning stats for " . count($result) . " instances");
        echo json_encode(['success' => true, 'data' => $result]);
        exit;
        
    } catch (Exception $e) {
        error_log("[vastAPI.php] ❌ ERROR: " . $e->getMessage());
        error_log("[vastAPI.php] Stack trace: " . $e->getTraceAsString());
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        exit;
    }
}

// Initialize handler for other actions
$handler = new VastHandler();

try {
    if ($action === 'listOffers') {
        $filters = isset($_POST['filters']) ? $_POST['filters'] : [];
        error_log("[vastAPI.php] LIST OFFERS - Filters: " . json_encode($filters));
    }
    
    $result = $handler->handle($action);
    
    if ($action === 'listOffers' && isset($result['offers'])) {
        error_log("[vastAPI.php] Returning " . count($result['offers']) . " offers");
    }
    
    error_log("[vastAPI.php] ===== REQUEST COMPLETE =====");
    error_log("========================================");
    
    echo json_encode($result);
} catch (Exception $e) {
    error_log("[vastAPI.php] ERROR: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}