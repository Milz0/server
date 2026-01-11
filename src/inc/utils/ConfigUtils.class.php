<?php

use DBA\File;
use DBA\User;
use DBA\Task;
use DBA\Chunk;
use DBA\JoinFilter;
use DBA\QueryFilter;
use DBA\Hash;
use DBA\Hashlist;
use DBA\Config;
use DBA\ConfigSection;
use DBA\Factory;

class ConfigUtils {
  private static function objectStorageFingerprintFromPost($arr)
  {
    $fields = [
      'config_' . DConfig::OBJECT_STORAGE_ENDPOINT,
      'config_' . DConfig::OBJECT_STORAGE_REGION,
      'config_' . DConfig::OBJECT_STORAGE_BUCKET,
      'config_' . DConfig::OBJECT_STORAGE_ACCESS_KEY,
      'config_' . DConfig::OBJECT_STORAGE_SECRET_KEY,
      'config_' . DConfig::OBJECT_STORAGE_PREFIX,
      'config_' . DConfig::OBJECT_STORAGE_PATH_STYLE,
      'config_' . DConfig::OBJECT_STORAGE_VERIFY_SSL,
    ];

    $payload = [];
    foreach ($fields as $f) {
      $payload[$f] = isset($arr[$f]) ? trim(strval($arr[$f])) : "";
    }

    return hash('sha256', json_encode($payload));
  }

  private static function objectStorageFingerprintFromCurrent()
  {
    $payload = [
      'config_' . DConfig::OBJECT_STORAGE_ENDPOINT    => trim(strval(SConfig::getInstance()->getVal(DConfig::OBJECT_STORAGE_ENDPOINT))),
      'config_' . DConfig::OBJECT_STORAGE_REGION      => trim(strval(SConfig::getInstance()->getVal(DConfig::OBJECT_STORAGE_REGION))),
      'config_' . DConfig::OBJECT_STORAGE_BUCKET      => trim(strval(SConfig::getInstance()->getVal(DConfig::OBJECT_STORAGE_BUCKET))),
      'config_' . DConfig::OBJECT_STORAGE_ACCESS_KEY  => trim(strval(SConfig::getInstance()->getVal(DConfig::OBJECT_STORAGE_ACCESS_KEY))),
      'config_' . DConfig::OBJECT_STORAGE_SECRET_KEY  => trim(strval(SConfig::getInstance()->getVal(DConfig::OBJECT_STORAGE_SECRET_KEY))),
      'config_' . DConfig::OBJECT_STORAGE_PREFIX      => trim(strval(SConfig::getInstance()->getVal(DConfig::OBJECT_STORAGE_PREFIX))),
      'config_' . DConfig::OBJECT_STORAGE_PATH_STYLE  => strval(intval(SConfig::getInstance()->getVal(DConfig::OBJECT_STORAGE_PATH_STYLE))),
      'config_' . DConfig::OBJECT_STORAGE_VERIFY_SSL  => strval(intval(SConfig::getInstance()->getVal(DConfig::OBJECT_STORAGE_VERIFY_SSL))),
    ];

    return hash('sha256', json_encode($payload));
  }

  private static function objectStoragePostIndicatesEnabled($arr)
  {
    $k = 'config_' . DConfig::OBJECT_STORAGE_ENABLE;
    if (!isset($arr[$k])) {
      return false;
    }
    return intval($arr[$k]) === 1;
  }

  private static function objectStorageHasAnyPostedFields($arr)
  {
    foreach ($arr as $k => $v) {
      if (strpos($k, 'config_objectStorage') === 0) {
        return true;
      }
    }
    return false;
  }

