<?php

class DConfigType {
  const STRING_INPUT = "string";
  const NUMBER_INPUT = "number";
  const TICKBOX      = "checkbox";
  const EMAIL        = "email";
  const SELECT       = "select";
}

class DConfigAction {
  const UPDATE_CONFIG      = "updateConfig";
  const UPDATE_CONFIG_PERM = DAccessControl::SERVER_CONFIG_ACCESS;

  const REBUILD_CACHE      = "rebuildCache";
  const REBUILD_CACHE_PERM = DAccessControl::SERVER_CONFIG_ACCESS;

  const RESCAN_FILES      = "rescanFiles";
  const RESCAN_FILES_PERM = DAccessControl::SERVER_CONFIG_ACCESS;

  const CLEAR_ALL      = "clearAll";
  const CLEAR_ALL_PERM = DAccessControl::SERVER_CONFIG_ACCESS;

  const TEST_OBJECT_STORAGE      = "testObjectStorage";
  const TEST_OBJECT_STORAGE_PERM = DAccessControl::SERVER_CONFIG_ACCESS;

  const RESET_OBJECT_STORAGE      = "resetObjectStorage";
  const RESET_OBJECT_STORAGE_PERM = DAccessControl::SERVER_CONFIG_ACCESS;
}

class DProxyTypes {
  const HTTP   = 'HTTP';
  const HTTPS  = 'HTTPS';
  const SOCKS4 = 'SOCKS4';
  const SOCKS5 = 'SOCKS5';
}

// used config values
class DConfig {
  // Section: Cracking/Tasks
  const BENCHMARK_TIME         = "benchtime";
  const CHUNK_DURATION         = "chunktime";
  const CHUNK_TIMEOUT          = "chunktimeout";
  const AGENT_TIMEOUT          = "agenttimeout";
  const FIELD_SEPARATOR        = "fieldseparator";
  const HASHLIST_ALIAS         = "hashlistAlias";
  const STATUS_TIMER           = "statustimer";
  const BLACKLIST_CHARS        = "blacklistChars";
  const DISP_TOLERANCE         = "disptolerance";
  const DEFAULT_BENCH          = "defaultBenchmark";
  const RULE_SPLIT_SMALL_TASKS = "ruleSplitSmallTasks";
  const RULE_SPLIT_ALWAYS      = "ruleSplitAlways";
  const RULE_SPLIT_DISABLE     = "ruleSplitDisable";
  const AGENT_DATA_LIFETIME    = "agentDataLifetime";
  const DISABLE_TRIMMING       = "disableTrimming";
  const PRIORITY_0_START       = "priority0Start";
  const HASHCAT_BRAIN_ENABLE   = "hashcatBrainEnable";
  const HASHCAT_BRAIN_HOST     = "hashcatBrainHost";
  const HASHCAT_BRAIN_PORT     = "hashcatBrainPort";
  const HASHCAT_BRAIN_PASS     = "hashcatBrainPass";
  const HASHLIST_IMPORT_CHECK  = "hashlistImportCheck";
  const HC_ERROR_IGNORE        = "hcErrorIgnore";

  // Section: Yubikey
  const YUBIKEY_ID  = "yubikey_id";
  const YUBIKEY_KEY = "yubikey_key";
  const YUBIKEY_URL = "yubikey_url";

  // Section: Finetuning
  const HASHES_PAGE_SIZE           = "pagingSize";
  const NUMBER_LOGENTRIES          = "numLogEntries";
  const BATCH_SIZE                 = "batchSize";
  const PLAINTEXT_MAX_LENGTH       = "plainTextMaxLength";
  const HASH_MAX_LENGTH            = "hashMaxLength";
  const MAX_HASHLIST_SIZE          = "maxHashlistSize";
  const UAPI_SEND_TASK_IS_COMPLETE = "uApiSendTaskIsComplete";

