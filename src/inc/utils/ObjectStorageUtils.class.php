<?php

class ObjectStorageUtils {
  const SERVICE = "s3";

  public static function isEnabled() {
    return intval(SConfig::getInstance()->getVal(DConfig::OBJECT_STORAGE_ENABLE)) === 1;
  }

  public static function getDefaultSource() {
    $src = trim(strval(SConfig::getInstance()->getVal(DConfig::OBJECT_STORAGE_DEFAULT_SRC)));

    if ($src === "remote") {
      return "remote";
    }
    return "local";
  }

  public static function getPresignTTL() {
    return intval(SConfig::getInstance()->getVal(DConfig::OBJECT_STORAGE_PRESIGN_TTL));
  }

  /**
   * @param array $arr
   * @return array
   * @throws HTException
   */
  public static function getCfgFromPost($arr) {
    $enabled   = isset($arr['config_' . DConfig::OBJECT_STORAGE_ENABLE]) ? intval($arr['config_' . DConfig::OBJECT_STORAGE_ENABLE]) : 0;
    $endpoint  = isset($arr['config_' . DConfig::OBJECT_STORAGE_ENDPOINT]) ? trim(strval($arr['config_' . DConfig::OBJECT_STORAGE_ENDPOINT])) : "";
    $bucket    = isset($arr['config_' . DConfig::OBJECT_STORAGE_BUCKET]) ? trim(strval($arr['config_' . DConfig::OBJECT_STORAGE_BUCKET])) : "";
    $accessKey = isset($arr['config_' . DConfig::OBJECT_STORAGE_ACCESS_KEY]) ? trim(strval($arr['config_' . DConfig::OBJECT_STORAGE_ACCESS_KEY])) : "";
    $secretKey = isset($arr['config_' . DConfig::OBJECT_STORAGE_SECRET_KEY]) ? trim(strval($arr['config_' . DConfig::OBJECT_STORAGE_SECRET_KEY])) : "";
    $region    = isset($arr['config_' . DConfig::OBJECT_STORAGE_REGION]) ? trim(strval($arr['config_' . DConfig::OBJECT_STORAGE_REGION])) : "";
    $prefix    = isset($arr['config_' . DConfig::OBJECT_STORAGE_PREFIX]) ? trim(strval($arr['config_' . DConfig::OBJECT_STORAGE_PREFIX])) : "";
    $pathStyle = isset($arr['config_' . DConfig::OBJECT_STORAGE_PATH_STYLE]) ? (intval($arr['config_' . DConfig::OBJECT_STORAGE_PATH_STYLE]) === 1) : false;
    $verifySSL = isset($arr['config_' . DConfig::OBJECT_STORAGE_VERIFY_SSL]) ? (intval($arr['config_' . DConfig::OBJECT_STORAGE_VERIFY_SSL]) === 1) : true;

    if (strlen($prefix) > 0) {
      $prefix = trim($prefix, "/") . "/";
    }

    if ($enabled === 1) {
      if ($endpoint === "" || $bucket === "" || $accessKey === "" || $secretKey === "") {
        throw new HTException("Object storage is enabled but configuration is incomplete (endpoint/bucket/keys).");
      }
      if ($region === "") {
        throw new HTException("Object storage is enabled but region is empty. Set Region (SigV4) and try again.");
      }
    }

    return [
      'enabled'   => $enabled,
      'endpoint'  => $endpoint,
      'bucket'    => $bucket,
      'accessKey' => $accessKey,
      'secretKey' => $secretKey,
      'region'    => $region,
      'prefix'    => $prefix,
      'pathStyle' => $pathStyle,
      'verifySSL' => $verifySSL
    ];
  }