  public static function testObjectStorage($arr)
  {
    $cfg = ObjectStorageUtils::getCfgFromPost($arr);

    if (intval($cfg['enabled']) !== 1) {
      $_SESSION['objstore_test_ok'] = 0;
      unset($_SESSION['objstore_test_fp'], $_SESSION['objstore_test_ts']);

      return [
        'ok' => true,
        'skipped' => true,
        'reason' => 'disabled',
        'error' => null,
        'steps' => [
          ['name' => 'disabled', 'ok' => true],
        ]
      ];
    }

    $steps = ObjectStorageUtils::testConnection($cfg);

    $_SESSION['objstore_test_ok'] = 1;
    $_SESSION['objstore_test_fp'] = self::objectStorageFingerprintFromPost($arr);
    $_SESSION['objstore_test_ts'] = time();

    return [
      'ok' => true,
      'error' => null,
      'steps' => (is_array($steps) ? $steps : [])
    ];
  }
  /**
   * @param Config $config
   * @param boolean $new
   * @throws HTException
   */
  public static function set($config, $new) {
    if ($config->getItem() == DConfig::MULTICAST_ENABLE && $config->getValue()) {
      // multicast was ticked to enable -> start runner
      RunnerUtils::startService();
    }
    else if ($config->getItem() == DConfig::MULTICAST_ENABLE && !$config->getValue()) {
      // multicast was ticked to disable -> stop runner
      RunnerUtils::stopService();
    }

    if ($new) {
      Factory::getConfigFactory()->save($config);
    }
    else {
      Factory::getConfigFactory()->update($config);
    }
  }

  /**
   * @param string $item
   * @return Config
   * @throws HTException
   */
  public static function get($item) {
    $qF = new QueryFilter(Config::ITEM, $item, "=");
    $config = Factory::getConfigFactory()->filter([Factory::FILTER => $qF], true);
    if ($config == null) {
      throw new HTException("Item not found!");
    }
    return $config;
  }

  /**
   * @return ConfigSection[]
   */
  public static function getSections() {
    return Factory::getConfigSectionFactory()->filter([]);
  }

  /**
   * @return Config[]
   */
  public static function getAll() {
    return Factory::getConfigFactory()->filter([]);
  }

  /**
   * @param array $arr
   * @throws HTException
   */
  public static function updateConfig($arr) {
    $osPosted = self::objectStorageHasAnyPostedFields($arr);

    $currentlyEnabled = (intval(SConfig::getInstance()->getVal(DConfig::OBJECT_STORAGE_ENABLE)) === 1);
    $postEnabled = self::objectStoragePostIndicatesEnabled($arr);

    $requiresTest = false;

    if ($osPosted) {
      $isDisabling = ($currentlyEnabled && !$postEnabled);
      $isEnabling  = (!$currentlyEnabled && $postEnabled);

      if ($isDisabling) {
        $requiresTest = false;
      } else if ($isEnabling) {
        $requiresTest = true;
      } else if ($postEnabled) {
        $currentFp = self::objectStorageFingerprintFromCurrent();
        $postFp    = self::objectStorageFingerprintFromPost($arr);
        $requiresTest = !hash_equals($currentFp, $postFp);
      }
    }

    if ($requiresTest) {
      $fp = self::objectStorageFingerprintFromPost($arr);
      $ok = (isset($_SESSION['objstore_test_ok']) && intval($_SESSION['objstore_test_ok']) === 1);
      $fpOk = (isset($_SESSION['objstore_test_fp']) && hash_equals($_SESSION['objstore_test_fp'], $fp));

      if (!$ok || !$fpOk) {
        throw new HTException("Object storage test must pass before saving. Click 'Test connection (write)' and ensure it succeeds.");
      }
    }
    foreach ($arr as $item => $val) {
      if (substr($item, 0, 7) == "config_") {
        $name = substr($item, 7);
        if (SConfig::getInstance()->getVal($name) == $val) {
          continue; // the value was not changed, so we don't need to update it
        }

        $qF = new QueryFilter(Config::ITEM, $name, "=");
        $config = Factory::getConfigFactory()->filter([Factory::FILTER => $qF], true);
        if ($config == null) {
          $config = new Config(null, 5, $name, $val);
          Factory::getConfigFactory()->save($config);
        }
        else {
          if ($name == DConfig::HASH_MAX_LENGTH) {
            $limit = intval($val);
            if (!Util::setMaxHashLength($limit)) {
              throw new HTException("Failed to update max hash length!");
            }
          }
          else if ($name == DConfig::PLAINTEXT_MAX_LENGTH) {
            $limit = intval($val);
            if (!Util::setPlaintextMaxLength($limit)) {
              throw new HTException("Failed to update max plaintext length!");
            }
          }
          SConfig::getInstance()->addValue($name, $val);
          $config->setValue($val);
          ConfigUtils::set($config, false);
        }
      }
    }
    if ($osPosted) {
      $_SESSION['objstore_test_ok'] = 0;
      unset($_SESSION['objstore_test_fp']);
      unset($_SESSION['objstore_test_ts']);
    }

    SConfig::reload();
    UI::add('config', SConfig::getInstance());
  }