  // Section: UI
  const TIME_FORMAT            = "timefmt";
  const DONATE_OFF             = "donateOff";
  const HIDE_IMPORT_MASKS      = "hideImportMasks";
  const HASHES_PER_PAGE        = "hashesPerPage";
  const HIDE_IP_INFO           = "hideIpInfo";
  const SHOW_TASK_PERFORMANCE  = "showTaskPerformance";
  const AGENT_STAT_LIMIT       = "agentStatLimit";
  const AGENT_STAT_TENSION     = "agentStatTension";
  const MAX_SESSION_LENGTH     = "maxSessionLength";
  const AGENT_TEMP_THRESHOLD_1 = "agentTempThreshold1";
  const AGENT_TEMP_THRESHOLD_2 = "agentTempThreshold2";
  const AGENT_UTIL_THRESHOLD_1 = "agentUtilThreshold1";
  const AGENT_UTIL_THRESHOLD_2 = "agentUtilThreshold2";

  // Section: Server
  const BASE_URL          = "baseUrl";
  const BASE_HOST         = "baseHost";
  const EMAIL_SENDER      = "emailSender";
  const EMAIL_SENDER_NAME = "emailSenderName";
  const CONTACT_EMAIL     = "contactEmail";
  const VOUCHER_DELETION  = "voucherDeletion";
  const S_NAME            = "jeSuisHashtopussy";
  const SERVER_LOG_LEVEL  = "serverLogLevel";
  const ALLOW_DEREGISTER  = "allowDeregister";

  // Section: Multicast
  const MULTICAST_ENABLE    = "multicastEnable";
  const MULTICAST_DEVICE    = "multicastDevice";
  const MULTICAST_TR_ENABLE = "multicastTransferRateEnable";
  const MULTICAST_TR        = "multicastTranserRate";

  // Section: Notifications
  const NOTIFICATIONS_PROXY_ENABLE = "notificationsProxyEnable";
  const TELEGRAM_BOT_TOKEN         = "telegramBotToken";
  const NOTIFICATIONS_PROXY_SERVER = "notificationsProxyServer";
  const NOTIFICATIONS_PROXY_PORT   = "notificationsProxyPort";
  const NOTIFICATIONS_PROXY_TYPE   = "notificationsProxyType";

  // Section: Object Storage (S3 compatible)
  const OBJECT_STORAGE_ENABLE        = "objectStorageEnable";
  const OBJECT_STORAGE_ENDPOINT      = "objectStorageEndpoint";
  const OBJECT_STORAGE_REGION        = "objectStorageRegion";
  const OBJECT_STORAGE_BUCKET        = "objectStorageBucket";
  const OBJECT_STORAGE_ACCESS_KEY    = "objectStorageAccessKey";
  const OBJECT_STORAGE_SECRET_KEY    = "objectStorageSecretKey";
  const OBJECT_STORAGE_PREFIX        = "objectStoragePrefix";
  const OBJECT_STORAGE_PATH_STYLE    = "objectStoragePathStyle";
  const OBJECT_STORAGE_VERIFY_SSL    = "objectStorageVerifySSL";
  const OBJECT_STORAGE_PRESIGN_TTL   = "objectStoragePresignTTL";
  const OBJECT_STORAGE_DEFAULT_SRC   = "objectStorageDefaultSource";

  static function getConstants()
  {
    try {
      $oClass = new ReflectionClass(__CLASS__);
    }
    catch (ReflectionException $e) {
      die("Exception: " . $e->getMessage());
    }
    return $oClass->getConstants();
  }

  /**
   * Gives the selection for the configuration values which are selections.
   * @param string $config
   * @return DataSet
   */
  public static function getSelection($config) {
    switch ($config) {
      case DConfig::NOTIFICATIONS_PROXY_TYPE:
        return new DataSet([
            DProxyTypes::HTTP => DProxyTypes::HTTP,
            DProxyTypes::HTTPS => DProxyTypes::HTTPS,
            DProxyTypes::SOCKS4 => DProxyTypes::SOCKS4,
            DProxyTypes::SOCKS5 => DProxyTypes::SOCKS5
          ]
        );
      case DConfig::SERVER_LOG_LEVEL:
        return new DataSet([
            DServerLog::TRACE => "TRACE",
            DServerLog::DEBUG => "DEBUG",
            DServerLog::INFO => "INFO",
            DServerLog::WARNING => "WARNING",
            DServerLog::ERROR => "ERROR",
            DServerLog::FATAL => "FATAL"
          ]
        );

      case DConfig::OBJECT_STORAGE_DEFAULT_SRC:
        return new DataSet([
            "local" => "Local server",
            "remote" => "Remote bucket (pre-signed)",
          ]
        );
    }
    return new DataSet(["Not found!"]);
  }