  private static function getCfg() {
    $endpoint = trim(strval(SConfig::getInstance()->getVal(DConfig::OBJECT_STORAGE_ENDPOINT)));
    $bucket = trim(strval(SConfig::getInstance()->getVal(DConfig::OBJECT_STORAGE_BUCKET)));
    $accessKey = trim(strval(SConfig::getInstance()->getVal(DConfig::OBJECT_STORAGE_ACCESS_KEY)));
    $secretKey = trim(strval(SConfig::getInstance()->getVal(DConfig::OBJECT_STORAGE_SECRET_KEY)));
    $region = trim(strval(SConfig::getInstance()->getVal(DConfig::OBJECT_STORAGE_REGION)));
    $prefix = trim(strval(SConfig::getInstance()->getVal(DConfig::OBJECT_STORAGE_PREFIX)));
    $pathStyle = intval(SConfig::getInstance()->getVal(DConfig::OBJECT_STORAGE_PATH_STYLE)) === 1;
    $verifySSL = intval(SConfig::getInstance()->getVal(DConfig::OBJECT_STORAGE_VERIFY_SSL)) === 1;

    if (strlen($endpoint) == 0 || strlen($bucket) == 0 || strlen($accessKey) == 0 || strlen($secretKey) == 0) {
      throw new HTException("Object storage is enabled but configuration is incomplete (endpoint/bucket/keys).");
    }

    if (strlen($region) == 0) {
      throw new HTException("Object storage is enabled but region is empty. Set Region (SigV4).");
    }

    if (strlen($prefix) > 0) {
      $prefix = trim($prefix, "/") . "/";
    }

    return [
      'endpoint' => $endpoint,
      'bucket' => $bucket,
      'accessKey' => $accessKey,
      'secretKey' => $secretKey,
      'region' => $region,
      'prefix' => $prefix,
      'pathStyle' => $pathStyle,
      'verifySSL' => $verifySSL
    ];
  }

  /**
   * @param array $cfg
   * @return array
   * @throws HTException
   */
  public static function testConnection($cfg) {
    if (!isset($cfg['enabled']) || intval($cfg['enabled']) !== 1) {
      return [];
    }

    $steps = [];

    $testName = "hashtopolis-conn-test-" . gmdate('Ymd\THis\Z') . "-" . bin2hex(random_bytes(4)) . ".txt";
    $key = $cfg['prefix'] . $testName;
    $body = "hashtopolis object storage connection test\n" . gmdate('c') . "\n";

    // PUT
    self::requestSignedWithCfg($cfg, 'PUT', $key, [], [
      'Content-Type' => 'text/plain'
    ], $body);
    $steps[] = ['name' => 'PUT', 'ok' => true];

    // DELETE
    self::requestSignedWithCfg($cfg, 'DELETE', $key, [], [], "");
    $steps[] = ['name' => 'DELETE', 'ok' => true];

    return $steps;
  }

  public static function getObjectKeyForFilename($filename) {
    $cfg = self::getCfg();
    return $cfg['prefix'] . $filename;
  }

  /**
   * @param string $localPath
   * @param string $filename
   * @throws HTException
   */
  public static function uploadFile($localPath, $filename) {
    if (!self::isEnabled()) {
      return;
    }
    if (!is_file($localPath) || !is_readable($localPath)) {
      throw new HTException("Local file not readable for upload: " . $localPath);
    }
    $cfg = self::getCfg();
    $key = $cfg['prefix'] . $filename;
    self::requestSignedPutFileWithCfg($cfg, $key, [
      'Content-Type' => 'application/octet-stream',
    ], $localPath);
  }

  public static function deleteFile($filename) {
    if (!self::isEnabled()) {
      return;
    }
    $cfg = self::getCfg();
    $key = $cfg['prefix'] . $filename;
    self::requestSignedWithCfg($cfg, 'DELETE', $key, [], [], "");
  }

  public static function renameFile($oldFilename, $newFilename) {
    if (!self::isEnabled()) {
      return;
    }
    $cfg = self::getCfg();
    $srcKey = $cfg['prefix'] . $oldFilename;
    $dstKey = $cfg['prefix'] . $newFilename;
    $copySource = "/" . $cfg['bucket'] . "/" . str_replace('%2F', '/', rawurlencode($srcKey));
    self::requestSignedWithCfg($cfg, 'PUT', $dstKey, [], [
      'x-amz-copy-source' => $copySource,
    ], "");
    self::requestSignedWithCfg($cfg, 'DELETE', $srcKey, [], [], "");
  }

  public static function presignGetFileUrl($filename, $ttl = null) {
    if (!self::isEnabled()) {
      throw new HTException("Object storage is not enabled!");
    }
    $cfg = self::getCfg();
    $key = $cfg['prefix'] . $filename;
    $ttl = ($ttl === null) ? self::getPresignTTL() : intval($ttl);
    if ($ttl <= 0) {
      throw new HTException("Invalid pre-signed TTL (must be > 0). Set Pre-signed URL TTL in config.");
    }

    return self::presignUrl($cfg, 'GET', $key, $ttl);
  }