  public static function resetObjectStorageProfile()
  {
    $_SESSION['objstore_test_ok'] = 0;
    unset($_SESSION['objstore_test_fp']);
    unset($_SESSION['objstore_test_ts']);

    try {
      $qF = new QueryFilter(Config::ITEM, 'objectStorageProvider', "=");
      $legacy = Factory::getConfigFactory()->filter([Factory::FILTER => $qF], true);
      if ($legacy != null) {
        Factory::getConfigFactory()->delete($legacy);
      }
    } catch (Exception $e) {
    }

    $defaults = [
      DConfig::OBJECT_STORAGE_ENABLE      => "0",
      DConfig::OBJECT_STORAGE_ENDPOINT    => "",
      DConfig::OBJECT_STORAGE_REGION      => "",
      DConfig::OBJECT_STORAGE_BUCKET      => "",
      DConfig::OBJECT_STORAGE_ACCESS_KEY  => "",
      DConfig::OBJECT_STORAGE_SECRET_KEY  => "",
      DConfig::OBJECT_STORAGE_PREFIX      => "",
      DConfig::OBJECT_STORAGE_PATH_STYLE  => "0",
      DConfig::OBJECT_STORAGE_VERIFY_SSL  => "1",
      DConfig::OBJECT_STORAGE_PRESIGN_TTL => "60",
      DConfig::OBJECT_STORAGE_DEFAULT_SRC => "local",
    ];

    $sectionId = 8;

    foreach ($defaults as $name => $val) {
      $qF = new QueryFilter(Config::ITEM, $name, "=");
      $config = Factory::getConfigFactory()->filter([Factory::FILTER => $qF], true);

      if ($config == null) {
        $config = new Config(null, $sectionId, $name, $val);
        Factory::getConfigFactory()->save($config);
      } else {
        $config->setValue($val);
        ConfigUtils::set($config, false);
      }

      SConfig::getInstance()->addValue($name, $val);
    }
    SConfig::reload();
    UI::add('config', SConfig::getInstance());
  }