  /**
   * Gives the format which a config input should have. Default is string if it's not a known config.
   * @param $config string
   * @return string
   */
  public static function getConfigType($config) {
    switch ($config) {
      case DConfig::BENCHMARK_TIME:
        return DConfigType::NUMBER_INPUT;
      case DConfig::CHUNK_DURATION:
        return DConfigType::NUMBER_INPUT;
      case DConfig::CHUNK_TIMEOUT:
        return DConfigType::NUMBER_INPUT;
      case DConfig::AGENT_TIMEOUT:
        return DConfigType::NUMBER_INPUT;
      case DConfig::HASHES_PAGE_SIZE:
        return DConfigType::NUMBER_INPUT;
      case DConfig::FIELD_SEPARATOR:
        return DConfigType::STRING_INPUT;
      case DConfig::HASHLIST_ALIAS:
        return DConfigType::STRING_INPUT;
      case DConfig::STATUS_TIMER:
        return DConfigType::NUMBER_INPUT;
      case DConfig::BLACKLIST_CHARS:
        return DConfigType::STRING_INPUT;
      case DConfig::NUMBER_LOGENTRIES:
        return DConfigType::NUMBER_INPUT;
      case DConfig::TIME_FORMAT:
        return DConfigType::STRING_INPUT;
      case DConfig::BASE_URL:
        return DConfigType::STRING_INPUT;
      case Dconfig::DISP_TOLERANCE:
        return DConfigType::NUMBER_INPUT;
      case DConfig::BATCH_SIZE:
        return DConfigType::NUMBER_INPUT;
      case DConfig::BASE_HOST:
        return DConfigType::STRING_INPUT;
      case DConfig::DONATE_OFF:
        return DConfigType::TICKBOX;
      case DConfig::PLAINTEXT_MAX_LENGTH:
        return DConfigType::NUMBER_INPUT;
      case DConfig::HASH_MAX_LENGTH:
        return DConfigType::NUMBER_INPUT;
      case DConfig::EMAIL_SENDER:
        return DConfigType::EMAIL;
      case DConfig::MAX_HASHLIST_SIZE:
        return DConfigType::NUMBER_INPUT;
      case DConfig::HIDE_IMPORT_MASKS:
        return DConfigType::TICKBOX;
      case DConfig::TELEGRAM_BOT_TOKEN:
        return DConfigType::STRING_INPUT;
      case DConfig::CONTACT_EMAIL:
        return DConfigType::EMAIL;
      case DConfig::VOUCHER_DELETION:
        return DConfigType::TICKBOX;
      case DConfig::HASHES_PER_PAGE:
        return DConfigType::NUMBER_INPUT;
      case DConfig::HIDE_IP_INFO:
        return DConfigType::TICKBOX;
      case DConfig::EMAIL_SENDER_NAME:
        return DConfigType::STRING_INPUT;
      case DConfig::DEFAULT_BENCH:
        return DConfigType::TICKBOX;
      case DConfig::SHOW_TASK_PERFORMANCE:
        return DConfigType::TICKBOX;
      case DConfig::RULE_SPLIT_ALWAYS:
        return DConfigType::TICKBOX;
      case DConfig::RULE_SPLIT_SMALL_TASKS:
        return DConfigType::TICKBOX;
      case DConfig::RULE_SPLIT_DISABLE:
        return DConfigType::TICKBOX;
      case DConfig::AGENT_STAT_LIMIT:
        return DConfigType::NUMBER_INPUT;
      case DConfig::AGENT_DATA_LIFETIME:
        return DConfigType::NUMBER_INPUT;
      case DConfig::AGENT_STAT_TENSION:
        return DConfigType::TICKBOX;
      case DConfig::MULTICAST_ENABLE:
        return DConfigType::TICKBOX;
      case DConfig::MULTICAST_DEVICE:
        return DConfigType::STRING_INPUT;
      case DConfig::MULTICAST_TR_ENABLE:
        return DConfigType::TICKBOX;
      case DConfig::MULTICAST_TR:
        return DConfigType::NUMBER_INPUT;
      case DConfig::NOTIFICATIONS_PROXY_ENABLE:
        return DConfigType::TICKBOX;
      case DConfig::NOTIFICATIONS_PROXY_PORT:
        return DConfigType::NUMBER_INPUT;
      case DConfig::NOTIFICATIONS_PROXY_SERVER:
        return DConfigType::STRING_INPUT;
      case DConfig::NOTIFICATIONS_PROXY_TYPE:
        return DConfigType::SELECT;
      case DConfig::DISABLE_TRIMMING:
        return DConfigType::TICKBOX;
      case DConfig::PRIORITY_0_START:
        return DConfigType::TICKBOX;
      case DConfig::SERVER_LOG_LEVEL:
        return DConfigType::SELECT;
      case DConfig::MAX_SESSION_LENGTH:
        return DConfigType::NUMBER_INPUT;
      case DConfig::HASHCAT_BRAIN_ENABLE:
        return DConfigType::TICKBOX;
      case DConfig::HASHCAT_BRAIN_HOST:
        return DConfigType::STRING_INPUT;
      case DConfig::HASHCAT_BRAIN_PORT:
        return DConfigType::NUMBER_INPUT;
      case DConfig::HASHCAT_BRAIN_PASS:
        return DConfigType::STRING_INPUT;
      case DConfig::HASHLIST_IMPORT_CHECK:
        return DConfigType::TICKBOX;
      case DConfig::ALLOW_DEREGISTER:
        return DConfigType::TICKBOX;
      case DConfig::AGENT_TEMP_THRESHOLD_1:
        return DConfigType::NUMBER_INPUT;
      case DConfig::AGENT_TEMP_THRESHOLD_2:
        return DConfigType::NUMBER_INPUT;
      case DConfig::AGENT_UTIL_THRESHOLD_1:
        return DConfigType::NUMBER_INPUT;
      case DConfig::AGENT_UTIL_THRESHOLD_2:
        return DConfigType::NUMBER_INPUT;
      case DConfig::UAPI_SEND_TASK_IS_COMPLETE:
        return DConfigType::TICKBOX;
      case DConfig::HC_ERROR_IGNORE:
        return DConfigType::STRING_INPUT;
      case DConfig::OBJECT_STORAGE_ENABLE:
        return DConfigType::TICKBOX;
      case DConfig::OBJECT_STORAGE_ENDPOINT:
        return DConfigType::STRING_INPUT;
      case DConfig::OBJECT_STORAGE_REGION:
        return DConfigType::STRING_INPUT;
      case DConfig::OBJECT_STORAGE_BUCKET:
        return DConfigType::STRING_INPUT;
      case DConfig::OBJECT_STORAGE_ACCESS_KEY:
        return DConfigType::STRING_INPUT;
      case DConfig::OBJECT_STORAGE_SECRET_KEY:
        return DConfigType::STRING_INPUT;
      case DConfig::OBJECT_STORAGE_PREFIX:
        return DConfigType::STRING_INPUT;
      case DConfig::OBJECT_STORAGE_PATH_STYLE:
        return DConfigType::TICKBOX;
      case DConfig::OBJECT_STORAGE_VERIFY_SSL:
        return DConfigType::TICKBOX;
      case DConfig::OBJECT_STORAGE_PRESIGN_TTL:
        return DConfigType::NUMBER_INPUT;
      case DConfig::OBJECT_STORAGE_DEFAULT_SRC:
        return DConfigType::SELECT;
    }
    return DConfigType::STRING_INPUT;
  }

