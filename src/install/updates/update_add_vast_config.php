<?php /** @noinspection PhpUnused */

use DBA\Config;
use DBA\ConfigSection;
use DBA\Factory;
use DBA\QueryFilter;

require_once(dirname(__FILE__) . "/../../inc/defines/config.php");

if (!isset($PRESENT["vast_integration_config"])) {
  $sectionId = 9;

  $section = Factory::getConfigSectionFactory()->get($sectionId);
  if ($section === null) {
    $section = new ConfigSection($sectionId, "Vast.ai");
    Factory::getConfigSectionFactory()->save($section);
  }

  $defaults = [
    DConfig::VAST_API_KEY  => "",
    DConfig::VAST_IMAGE    => "",
  ];

  foreach ($defaults as $item => $value) {
    $qF = new QueryFilter(Config::ITEM, $item, "=");
    $existing = Factory::getConfigFactory()->filter([Factory::FILTER => $qF], true);
    if ($existing === null) {
      Factory::getConfigFactory()->save(new Config(null, $sectionId, $item, $value));
    }
  }

  $EXECUTED["vast_integration_config"] = true;
}