  /**
   * @return int[]
   */
  public static function rebuildCache() {
    $correctedChunks = 0;
    $correctedHashlists = 0;

    //check chunks
    Factory::getAgentFactory()->getDB()->beginTransaction();
    $taskWrappers = Factory::getTaskWrapperFactory()->filter([]);
    foreach ($taskWrappers as $taskWrapper) {
      $hashlists = Util::checkSuperHashlist(Factory::getHashlistFactory()->get($taskWrapper->getHashlistId()));

      $jF = new JoinFilter(Factory::getTaskFactory(), Task::TASK_ID, Chunk::TASK_ID, Factory::getChunkFactory());
      $qF = new QueryFilter(Task::TASK_WRAPPER_ID, $taskWrapper->getId(), "=", Factory::getTaskFactory());
      $joined = Factory::getChunkFactory()->filter([Factory::JOIN => $jF, Factory::FILTER => $qF]);
      /** @var $chunks Chunk[] */
      $chunks = $joined[Factory::getChunkFactory()->getModelName()];

      foreach ($chunks as $chunk) {
        $hashFactory = ($hashlists[0]->getFormat() == DHashlistFormat::PLAIN) ? Factory::getHashFactory() : Factory::getHashBinaryFactory();
        $qF1 = new QueryFilter(Hash::CHUNK_ID, $chunk->getId(), "=");
        $qF2 = new QueryFilter(Hash::IS_CRACKED, "1", "=");
        $count = $hashFactory->countFilter([Factory::FILTER => [$qF1, $qF2]]);
        if ($count != $chunk->getCracked()) {
          $correctedChunks++;
          Factory::getChunkFactory()->set($chunk, Chunk::CRACKED, $count);
        }
      }
    }
    Factory::getAgentFactory()->getDB()->commit();

    //check hashlists
    Factory::getAgentFactory()->getDB()->beginTransaction();
    $qF = new QueryFilter(Hashlist::FORMAT, DHashlistFormat::SUPERHASHLIST, "<>");
    $hashlists = Factory::getHashlistFactory()->filter([Factory::FILTER => $qF]);
    foreach ($hashlists as $hashlist) {
      $qF1 = new QueryFilter(Hash::HASHLIST_ID, $hashlist->getId(), "=");
      $qF2 = new QueryFilter(Hash::IS_CRACKED, "1", "=");
      $hashFactory = Factory::getHashFactory();
      if ($hashlist->getFormat() != DHashlistFormat::PLAIN) {
        $hashFactory = Factory::getHashBinaryFactory();
      }
      $count = $hashFactory->countFilter([Factory::FILTER => [$qF1, $qF2]]);
      if ($count != $hashlist->getCracked()) {
        $correctedHashlists++;
        Factory::getHashlistFactory()->set($hashlist, Hashlist::CRACKED, $count);
      }
    }
    Factory::getAgentFactory()->getDB()->commit();

    //check superhashlists
    Factory::getAgentFactory()->getDB()->beginTransaction();
    $qF = new QueryFilter(Hashlist::FORMAT, DHashlistFormat::SUPERHASHLIST, "=");
    $superHashlists = Factory::getHashlistFactory()->filter([Factory::FILTER => $qF]);
    foreach ($superHashlists as $superHashlist) {
      $hashlists = Util::checkSuperHashlist($superHashlist);
      $cracked = 0;
      foreach ($hashlists as $hashlist) {
        $cracked += $hashlist->getCracked();
      }
      if ($cracked != $superHashlist->getCracked()) {
        $correctedHashlists++;
        Factory::getHashlistFactory()->set($superHashlist, Hashlist::CRACKED, $cracked);
      }
    }
    Factory::getAgentFactory()->getDB()->commit();

    return [$correctedChunks, $correctedHashlists];
  }

  /**
   * @throws HTMessages
   */
  public static function scanFiles() {
    $allOk = true;
    $messages = [];
    $files = Factory::getFileFactory()->filter([]);
    foreach ($files as $file) {
      $absolutePath = Factory::getStoredValueFactory()->get(DDirectories::FILES)->getVal() . "/" . $file->getFilename();
      if (!file_exists($absolutePath)) {
        $messages[] = "File " . $file->getFilename() . " does not exist!";
        $allOk = false;
        continue;
      }
      $size = Util::filesize($absolutePath);
      if ($size == -1) {
        $allOk = false;
        $messages[] = "Failed to determine file size of " . $file->getFilename();
      }
      else if ($size != $file->getSize()) {
        $allOk = false;
        $messages[] = "File size mismatch of " . $file->getFilename() . ", will be corrected.";
        Factory::getFileFactory()->set($file, File::SIZE, $size);
      }
    }
    if (!$allOk) {
      throw new HTMessages($messages);
    }
  }

  /**
   * @param User $user
   */
  public static function clearAll($user) {
    Factory::getAgentFactory()->getDB()->beginTransaction();
    Factory::getHashFactory()->massDeletion([]);
    Factory::getHashBinaryFactory()->massDeletion([]);
    Factory::getAssignmentFactory()->massDeletion([]);
    Factory::getAgentErrorFactory()->massDeletion([]);
    Factory::getChunkFactory()->massDeletion([]);
    Factory::getZapFactory()->massDeletion([]);
    Factory::getFileTaskFactory()->massDeletion([]);
    Factory::getTaskFactory()->massDeletion([]);
    Factory::getTaskWrapperFactory()->massDeletion([]);
    Factory::getHashlistHashlistFactory()->massDeletion([]);
    Factory::getHashlistFactory()->massDeletion([]);
    Factory::getAgentFactory()->getDB()->commit();
    Util::createLogEntry("User", $user->getId(), DLogEntry::WARN, "Complete clear was executed!");
  }
}