<?php

class VastAiApi
{
  private string $baseUrl = "https://console.vast.ai";
  private string $token;
  private string $defaultImage;
  private int $defaultDiskGb;

  public function __construct()
  {
    $enabled = (int)SConfig::getInstance()->getVal(DConfig::VAST_ENABLE);
    if ($enabled !== 1) {
      throw new Exception("Vast.ai integration is disabled");
    }

    $this->token = (string)SConfig::getInstance()->getVal(DConfig::VAST_BEARER_TOKEN);
    if ($this->token === "") {
      throw new Exception("Vast.ai bearer token is not configured");
    }

    $this->defaultImage = (string)SConfig::getInstance()->getVal(DConfig::VAST_DEFAULT_IMAGE);
    if ($this->defaultImage === "") {
      $this->defaultImage = "dizcza/docker-hashcat:cuda";
    }

    $disk = (int)SConfig::getInstance()->getVal(DConfig::VAST_DEFAULT_DISK_GB);
    $this->defaultDiskGb = ($disk > 0) ? $disk : 16;
  }

  public function searchOffers(array $filters): array
  {
    return $this->request("POST", "/api/v0/bundles/", $filters);
  }

  public function createInstance(int $askId, string $label, string $onstart): array
  {
    return $this->request(
      "PUT",
      "/api/v0/asks/" . $askId . "/",
      [
        "image"   => $this->defaultImage,
        "disk"    => $this->defaultDiskGb,
        "label"   => $label,
        "runtype" => "ssh",
        "onstart" => $onstart
      ]
    );
  }

  public function listInstances(): array
  {
    return $this->request("GET", "/api/v0/instances/");
  }

  public function updateInstance(int $instanceId, string $state): array
  {
    return $this->request(
      "PUT",
      "/api/v0/instances/" . $instanceId . "/",
      ["state" => $state]
    );
  }

  public function destroyInstance(int $instanceId): array
  {
    return $this->request(
      "DELETE",
      "/api/v0/instances/" . $instanceId . "/"
    );
  }

  private function request(string $method, string $path, ?array $payload = null): array
  {
    $url = $this->baseUrl . $path;
    $ch = curl_init($url);

    $headers = [
      "Authorization: Bearer " . $this->token,
      "Accept: application/json"
    ];

    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST  => $method,
      CURLOPT_HTTPHEADER     => $headers,
      CURLOPT_TIMEOUT        => 30,
      CURLOPT_FOLLOWLOCATION => false,
      CURLOPT_ENCODING       => ""
    ]);

    if ($payload !== null) {
      $json = json_encode($payload, JSON_UNESCAPED_SLASHES);
      if ($json === false) {
        throw new Exception("Failed to encode Vast.ai payload");
      }

      $headers[] = "Content-Type: application/json";
      curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
      curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
    }

    $response = curl_exec($ch);
    if ($response === false) {
      $err = curl_error($ch);
      curl_close($ch);
      throw new Exception("Vast.ai curl error: " . $err);
    }

    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $decoded = json_decode($response, true);
    if (!is_array($decoded)) {
      DServerLog::log(DServerLog::ERROR, "Vast.ai invalid JSON", [
        "url" => $url,
        "http" => $code,
        "body" => substr((string)$response, 0, 800)
      ]);
      throw new Exception("Invalid JSON response from Vast.ai (HTTP " . $code . ")");
    }

    if ($code >= 400) {
      $errCode = $decoded["error"] ?? "";
      $msg = $decoded["msg"] ?? ($decoded["message"] ?? "Vast.ai API error");

      DServerLog::log(DServerLog::ERROR, "Vast.ai API error", [
        "url" => $url,
        "http" => $code,
        "error" => $errCode,
        "msg" => $msg,
        "raw" => $decoded
      ]);

      $detail = "HTTP " . $code;
      if ($errCode !== "") {
        $detail .= " " . $errCode;
      }
      $detail .= ": " . $msg;

      throw new Exception($detail);
    }

    return $decoded;
  }
}
