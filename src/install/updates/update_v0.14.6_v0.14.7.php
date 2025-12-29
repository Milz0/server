<?php /** @noinspection SqlNoDataSourceInspection */

use DBA\Config;
use DBA\Factory;
use DBA\QueryFilter;

if (!isset($TEST)) {
  require_once(dirname(__FILE__) . "/../../inc/confv2.php");
  require_once(dirname(__FILE__) . "/../../inc/info.php");
  require_once(dirname(__FILE__) . "/../../dba/init.php");
  require_once(dirname(__FILE__) . "/../../inc/Util.class.php");
}

require_once(dirname(__FILE__) . "/../../inc/defines/config.php");

if (!isset($PRESENT["v0.14.7_fileOffload"])) {

  $section = Factory::getConfigSectionFactory()->get(8);
  if ($section === null) {
    Factory::getAgentFactory()->getDB()->query(
      "INSERT INTO `ConfigSection` (`configSectionId`, `sectionName`) VALUES (8, 'File Offload');"
    );
  }

  $items = [
    DConfig::FILE_OFFLOAD_BASE_URL => '',
    DConfig::FILE_OFFLOAD_SECRET => '',
    DConfig::FILE_OFFLOAD_EXPIRY => '300'
  ];

  foreach ($items as $item => $value) {
    $qF = new QueryFilter(Config::ITEM, $item, "=");
    $existing = Factory::getConfigFactory()->filter([Factory::FILTER => $qF], true);
    if (!$existing) {
      $config = new Config(null, 8, $item, $value);
      Factory::getConfigFactory()->save($config);
    }
  }

  $EXECUTED["v0.14.7_fileOffload"] = true;
}