  private static function presignUrl($cfg, $method, $objectKey, $ttl) {
    $endpoint = self::buildEndpoint($cfg, $objectKey);
    $parts = parse_url($endpoint);
    if ($parts === false || !isset($parts['scheme']) || !isset($parts['host'])) {
      throw new HTException("Invalid object storage endpoint URL!");
    }

    $amzDate = gmdate('Ymd\THis\Z');
    $dateStamp = gmdate('Ymd');
    $credentialScope = $dateStamp . "/" . $cfg['region'] . "/" . self::SERVICE . "/aws4_request";
    $signedHeaders = "host";

    $query = [
      'X-Amz-Algorithm' => 'AWS4-HMAC-SHA256',
      'X-Amz-Credential' => $cfg['accessKey'] . "/" . $credentialScope,
      'X-Amz-Date' => $amzDate,
      'X-Amz-Expires' => strval(intval($ttl)),
      'X-Amz-SignedHeaders' => $signedHeaders,
    ];
    ksort($query);
    $canonicalQuery = self::canonicalQuery($query);

    $canonicalUri = self::canonicalUriFromParts($cfg, $objectKey);
    $canonicalHeaders = "host:" . strtolower($parts['host']) . "\n";
    $payloadHash = "UNSIGNED-PAYLOAD";

    $canonicalRequest = strtoupper($method) . "\n" . $canonicalUri . "\n" . $canonicalQuery . "\n" . $canonicalHeaders . "\n" . $signedHeaders . "\n" . $payloadHash;
    $stringToSign = "AWS4-HMAC-SHA256\n" . $amzDate . "\n" . $credentialScope . "\n" . hash('sha256', $canonicalRequest);
    $signingKey = self::getSigningKey($cfg['secretKey'], $dateStamp, $cfg['region'], self::SERVICE);
    $signature = hash_hmac('sha256', $stringToSign, $signingKey);

    $query['X-Amz-Signature'] = $signature;
    $finalQuery = self::canonicalQuery($query);

    $port = isset($parts['port']) ? (":" . $parts['port']) : "";
    $basePath = isset($parts['path']) ? $parts['path'] : "";
    return $parts['scheme'] . "://" . $parts['host'] . $port . $basePath . "?" . $finalQuery;
  }

  private static function requestSignedWithCfg($cfg, $method, $objectKey, $query, $headers, $body) {
    $url = self::buildEndpoint($cfg, $objectKey);
    if (sizeof($query) > 0) {
      $url .= "?" . self::canonicalQuery($query);
    }
    $parts = parse_url($url);
    if ($parts === false || !isset($parts['scheme']) || !isset($parts['host'])) {
      throw new HTException("Invalid object storage endpoint URL!");
    }

    $amzDate = gmdate('Ymd\THis\Z');
    $dateStamp = gmdate('Ymd');
    $payloadHash = hash('sha256', $body);

    $headersLower = [];
    foreach ($headers as $k => $v) {
      $headersLower[strtolower($k)] = trim($v);
    }
    $headersLower['host'] = strtolower($parts['host']);
    $headersLower['x-amz-content-sha256'] = $payloadHash;
    $headersLower['x-amz-date'] = $amzDate;

    ksort($headersLower);
    $signedHeaders = implode(";", array_keys($headersLower));
    $canonicalHeaders = "";
    foreach ($headersLower as $k => $v) {
      $canonicalHeaders .= $k . ":" . preg_replace('/\s+/', ' ', $v) . "\n";
    }

    $canonicalUri = self::canonicalUriFromUrl($parts);
    $canonicalQuery = "";
    if (isset($parts['query'])) {
      parse_str($parts['query'], $qArr);
      ksort($qArr);
      $canonicalQuery = self::canonicalQuery($qArr);
    }

    $canonicalRequest = strtoupper($method) . "\n" . $canonicalUri . "\n" . $canonicalQuery . "\n" . $canonicalHeaders . "\n" . $signedHeaders . "\n" . $payloadHash;

    $credentialScope = $dateStamp . "/" . $cfg['region'] . "/" . self::SERVICE . "/aws4_request";
    $stringToSign = "AWS4-HMAC-SHA256\n" . $amzDate . "\n" . $credentialScope . "\n" . hash('sha256', $canonicalRequest);
    $signingKey = self::getSigningKey($cfg['secretKey'], $dateStamp, $cfg['region'], self::SERVICE);
    $signature = hash_hmac('sha256', $stringToSign, $signingKey);

    $authorization = "AWS4-HMAC-SHA256 Credential=" . $cfg['accessKey'] . "/" . $credentialScope . ", SignedHeaders=" . $signedHeaders . ", Signature=" . $signature;
    $headersLower['authorization'] = $authorization;

    $curlHeaders = [];
    foreach ($headersLower as $k => $v) {
      $curlHeaders[] = $k . ": " . $v;
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, strtoupper($method));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $curlHeaders);
    curl_setopt($ch, CURLOPT_HEADER, false);