  /**
   * @param $config string
   * @return string
   */
  public static function getConfigDescription($config) {
    switch ($config) {
      case DConfig::BENCHMARK_TIME:
        return "Time in seconds an agent should benchmark a task.";
      case DConfig::CHUNK_DURATION:
        return "Time in seconds a client should be working on a single chunk.";
      case DConfig::CHUNK_TIMEOUT:
        return "Time in seconds the server will consider an issued chunk as inactive or timed out and will reallocate to another client.";
      case DConfig::AGENT_TIMEOUT:
        return "Time in seconds the server will consider a client inactive or timed out.";
      case DConfig::HASHES_PAGE_SIZE:
        return "Number of hashes shown on each page of the hashes view.";
      case DConfig::FIELD_SEPARATOR:
        return "The separator character used to separate hash and plain (or salt).";
      case DConfig::HASHLIST_ALIAS:
        return "The string used as hashlist alias when creating a task.";
      case DConfig::STATUS_TIMER:
        return "Default interval in seconds clients should report back to the server for a task. (cracks, status, and progress).";
      case DConfig::BLACKLIST_CHARS:
        return "Characters that are not allowed to be used in attack command inputs.";
      case DConfig::NUMBER_LOGENTRIES:
        return "Number of log entries that should be saved. When this number is exceeded by 120%, the oldest will be overwritten.";
      case DConfig::TIME_FORMAT:
        return "Set the time format. Use syntax for PHPs date() method.";
      case DConfig::BASE_URL:
        return "Base url for the webpage (this does not include hostname and is normally determined automatically on the installation).";
      case DConfig::DISP_TOLERANCE:
        return "Allowable deviation in the final chunk of a task in percent.<br>(avoids issuing small chunks when the remaining part of a task is slightly bigger than the normal chunk size).";
      case DConfig::BATCH_SIZE:
        return "Batch size of SQL query when hashlist is sent to the agent.";
      case DConfig::YUBIKEY_ID:
        return "Yubikey Client ID.";
      case DConfig::YUBIKEY_KEY:
        return "Yubikey Secret Key.";
      case DConfig::YUBIKEY_URL:
        return "Yubikey API URL.";
      case DConfig::BASE_HOST:
        return "Base hostname/port/protocol to use. Only fill this in to override the auto-determined value.";
      case DConfig::DONATE_OFF:
        return "Hide donation information.";
      case DConfig::PLAINTEXT_MAX_LENGTH:
        return "Max length of a plaintext. (WARNING: This change may take a long time depending on DB size!)";
      case DConfig::HASH_MAX_LENGTH:
        return "Max length of a hash. (WARNING: This change may take a long time depending on DB size!)";
      case DConfig::EMAIL_SENDER:
        return "Email address used as sender on notification emails.";
      case DConfig::MAX_HASHLIST_SIZE:
        return "Max size of a hashlist in lines. (Prevents uploading very large lists).";
      case DConfig::HIDE_IMPORT_MASKS:
        return "Hide pre configured tasks that were imported through a mask import.";
      case DConfig::TELEGRAM_BOT_TOKEN:
        return "Telegram bot token used to send telegram notifications.";
      case DConfig::CONTACT_EMAIL:
        return "Admin email address that will be displayed on the webpage footer. (Leave empty to hide)";
      case DConfig::VOUCHER_DELETION:
        return "Vouchers can be used multiple times and will not be deleted automatically.";
      case DConfig::HASHES_PER_PAGE:
        return "Number of hashes per page on hashes view.";
      case DConfig::HIDE_IP_INFO:
        return "Hide agent's IP information.";
      case DConfig::EMAIL_SENDER_NAME:
        return "Sender's name on emails sent from " . APP_NAME . ".";
      case DConfig::DEFAULT_BENCH:
        return "Use speed benchmark as default.";
      case DConfig::SHOW_TASK_PERFORMANCE:
        return "Show cracks/minute for tasks which are running.";
      case DConfig::RULE_SPLIT_SMALL_TASKS:
        return "When rule splitting is applied for tasks, always make them a small task.";
      case DConfig::RULE_SPLIT_ALWAYS:
        return "Even do rule splitting when there are not enough rules but just the benchmark is too high.<br>Can result in subtasks with just one rule.";
      case DConfig::RULE_SPLIT_DISABLE:
        return "Disable automatic task splitting with large rule files.";
      case DConfig::AGENT_STAT_LIMIT:
        return "Maximal number of data points showing of agent gpu data.";
      case DConfig::AGENT_DATA_LIFETIME:
        return "Minimum time in seconds how long agent gpu/cpu utilisation and gpu temperature data is kept on the server.";
      case DConfig::AGENT_STAT_TENSION:
        return "Draw straigth lines in agent data graph  instead of bezier curves.";
      case DConfig::MULTICAST_ENABLE:
        return "Enable UDP multicast distribution of files to agents. (Make sure you did all the preparation before activating)<br>You can read more informations here: <a href='https://github.com/hashtopolis/runner/blob/master/README.md' target='_blank'>https://github.com/hashtopolis/runner</a>";
      case DConfig::MULTICAST_DEVICE:
        return "Network device of the server to be used for the multicast distribution.";
      case DConfig::MULTICAST_TR_ENABLE:
        return "Instead of the built in UFTP flow control, use a static set transfer rate<br>(Important: Setting this value wrong can affect the functionality, only use this if you are sure this transfer rate is feasible)";
      case DConfig::MULTICAST_TR:
        return "Set static transfer rate in case it is activated (in Kbit/s)";
      case DConfig::NOTIFICATIONS_PROXY_ENABLE:
        return "Enable using a proxy for sending notifications.";
      case DConfig::NOTIFICATIONS_PROXY_PORT:
        return "Set the port for the notifications proxy.";
      case DConfig::NOTIFICATIONS_PROXY_SERVER:
        return "Server url of the proxy to use for notifications.";
      case DConfig::NOTIFICATIONS_PROXY_TYPE:
        return "Proxy type to use for notifications.";
      case DConfig::DISABLE_TRIMMING:
        return "Disable trimming of chunks and redo whole chunks.";
      case DConfig::PRIORITY_0_START:
        return "Also automatically assign tasks with priority 0.";
      case DConfig::SERVER_LOG_LEVEL:
        return "Server level to be logged on the server to file.";
      case DConfig::MAX_SESSION_LENGTH:
        return "Max session length users can configure (in hours).";
      case DConfig::HASHCAT_BRAIN_ENABLE:
        return "Allow hashcat brain to be used for hashlists";
      case DConfig::HASHCAT_BRAIN_HOST:
        return "Host to be used for hashcat brain (must be reachable by agents)";
      case DConfig::HASHCAT_BRAIN_PORT:
        return "Port for hashcat brain";
      case DConfig::HASHCAT_BRAIN_PASS:
        return "Password to be used to access hashcat brain server";
      case DConfig::HASHLIST_IMPORT_CHECK:
        return "Check all hashes of a hashlist on import in case they are already cracked in another list";
      case DConfig::ALLOW_DEREGISTER:
        return "Allow clients to deregister themselves automatically from the server.";
      case DConfig::AGENT_TEMP_THRESHOLD_1:
        return "Temperature threshold from which on an agent is shown in orange on the agent status page.";
      case DConfig::AGENT_TEMP_THRESHOLD_2:
        return "Temperature threshold from which on an agent is shown in red on the agent status page.";
      case DConfig::AGENT_UTIL_THRESHOLD_1:
        return "Util value where an agent is shown in orange on the agent status page, if below.";
      case DConfig::AGENT_UTIL_THRESHOLD_2:
        return "Util value where an agent is shown in red on the agent status page, if below.";
      case DConfig::UAPI_SEND_TASK_IS_COMPLETE:
        return "Also send 'isComplete' for each task on the User API when listing all tasks (might affect performance)";
      case DConfig::HC_ERROR_IGNORE:
        return "Ignore error messages from crackers which contain given strings (multiple values separated by comma)";
      case DConfig::OBJECT_STORAGE_ENABLE:
        return "<b>Enable Object Storage</b><br>"
          . "When enabled, Hashtopolis will mirror uploads/renames/deletes from "
          . "<code>/usr/local/share/hashtopolis/files</code> to your S3-compatible bucket and can serve downloads using <b>pre-signed URLs</b>.<br>"
          . "<small>Tip: Existing files are not uploaded automatically; only new changes are mirrored.</small>";
      case DConfig::OBJECT_STORAGE_ENDPOINT:
        return "<b>Endpoint URL</b><br>"
          . "The base S3 API endpoint used for requests and pre-signed downloads.<br>"
          . "<ul>"
          . "<li>AWS: <code>https://s3.eu-west-1.amazonaws.com</code> (or <code>https://s3.amazonaws.com</code> for <code>us-east-1</code>)</li>"
          . "<li>Cloudflare R2: <code>https://&lt;accountid&gt;.r2.cloudflarestorage.com</code></li>"
          . "<li>Backblaze B2 S3: <code>https://s3.&lt;region&gt;.backblazeb2.com</code></li>"
          . "</ul>"
          . "<small>Do not include the bucket name in the endpoint unless your provider explicitly requires it.</small>";
      case DConfig::OBJECT_STORAGE_REGION:
        return "<b>Region (SigV4)</b><br>"
          . "Region value used for AWS Signature Version 4 request signing.<br>"
          . "<ul>"
          . "<li>AWS S3: must match the bucket region (e.g. <code>eu-west-1</code>)</li>"
          . "<li>Cloudflare R2: use <code>auto</code></li>"
          . "<li>Many S3-compatible services: often <code>us-east-1</code> or a provider-specific region code</li>"
          . "</ul>"
          . "<small>If signatures fail with <code>403 SignatureDoesNotMatch</code>, verify this value first.</small>";
      case DConfig::OBJECT_STORAGE_BUCKET:
        return "<b>Bucket Name</b><br>"
          . "The bucket that will store mirrored Hashtopolis files from "
          . "<code>/usr/local/share/hashtopolis/files</code>.<br>"
          . "<small>The bucket must already exist and the access key must have permission to read/write objects in it.</small>";
      case DConfig::OBJECT_STORAGE_ACCESS_KEY:
        return "<b>Access Key ID</b><br>"
          . "The access key (sometimes called <i>Key ID</i>) used to authenticate to the S3-compatible API.<br>"
          . "<small>Best practice: create a key restricted to this single bucket.</small>";
      case DConfig::OBJECT_STORAGE_SECRET_KEY:
        return "<b>Secret Access Key</b><br>"
          . "The secret key paired with the Access Key ID. This is used to sign API requests and generate pre-signed URLs.<br>"
          . "<small>Keep this private and rotate it if you suspect exposure.</small>";
      case DConfig::OBJECT_STORAGE_PREFIX:
        return "<b>Object Key Prefix (optional)</b><br>"
          . "An optional prefix (virtual folder) added in front of every stored object key.<br>"
          . "<ul>"
          . "<li>Example prefix: <code>hashtopolis/files</code></li>"
          . "<li>Resulting object path: <code>hashtopolis/files/&lt;filename&gt;</code></li>"
          . "</ul>"
          . "<small>Leave empty to store objects at the bucket root.</small>";
      case DConfig::OBJECT_STORAGE_PATH_STYLE:
        return "<b>Path-style Addressing</b><br>"
          . "Controls how URLs are built and signed:<br>"
          . "<ul>"
          . "<li><b>Enabled</b>: <code>https://endpoint/bucket/key</code></li>"
          . "<li><b>Disabled</b>: <code>https://bucket.endpoint/key</code> (virtual-host style)</li>"
          . "</ul>"
          . "<small>Cloudflare R2 typically requires path-style. AWS usually works best with virtual-host style.</small>";
      case DConfig::OBJECT_STORAGE_VERIFY_SSL:
        return "<b>Verify TLS Certificates</b><br>"
          . "When enabled, Hashtopolis verifies the TLS certificate presented by the endpoint (recommended).<br>"
          . "<small>Disable only for private/self-hosted endpoints (e.g. MinIO with a self-signed certificate).</small>";
      case DConfig::OBJECT_STORAGE_PRESIGN_TTL:
        return "<b>Pre-signed URL TTL (seconds)</b><br>"
          . "How long a generated pre-signed download URL remains valid.<br>"
          . "<ul>"
          . "<li>Recommended: <code>≤60</code> seconds</li>"
          . "</ul>"
          . "<small>Agents usually fetch immediately; shorter TTL reduces exposure if a URL leaks.</small>";
      case DConfig::OBJECT_STORAGE_DEFAULT_SRC:
        return "<b>Default Download Source</b><br>"
          . "Controls how agents and server-side downloads fetch files:<br>"
          . "<ul>"
          . "<li><b>Local</b>: always from the Hashtopolis server filesystem</li>"
          . "<li><b>Remote</b>: prefer pre-signed object storage downloads</li>"
          . "</ul>"
          . "<small>Choose <b>Remote</b> only if your bucket contains the mirrored files.</small>";
    }
    return $config;
  }
}
