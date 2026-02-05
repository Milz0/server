<?php

class VastHandler implements Handler
{
  public function __construct($vastId = null)
  {
    // No initialization needed
  }

  private function isAjaxRequest()
  {
    return (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest');
  }

  private function sendJsonAndExit($data, $httpCode = 200)
  {
    if (!headers_sent()) {
      http_response_code($httpCode);
      header('Content-Type: application/json; charset=utf-8');
      header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
      header('Pragma: no-cache');
    }
    echo json_encode($data);
    die();
  }

  /**
   * @param int $instanceId Vast.ai instance ID
   * @return array|null ['avg_util' => float, 'max_util' => float, 'per_gpu' => array, 'last_update' => int, 'age_seconds' => int, 'agent_id' => int, 'agent_name' => string] or null if no data
   */
  private function getAgentGpuStats($instanceId)
  {
    try {
      // Look up agent via RegVoucher
      $qF = new DBA\QueryFilter(DBA\RegVoucher::VAST_INSTANCE_ID, $instanceId, "=");
      $regVoucher = DBA\Factory::getRegVoucherFactory()->filter([DBA\Factory::FILTER => $qF], true);
      
      if (!$regVoucher) {
        return null;
      }
      
      $agentId = $regVoucher->getAgentId();
      if (!$agentId) {
        return null;
      }
      
      // Get agent
      $agent = DBA\Factory::getAgentFactory()->get($agentId);
      if (!$agent) {
        return null;
      }
      
      $qF1 = new DBA\QueryFilter(DBA\AgentStat::AGENT_ID, $agentId, "=");
      $qF2 = new DBA\QueryFilter(DBA\AgentStat::STAT_TYPE, DAgentStatsType::GPU_UTIL, "=");
      $qF3 = new DBA\QueryFilter(DBA\AgentStat::TIME, time() - 120, ">");
      $oF = new DBA\OrderFilter(DBA\AgentStat::TIME, "DESC");
      
      $gpuUtilStat = DBA\Factory::getAgentStatFactory()->filter([
        DBA\Factory::FILTER => [$qF1, $qF2, $qF3],
        DBA\Factory::ORDER => $oF
      ], true);
      
      if (!$gpuUtilStat) {
        return null;
      }
      
      $utilRawValue = $gpuUtilStat->getValue();
      $utilValues = explode(",", $utilRawValue);
      $utilValues = array_map('floatval', $utilValues);
      
      $avgUtil = array_sum($utilValues) / count($utilValues);
      $maxUtil = max($utilValues);
      
      return [
        'avg_util' => $avgUtil,
        'max_util' => $maxUtil,
        'per_gpu' => $utilValues,
        'raw_value' => $utilRawValue,
        'last_update' => $gpuUtilStat->getTime(),
        'age_seconds' => time() - $gpuUtilStat->getTime(),
        'agent_id' => $agentId,
        'agent_name' => $agent->getAgentName()
      ];
      
    } catch (Exception $e) {
      error_log("[VastHandler] Error fetching agent GPU stats for instance #{$instanceId}: " . $e->getMessage());
      return null;
    }
  }

  public function handle($action)
  {
    try {
      switch ($action) {

        case DVastAction::LIST_OFFERS:
          AccessControl::getInstance()->checkPermission(DVastAction::LIST_OFFERS_PERM);
          if (!$this->isAjaxRequest()) {
            throw new HTException("This action requires AJAX request.");
          }

          // Get filters from POST if provided
          $filters = isset($_POST['filters']) && is_array($_POST['filters']) ? $_POST['filters'] : [];

          // Search offers using utility
          $offers = VastUtils::searchOffers($filters);

          $this->sendJsonAndExit(['success' => true, 'offers' => $offers]);
          break;

        case DVastAction::CREATE_INSTANCE:
          AccessControl::getInstance()->checkPermission(DVastAction::CREATE_INSTANCE_PERM);
          if (!$this->isAjaxRequest()) {
            throw new HTException("This action requires AJAX request.");
          }

          $offerId = isset($_POST['offer_id']) ? intval($_POST['offer_id']) : 0;

          $options = [
            'label' => $_POST['label'] ?? null,
            'disk' => isset($_POST['disk']) ? floatval($_POST['disk']) : 10,
            'runtype' => $_POST['runtype'] ?? 'ssh',
          ];

          $optionalFields = ['env', 'jupyter_dir', 'use_jupyter_lab', 'python_utf8', 'lang_utf8', 'price'];
          foreach ($optionalFields as $field) {
            if (isset($_POST[$field])) {
              $options[$field] = $_POST[$field];
            }
          }

          $result = VastUtils::createInstance($offerId, $options);

          $this->sendJsonAndExit($result);
          break;

        case DVastAction::LIST_INSTANCES:
          AccessControl::getInstance()->checkPermission(DVastAction::LIST_INSTANCES_PERM);
          if (!$this->isAjaxRequest()) {
            throw new HTException("This action requires AJAX request.");
          }

          $instanceData = VastUtils::listInstances();

          $this->sendJsonAndExit([
            'success' => true,
            'instances' => $instanceData['instances'],
            'instances_found' => $instanceData['instances_found']
          ]);
          break;

        case DVastAction::DESTROY_INSTANCE:
          AccessControl::getInstance()->checkPermission(DVastAction::DESTROY_INSTANCE_PERM);
          if (!$this->isAjaxRequest()) {
            throw new HTException("This action requires AJAX request.");
          }

          $instanceId = isset($_POST['instance_id']) ? intval($_POST['instance_id']) : 0;

          $result = VastUtils::destroyInstance($instanceId);

          $this->sendJsonAndExit($result);
          break;

        case DVastAction::GET_USER_INFO:
          AccessControl::getInstance()->checkPermission(DVastAction::GET_USER_INFO_PERM);
          if (!$this->isAjaxRequest()) {
            throw new HTException("This action requires AJAX request.");
          }

          $userInfo = VastUtils::getUserInfo();

          $this->sendJsonAndExit([
            'success' => true,
            'user' => $userInfo
          ]);
          break;

        case DVastAction::AUTO_DESTROY_CHECK:
          AccessControl::getInstance()->checkPermission(DVastAction::AUTO_DESTROY_CHECK_PERM);
          if (!$this->isAjaxRequest()) {
            throw new HTException("This action requires AJAX request.");
          }

          $qF = new DBA\QueryFilter(DBA\Config::ITEM, DConfig::VAST_AUTO_DESTROY_ENABLE, "=");
          $configResult = DBA\Factory::getConfigFactory()->filter([DBA\Factory::FILTER => $qF]);
          $stuckDestroyEnabled = (sizeof($configResult) > 0) ? (bool)$configResult[0]->getValue() : false;

          $qF = new DBA\QueryFilter(DBA\Config::ITEM, DConfig::VAST_AUTO_DESTROY_TIMEOUT, "=");
          $configResult = DBA\Factory::getConfigFactory()->filter([DBA\Factory::FILTER => $qF]);
          $stuckTimeoutMinutes = (sizeof($configResult) > 0) ? (int)$configResult[0]->getValue() : 5;

          $qF = new DBA\QueryFilter(DBA\Config::ITEM, DConfig::VAST_AUTO_DESTROY_IDLE_ENABLE, "=");
          $configResult = DBA\Factory::getConfigFactory()->filter([DBA\Factory::FILTER => $qF]);
          $idleDestroyEnabled = (sizeof($configResult) > 0) ? (bool)$configResult[0]->getValue() : false;

          $qF = new DBA\QueryFilter(DBA\Config::ITEM, DConfig::VAST_AUTO_DESTROY_IDLE_TIMEOUT, "=");
          $configResult = DBA\Factory::getConfigFactory()->filter([DBA\Factory::FILTER => $qF]);
          $idleTimeoutMinutes = (sizeof($configResult) > 0) ? (int)$configResult[0]->getValue() : 30;

          $qF = new DBA\QueryFilter(DBA\Config::ITEM, DConfig::VAST_AUTO_DESTROY_GPU_THRESHOLD, "=");
          $configResult = DBA\Factory::getConfigFactory()->filter([DBA\Factory::FILTER => $qF]);
          $gpuThreshold = (sizeof($configResult) > 0) ? (float)$configResult[0]->getValue() : 5.0;

          if (!$stuckDestroyEnabled && !$idleDestroyEnabled) {
            $this->sendJsonAndExit([
              'success' => true,
              'destroyed' => [],
              'message' => 'Auto-destroy disabled'
            ]);
            break;
          }

          $currentTime = time();
          $destroyedInstances = [];

          // Get all instances
          $instanceData = VastUtils::listInstances();
          if (!isset($instanceData['instances'])) {
            $this->sendJsonAndExit(['success' => false, 'error' => 'Failed to fetch instances'], 500);
            break;
          }

          foreach ($instanceData['instances'] as $instance) {
            $instanceId = $instance['id'];
            $actualStatus = strtolower($instance['actual_status'] ?? 'unknown');
            $startDate = $instance['start_date'] ?? 0;

            $destroyReason = null;
            $idleDetails = [];

            if ($stuckDestroyEnabled && $actualStatus !== 'running' && $startDate > 0) {
              $uptime = $currentTime - $startDate;
              $stuckTimeoutSeconds = $stuckTimeoutMinutes * 60;

              if ($uptime >= $stuckTimeoutSeconds) {
                $destroyReason = "stuck in '{$actualStatus}' state for " . round($uptime / 60, 1) . " minutes";
              }
            }

            if ($idleDestroyEnabled && $actualStatus === 'running' && $startDate > 0 && !$destroyReason) {
              $uptime = $currentTime - $startDate;
              $idleTimeoutSeconds = $idleTimeoutMinutes * 60;

              // Only consider instances that have been running long enough
              if ($uptime >= $idleTimeoutSeconds) {
                $isIdle = false;
                $idleReasons = [];
                
                // PRIMARY: Get GPU utilization from Hashtopolis agent stats
                $agentGpuStats = $this->getAgentGpuStats($instanceId);
                
                if ($agentGpuStats !== null) {
                  // Hashtopolis agent data available
                  $avgUtil = $agentGpuStats['avg_util'];
                  $maxUtil = $agentGpuStats['max_util'];
                  $dataAge = $agentGpuStats['age_seconds'];
                  
                  error_log("[VastHandler] Instance #{$instanceId}: Hashtopolis GPU stats - Avg: {$avgUtil}%, Max: {$maxUtil}%, Age: {$dataAge}s");
                  
                  if ($dataAge < 120) {
                    if ($avgUtil < $gpuThreshold) {
                      $isIdle = true;
                      $idleReasons[] = "GPU avg: " . round($avgUtil, 1) . "% < {$gpuThreshold}%";
                      $idleDetails['gpu_util_source'] = 'hashtopolis';
                      $idleDetails['gpu_util_avg'] = round($avgUtil, 1);
                      $idleDetails['gpu_util_max'] = round($maxUtil, 1);
                      $idleDetails['gpu_util_per_device'] = $agentGpuStats['per_gpu'];
                      $idleDetails['gpu_data_age'] = $dataAge;
                      $idleDetails['agent_id'] = $agentGpuStats['agent_id'];
                      $idleDetails['agent_name'] = $agentGpuStats['agent_name'];
                    } else {
                      error_log("[VastHandler] Instance #{$instanceId}: GPU active (avg: {$avgUtil}%), not idle");
                    }
                  } else {
                    error_log("[VastHandler] Instance #{$instanceId}: Hashtopolis GPU data stale ({$dataAge}s old), falling back to Vast.ai");
                    $idleDetails['gpu_util_hashtopolis_stale'] = true;
                    $idleDetails['gpu_data_age'] = $dataAge;
                    
                    // FALLBACK: Use Vast.ai GPU data
                    $vastGpuUtil = isset($instance['gpu_util']) ? floatval($instance['gpu_util']) : null;
                    if ($vastGpuUtil !== null) {
                      if ($vastGpuUtil < $gpuThreshold) {
                        $isIdle = true;
                        $idleReasons[] = "GPU util (Vast.ai fallback): {$vastGpuUtil}% < {$gpuThreshold}%";
                        $idleDetails['gpu_util_source'] = 'vastai_fallback';
                        $idleDetails['gpu_util'] = $vastGpuUtil;
                      }
                    } else {
                      $idleDetails['gpu_util_status'] = 'unavailable';
                    }
                  }
                } else {
                  error_log("[VastHandler] Instance #{$instanceId}: No Hashtopolis agent data, using Vast.ai GPU data");
                  
                  $vastGpuUtil = isset($instance['gpu_util']) ? floatval($instance['gpu_util']) : null;
                  if ($vastGpuUtil !== null) {
                    if ($vastGpuUtil < $gpuThreshold) {
                      $isIdle = true;
                      $idleReasons[] = "GPU util (Vast.ai): {$vastGpuUtil}% < {$gpuThreshold}%";
                      $idleDetails['gpu_util_source'] = 'vastai';
                      $idleDetails['gpu_util'] = $vastGpuUtil;
                    }
                  } else {
                    $idleDetails['gpu_util_status'] = 'unavailable';
                  }
                }

                // Get agent info for additional logging
                if (!isset($idleDetails['agent_id'])) {
                  $qF1 = new DBA\QueryFilter(DBA\RegVoucher::VAST_INSTANCE_ID, $instanceId, "=");
                  $voucherFactory = DBA\Factory::getRegVoucherFactory();
                  $vouchers = $voucherFactory->filter([DBA\Factory::FILTER => $qF1]);

                  if (sizeof($vouchers) > 0) {
                    $voucher = $vouchers[0];
                    $linkedAgentId = $voucher->getAgentId();

                    if ($linkedAgentId !== null && $linkedAgentId > 0) {
                      $agentFactory = DBA\Factory::getAgentFactory();
                      $agent = $agentFactory->get($linkedAgentId);

                      if ($agent !== null) {
                        $lastActivity = $agent->getLastTime();
                        $inactiveDuration = $currentTime - $lastActivity;
                        
                        // Store agent info for logging only
                        $idleDetails['agent_id'] = $linkedAgentId;
                        $idleDetails['agent_name'] = $agent->getAgentName();
                        $idleDetails['agent_last_seen'] = date('Y-m-d H:i:s', $lastActivity);
                        $idleDetails['agent_inactive_minutes'] = round($inactiveDuration / 60, 1);
                        $idleDetails['agent_active'] = ($inactiveDuration < 60) ? 'yes' : 'no';
                      } else {
                        $idleDetails['agent_status'] = 'deleted';
                      }
                    } else {
                      $idleDetails['agent_status'] = 'voucher_unused';
                      $idleDetails['voucher'] = $voucher->getVoucher();
                    }
                  } else {
                    $idleDetails['agent_status'] = 'no_voucher';
                  }
                }

                // Destroy if GPU is idle
                if ($isIdle && count($idleReasons) > 0) {
                  $destroyReason = "idle (" . implode(' + ', $idleReasons) . ") for " . round($uptime / 60, 1) . " minutes";
                }
              }
            }

            if ($destroyReason !== null) {
              $destroyResult = VastUtils::destroyInstance($instanceId);

              if ($destroyResult['success']) {
                $destroyedInstances[] = [
                  'id' => $instanceId,
                  'status' => $actualStatus,
                  'reason' => $destroyReason,
                  'label' => $instance['label'] ?? 'N/A',
                  'details' => $idleDetails
                ];

                $logMessage = "Auto-destroyed Vast.ai instance #{$instanceId}: {$destroyReason}";
                if (!empty($idleDetails)) {
                  $logMessage .= " | Details: " . json_encode($idleDetails);
                }

                DServerLog::log(DServerLog::INFO, $logMessage);
              }
            }
          }

          $this->sendJsonAndExit([
            'success' => true,
            'destroyed' => $destroyedInstances,
            'checked' => count($instanceData['instances']),
            'config' => [
              'stuck_enabled' => $stuckDestroyEnabled,
              'stuck_timeout' => $stuckTimeoutMinutes,
              'idle_enabled' => $idleDestroyEnabled,
              'idle_timeout' => $idleTimeoutMinutes,
              'gpu_threshold' => $gpuThreshold
            ]
          ]);
          break;

        default:
          throw new HTException("Invalid action!");
      }
    } catch (HTException $e) {
      if ($this->isAjaxRequest()) {
        $this->sendJsonAndExit(['success' => false, 'error' => $e->getMessage()], 400);
      }
      UI::addMessage(UI::ERROR, $e->getMessage());
    }
  }
}