    if (!isset($cfg['verifySSL']) || !$cfg['verifySSL']) {
      curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
      curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    }

    if (strlen($body) > 0) {
      curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }

    $respBody = curl_exec($ch);
    if ($respBody === false) {
      $err = curl_error($ch);
      curl_close($ch);
      throw new HTException("Object storage request failed: " . $err);
    }

    $code = intval(curl_getinfo($ch, CURLINFO_HTTP_CODE));
    curl_close($ch);

    if ($code < 200 || $code >= 300) {
      throw new HTException("Object storage request failed (HTTP " . $code . ")" . ((strlen($respBody) > 0) ? ": " . $respBody : ""));
    }
    return [$code, $respBody];
  }

  /**
   * @param array  $cfg
   * @param string $objectKey
   * @param array  $headers
   * @param string $localPath
   * @return array
   * @throws HTException
   */
  private static function requestSignedPutFileWithCfg($cfg, $objectKey, $headers, $localPath) {
    $url = self::buildEndpoint($cfg, $objectKey);
    $parts = parse_url($url);
    if ($parts === false || !isset($parts['scheme']) || !isset($parts['host'])) {
      throw new HTException("Invalid object storage endpoint URL!");
    }

    $fileSize = filesize($localPath);
    if ($fileSize === false) {
      throw new HTException("Failed to determine file size for upload: " . $localPath);
    }

    $payloadHash = hash_file('sha256', $localPath);
    if ($payloadHash === false) {
      throw new HTException("Failed to hash file for upload: " . $localPath);
    }

    $amzDate = gmdate('Ymd\THis\Z');
    $dateStamp = gmdate('Ymd');

    $headersLower = [];
    foreach ($headers as $k => $v) {
      $headersLower[strtolower($k)] = trim($v);
    }

    $headersLower['host'] = strtolower($parts['host']);
    $headersLower['x-amz-content-sha256'] = $payloadHash;
    $headersLower['x-amz-date'] = $amzDate;

    ksort($headersLower);
    $signedHeaders = implode(";", array_keys($headersLower));

    $canonicalHeaders = "";
    foreach ($headersLower as $k => $v) {
      $canonicalHeaders .= $k . ":" . preg_replace('/\s+/', ' ', $v) . "\n";
    }

    $canonicalUri = self::canonicalUriFromUrl($parts);

    $canonicalQuery = "";
    if (isset($parts['query'])) {
      parse_str($parts['query'], $qArr);
      ksort($qArr);
      $canonicalQuery = self::canonicalQuery($qArr);
    }

    $canonicalRequest =
      "PUT\n" .
      $canonicalUri . "\n" .
      $canonicalQuery . "\n" .
      $canonicalHeaders . "\n" .
      $signedHeaders . "\n" .
      $payloadHash;

    $credentialScope = $dateStamp . "/" . $cfg['region'] . "/" . self::SERVICE . "/aws4_request";
    $stringToSign =
      "AWS4-HMAC-SHA256\n" .
      $amzDate . "\n" .
      $credentialScope . "\n" .
      hash('sha256', $canonicalRequest);

    $signingKey = self::getSigningKey($cfg['secretKey'], $dateStamp, $cfg['region'], self::SERVICE);
    $signature = hash_hmac('sha256', $stringToSign, $signingKey);

    $authorization =
      "AWS4-HMAC-SHA256 Credential=" . $cfg['accessKey'] . "/" . $credentialScope .
      ", SignedHeaders=" . $signedHeaders .
      ", Signature=" . $signature;

    $headersLower['authorization'] = $authorization;

    $curlHeaders = [];
    foreach ($headersLower as $k => $v) {
      $curlHeaders[] = $k . ": " . $v;
    }
    $curlHeaders[] = "Expect:";

    $fp = @fopen($localPath, "rb");
    if ($fp === false) {
      throw new HTException("Failed to open file for upload: " . $localPath);
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $curlHeaders);
    curl_setopt($ch, CURLOPT_HEADER, false);

    curl_setopt($ch, CURLOPT_UPLOAD, true);
    curl_setopt($ch, CURLOPT_INFILE, $fp);
    curl_setopt($ch, CURLOPT_INFILESIZE, $fileSize);

    if (!isset($cfg['verifySSL']) || !$cfg['verifySSL']) {
      curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
      curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    }

    $respBody = curl_exec($ch);
    if ($respBody === false) {
      $err = curl_error($ch);
      curl_close($ch);
      fclose($fp);
      throw new HTException("Object storage request failed: " . $err);
    }

    $code = intval(curl_getinfo($ch, CURLINFO_HTTP_CODE));
    curl_close($ch);
    fclose($fp);

    if ($code < 200 || $code >= 300) {
      throw new HTException("Object storage request failed (HTTP " . $code . ")" . ((strlen($respBody) > 0) ? ": " . $respBody : ""));
    }

    return [$code, $respBody];
  }

  private static function buildEndpoint($cfg, $objectKey) {
    $endpoint = rtrim($cfg['endpoint'], "/");
    $bucket = $cfg['bucket'];

    $parts = parse_url($endpoint);
    if ($parts === false) {
      return $endpoint . "/" . rawurlencode($bucket) . "/" . str_replace('%2F', '/', rawurlencode($objectKey));
    }

    $scheme = $parts['scheme'] ?? 'https';
    $host = $parts['host'] ?? '';
    $port = isset($parts['port']) ? (":" . $parts['port']) : "";
    $basePath = isset($parts['path']) ? rtrim($parts['path'], "/") : "";

    $encodedKey = str_replace('%2F', '/', rawurlencode($objectKey));
    if (!empty($cfg['pathStyle'])) {
      return $scheme . "://" . $host . $port . $basePath . "/" . rawurlencode($bucket) . "/" . $encodedKey;
    }
    return $scheme . "://" . rawurlencode($bucket) . "." . $host . $port . $basePath . "/" . $encodedKey;
  }

  private static function canonicalUriFromParts($cfg, $objectKey) {
    $endpoint = rtrim($cfg['endpoint'], "/");
    $parts = parse_url($endpoint);
    $basePath = isset($parts['path']) ? rtrim($parts['path'], "/") : "";
    $encodedKey = str_replace('%2F', '/', rawurlencode($objectKey));
    if (!empty($cfg['pathStyle'])) {
      return ($basePath == "") ? ("/" . rawurlencode($cfg['bucket']) . "/" . $encodedKey) : ($basePath . "/" . rawurlencode($cfg['bucket']) . "/" . $encodedKey);
    }
    return ($basePath == "") ? ("/" . $encodedKey) : ($basePath . "/" . $encodedKey);
  }

  private static function canonicalUriFromUrl($urlParts) {
    $path = $urlParts['path'] ?? '/';
    if ($path === '') {
      $path = '/';
    }
    if ($path[0] != '/') {
      $path = '/' . $path;
    }
    return $path;
  }

  private static function canonicalQuery($query) {
    $pairs = [];
    foreach ($query as $k => $v) {
      if (is_array($v)) {
        $v = implode(',', $v);
      }
      $pairs[] = rawurlencode($k) . "=" . rawurlencode(strval($v));
    }
    return implode("&", $pairs);
  }

  private static function getSigningKey($key, $dateStamp, $region, $service) {
    $kDate = hash_hmac('sha256', $dateStamp, "AWS4" . $key, true);
    $kRegion = hash_hmac('sha256', $region, $kDate, true);
    $kService = hash_hmac('sha256', $service, $kRegion, true);
    return hash_hmac('sha256', "aws4_request", $kService, true);
  }
}
