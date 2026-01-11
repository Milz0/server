<?php

class ConfigHandler implements Handler {
  public function __construct($configId = null) {
    //we need nothing to load
  }

  private function isAjaxRequest() {
    return (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest');
  }

  private function sendJsonAndExit($arr, $httpCode = 200) {
    if (!headers_sent()) {
      http_response_code($httpCode);
      header('Content-Type: application/json; charset=utf-8');
      header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
      header('Pragma: no-cache');
    }
    echo json_encode($arr);
    die();
  }

  public function handle($action) {
    try {
      switch ($action) {
        case DConfigAction::UPDATE_CONFIG:
          AccessControl::getInstance()->checkPermission(DConfigAction::UPDATE_CONFIG_PERM);
          ConfigUtils::updateConfig($_POST);
          UI::addMessage(UI::SUCCESS, "Config was updated!");
          break;
        case DConfigAction::TEST_OBJECT_STORAGE:
          AccessControl::getInstance()->checkPermission(DConfigAction::TEST_OBJECT_STORAGE_PERM);
          if ($this->isAjaxRequest()) {
            $ret = ConfigUtils::testObjectStorage($_POST);
            if (!is_array($ret)) {
              $ret = ['ok' => true, 'steps' => []];
            }
            if (!isset($ret['ok'])) {
              $ret['ok'] = true;
            }
            if (!isset($ret['steps'])) {
              $ret['steps'] = [];
            }
            $this->sendJsonAndExit($ret, 200);
          }

          ConfigUtils::testObjectStorage($_POST);
          UI::addMessage(UI::SUCCESS, "Object storage test succeeded. You can now save these settings.");
          break;
        case DConfigAction::RESET_OBJECT_STORAGE:
          AccessControl::getInstance()->checkPermission(DConfigAction::RESET_OBJECT_STORAGE_PERM);
          ConfigUtils::resetObjectStorageProfile();
          UI::addMessage(UI::SUCCESS, "Object Storage profile was deleted (reset to defaults).");
          break;
        case DConfigAction::REBUILD_CACHE:
          AccessControl::getInstance()->checkPermission(DConfigAction::REBUILD_CACHE_PERM);
          $ret = ConfigUtils::rebuildCache();
          UI::addMessage(UI::SUCCESS, "Updated all chunks and hashlists. Corrected " . $ret[0] . " chunks and " . $ret[1] . " hashlists.");
          break;
        case DConfigAction::RESCAN_FILES:
          AccessControl::getInstance()->checkPermission(DConfigAction::RESCAN_FILES_PERM);
          ConfigUtils::scanFiles();
          UI::addMessage(UI::SUCCESS, "File scan was successfull, no actions required!");
          break;
        case DConfigAction::CLEAR_ALL:
          AccessControl::getInstance()->checkPermission(DConfigAction::CLEAR_ALL_PERM);
          ConfigUtils::clearAll(Login::getInstance()->getUser());
          break;
        default:
          UI::addMessage(UI::ERROR, "Invalid action!");
          break;
      }
    }
    catch (HTException $e) {
      if ($action === DConfigAction::TEST_OBJECT_STORAGE && $this->isAjaxRequest()) {
        $this->sendJsonAndExit([
          'ok' => false,
          'error' => $e->getMessage(),
          'steps' => []
        ], 200);
      }
      UI::addMessage(UI::ERROR, $e->getMessage());
    }
    catch (HTMessages $m) {
      if ($action === DConfigAction::TEST_OBJECT_STORAGE && $this->isAjaxRequest()) {
        $this->sendJsonAndExit([
          'ok' => false,
          'error' => strip_tags($m->getHTMLMessage()),
          'steps' => []
        ], 200);
      }
      UI::addMessage(UI::ERROR, $m->getHTMLMessage());
    }
  }
}