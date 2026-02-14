<?php

use DBA\QueryFilter;
use DBA\Config;
use DBA\Factory;

require_once(dirname(__FILE__) . "/inc/load.php");

if (!Login::getInstance()->isLoggedin()) {
  header("Location: index.php?err=1" . time() . "&fw=" . urlencode($_SERVER['PHP_SELF'] . "?" . $_SERVER['QUERY_STRING']));
  die();
}

AccessControl::getInstance()->checkPermission(DAccessControl::SERVER_CONFIG_ACCESS);

// Handle AJAX actions
if (isset($_POST['action']) || isset($_GET['action'])) {
  $action = isset($_POST['action']) ? $_POST['action'] : $_GET['action'];
  
  $ACTIONS = array(
    DVastAction::LIST_OFFERS => "listOffers",
    DVastAction::CREATE_INSTANCE => "createInstance",
    DVastAction::LIST_INSTANCES => "listInstances",
    DVastAction::GET_INSTANCE_AGENT_STATS => "getInstanceAgentStats",
    DVastAction::DESTROY_INSTANCE => "destroyInstance",
    DVastAction::GET_USER_INFO => "getUserInfo",
    DVastAction::AUTO_DESTROY_CHECK => "autoDestroyCheck",
  );
  
  if (array_key_exists($action, $ACTIONS)) {
    $handler = new VastHandler();
    $handler->handle($action);
    die(); // Important: prevent template rendering for AJAX
  }
}

// Render template for page load
Template::loadInstance("vast/index");
UI::add('pageTitle', "Vast.ai Cloud GPU Management");

// Load Vast.ai configuration using the same pattern as config.php
$apiKeyValue = '';
$imageValue = '';

// Get API Key
$qF = new QueryFilter(Config::ITEM, DConfig::VAST_API_KEY, "=");
$result = Factory::getConfigFactory()->filter([Factory::FILTER => $qF]);
if (sizeof($result) > 0) {
  $apiKeyValue = $result[0]->getValue();
}

// Get Image
$qF = new QueryFilter(Config::ITEM, DConfig::VAST_IMAGE, "=");
$result = Factory::getConfigFactory()->filter([Factory::FILTER => $qF]);
if (sizeof($result) > 0) {
  $imageValue = $result[0]->getValue();
}

UI::add('vastApiKey', $apiKeyValue);
UI::add('vastImage', $imageValue);
UI::add('vastConfigured', !empty($apiKeyValue) && !empty($imageValue));

echo Template::getInstance()->render(UI::getObjects());