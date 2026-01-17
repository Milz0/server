<?php

class VastAiHandler
{
  private VastAiApi $api;

  private int $createPaceMs = 450;
  private int $retryBaseMs  = 600;
  private int $retryMaxMs   = 8000;
  private int $retryMaxAttempts = 5;

  private const TYPE_ONDEMAND = "on-demand";
  private const TYPE_RESERVED = "reserved";
  private const TYPE_BID      = "bid";

  public function __construct()
  {
    AccessControl::getInstance()->checkPermission(DViewControl::AGENTS_VIEW_PERM);
    $this->api = new VastAiApi();
  }

  public function handle(string $action, array $data): void
  {
    try {
      switch ($action) {
        case "vastSearch":
          $this->search($data);
          break;

        case "vastRent":
          $this->rent($data);
          break;

        case "vastRentMulti":
          $this->rentMulti($data);
          break;

        case "vastStart":
          $this->state($data, "running");
          break;

        case "vastStop":
          $this->state($data, "stopped");
          break;

        case "vastDestroy":
          $this->destroy($data);
          break;

        default:
          throw new Exception("Unknown Vast.ai action");
      }
    } catch (Exception $e) {
      UI::addMessage("danger", "Vast.ai: " . $e->getMessage());
    }
  }

  private function search(array $data): void
  {
    $limit = $this->clampInt($data["limit"] ?? 256, 1, 500);

    $types = [self::TYPE_ONDEMAND];
    if (!empty($data["include_reserved"])) $types[] = self::TYPE_RESERVED;
    if (!empty($data["include_bid"]))      $types[] = self::TYPE_BID;
    $types = array_values(array_unique($types));

    $baseFilters = [
      "limit"    => $limit,
      "verified" => ["eq" => true],
      "rentable" => ["eq" => true],
      "rented"   => ["eq" => false],
    ];

    if (!empty($data["num_gpus"])) {
      $baseFilters["num_gpus"] = ["gte" => (int)$data["num_gpus"]];
    }

    if (!empty($data["min_reliability"])) {
      $baseFilters["reliability"] = ["gte" => (float)$data["min_reliability"]];
    }

    $gpuNames = $this->parseGpuNames($data);
    if (count($gpuNames) > 0) {
      $baseFilters["gpu_name"] = ["in" => $gpuNames];
    }

    $offersByAsk = [];
    $seenTypes = [];
    $rawCount = 0;

    foreach ($types as $t) {
      $filters = $baseFilters;
      $filters["type"] = $t;

      $res = $this->api->searchOffers($filters);

      $rawList = $this->normalizeOffersList($res["offers"] ?? null);
      $rawCount += count($rawList);

      foreach ($rawList as $o) {
        if (!is_array($o)) continue;

        $ask = (string)($o["ask_contract_id"] ?? "");
        if ($ask === "") continue;

        $set = $this->normalizeOffer($o);
        $set->addValue("offer_type_raw", $t);
        $set->addValue("offer_type", $this->offerTypeLabel($t));

        $offersByAsk[$ask] = $set;
        $seenTypes[$t] = true;
      }
    }

    $offers = array_values($offersByAsk);

    UI::add("vastOffers", $offers);

    $typeLabel = implode(", ", array_map([$this, "offerTypeLabel"], array_keys($seenTypes)));
    UI::addMessage(
      "info",
      "Vast.ai search returned " . count($offers) . " unique offer(s) (types: " . $typeLabel . ")."
    );
  }

  private function normalizeOffersList($rawOffers): array
  {
    if (!is_array($rawOffers)) return [];

    if (isset($rawOffers[0]) && is_array($rawOffers[0])) {
      return $rawOffers;
    }

    if (count($rawOffers) > 0) {
      return [$rawOffers];
    }

    return [];
  }

  private function offerTypeLabel(string $t): string
  {
    $v = strtolower(trim($t));
    if ($v === self::TYPE_ONDEMAND) return "On-demand";
    if ($v === self::TYPE_RESERVED) return "Reserved";
    if ($v === self::TYPE_BID)      return "Bid";
    return $v !== "" ? ucfirst($v) : "Unknown";
  }

  private function parseGpuNames(array $data): array
  {
    $gpuNames = [];
    if (!empty($data["gpu_names"]) && is_array($data["gpu_names"])) {
      $gpuNames = array_values(array_filter(array_map("trim", $data["gpu_names"])));
    } else if (!empty($data["gpu_names_csv"])) {
      $gpuNames = array_values(array_filter(array_map("trim", explode(",", (string)$data["gpu_names_csv"]))));
    }
    return $gpuNames;
  }

  private function normalizeOffer(array $o): DataSet
  {
    $set = new DataSet();

    $ask = (string)($o["ask_contract_id"] ?? "");

    $gpuArch = (string)($o["gpu_arch"] ?? "");
    $gpuName = (string)($o["gpu_name"] ?? "");
    $archLabel = $this->gpuArchLabel($gpuArch);
    $gpu = trim(($archLabel !== "" ? ($archLabel . " ") : "") . $gpuName);

    $ng = (int)($o["num_gpus"] ?? 0);

    $totalHour = 0.0;
    if (isset($o["search"]) && is_array($o["search"]) && isset($o["search"]["totalHour"])) {
      $totalHour = (float)$o["search"]["totalHour"];
    }

    $reliab   = (float)($o["reliability"] ?? 0.0);
    $inetUp   = (float)($o["inet_up"] ?? 0.0);
    $inetDown = (float)($o["inet_down"] ?? 0.0);
    $flops    = (float)($o["total_flops"] ?? 0.0);

    $set->addValue("ask_contract_id", $ask);
    $set->addValue("gpu_name", $gpu);
    $set->addValue("num_gpus", (string)$ng);

    $set->addValue("totalHour_raw", (string)$totalHour);
    $set->addValue("reliability_raw", (string)$reliab);
    $set->addValue("inet_up_raw", (string)$inetUp);
    $set->addValue("inet_down_raw", (string)$inetDown);
    $set->addValue("total_flops_raw", (string)$flops);

    $set->addValue("totalHour_disp", "$" . number_format($totalHour, 2));
    $set->addValue("reliability_disp", number_format($reliab, 4));
    $set->addValue("inet_up_disp", number_format($inetUp, 0) . " Mbps");
    $set->addValue("inet_down_disp", number_format($inetDown, 0) . " Mbps");
    $set->addValue("total_flops_disp", number_format($flops, 2));

    $ratio = ($totalHour > 0.0) ? ($flops / $totalHour) : 0.0;
    $set->addValue("flops_per_dollar_raw", (string)$ratio);
    $set->addValue("flops_per_dollar_disp", number_format($ratio, 2));

    return $set;
  }

  private function rent(array $data): void
  {
    if (empty($data["ask_contract_id"])) {
      throw new Exception("Missing ask_contract_id");
    }

    $agentBaseUrl = rtrim((string)SConfig::getInstance()->getVal(DConfig::VAST_AGENT_BASEURL), "/");
    if ($agentBaseUrl === "") {
      throw new Exception("Vast agent base URL is not configured");
    }

    $voucher = (string)Util::randomString(8);
    AgentUtils::createVoucher($voucher);

    $label = "hashtopolis-" . $voucher;
    $onstart = $this->buildOnStartScript($agentBaseUrl, $voucher);

    $res = $this->createInstanceWithRetry((int)$data["ask_contract_id"], $label, $onstart);

    UI::addMessage(
      "success",
      "Instance rented. Contract ID: " . ($res["new_contract"] ?? "unknown") . " (voucher: " . $voucher . ")"
    );
  }

  private function rentMulti(array $data): void
  {
    $askIds = [];

    if (!empty($data["ask_contract_ids"]) && is_array($data["ask_contract_ids"])) {
      foreach ($data["ask_contract_ids"] as $id) {
        $id = trim((string)$id);
        if ($id !== "" && ctype_digit($id)) {
          $askIds[] = (int)$id;
        }
      }
    }

    $askIds = array_values(array_unique($askIds));
    if (count($askIds) === 0) {
      throw new Exception("No ask_contract_id values selected");
    }

    $agentBaseUrl = rtrim((string)SConfig::getInstance()->getVal(DConfig::VAST_AGENT_BASEURL), "/");
    if ($agentBaseUrl === "") {
      throw new Exception("Vast agent base URL is not configured");
    }

    $voucher = (string)Util::randomString(8);
    AgentUtils::createVoucher($voucher);

    $onstart = $this->buildOnStartScript($agentBaseUrl, $voucher);

    $ok = 0;
    $fail = 0;
    $contracts = [];

    foreach ($askIds as $askId) {
      try {
        $label = "hashtopolis-" . $voucher . "-ask" . $askId;

        $res = $this->createInstanceWithRetry((int)$askId, $label, $onstart);

        $ok++;
        if (isset($res["new_contract"])) {
          $contracts[] = (string)$res["new_contract"];
        }

        $this->sleepMs($this->createPaceMs + $this->randJitterMs(0, 180));
      } catch (Exception $e) {
        $fail++;
        UI::addMessage("danger", "Vast.ai: Failed renting ask_contract_id " . $askId . ": " . $e->getMessage());

        $this->sleepMs(450 + $this->randJitterMs(0, 250));
      }
    }

    $msg = "Multi-rent complete: " . $ok . " success, " . $fail . " failed. Shared voucher: " . $voucher;
    if (count($contracts) > 0) {
      $msg .= ". Contracts: " . implode(", ", $contracts);
    }

    UI::addMessage(($fail > 0 ? "warning" : "success"), $msg);
  }

  private function state(array $data, string $state): void
  {
    if (empty($data["instance_id"])) {
      throw new Exception("Missing instance ID");
    }

    $this->api->updateInstance((int)$data["instance_id"], $state);
    UI::addMessage("success", "Instance " . $state . " command sent");
  }

  private function destroy(array $data): void
  {
    if (empty($data["instance_id"])) {
      throw new Exception("Missing instance ID");
    }

    $this->api->destroyInstance((int)$data["instance_id"]);
    UI::addMessage("success", "Instance destroyed");
  }

  private function buildOnStartScript(string $agentBaseUrl, string $voucher): string
  {
    return <<<BASH
#!/bin/bash
set -e

mkdir -p /opt/hashtopolis
cd /opt/hashtopolis

curl -fsSL "{$agentBaseUrl}/agents.php?download=1" -o hashtopolis.zip
python3 hashtopolis.zip --url "{$agentBaseUrl}/api/server.php" --voucher "{$voucher}" -d
BASH;
  }

  private function createInstanceWithRetry(int $askId, string $label, string $onstart): array
  {
    $attempt = 0;
    $delayMs = $this->retryBaseMs;

    while (true) {
      $attempt++;

      $this->sleepMs(150 + $this->randJitterMs(0, 120));

      try {
        return $this->api->createInstance($askId, $label, $onstart);
      } catch (Exception $e) {
        $msg = $e->getMessage();

        $is429 = (strpos($msg, "HTTP 429") !== false);
        if (!$is429 || $attempt >= $this->retryMaxAttempts) {
          throw $e;
        }

        $wait = min($this->retryMaxMs, $delayMs + $this->randJitterMs(0, 250));

        UI::addMessage(
          "warning",
          "Vast.ai: Rate limited (HTTP 429) for ask_contract_id " . $askId .
            ". Retrying in " . $wait . " ms (attempt " . ($attempt + 1) . "/" . $this->retryMaxAttempts . ")."
        );

        $this->sleepMs($wait);

        $delayMs = (int)min($this->retryMaxMs, (int)round($delayMs * 1.8));
      }
    }
  }

  private function gpuArchLabel(string $arch): string
  {
    $a = strtolower(trim($arch));
    if ($a === "nvidia") return "Nvidia";
    if ($a === "amd") return "AMD";
    if ($a === "intel") return "Intel";
    return $a !== "" ? ucfirst($a) : "";
  }

  private function clampInt($v, int $min, int $max): int
  {
    $n = (int)$v;
    if ($n < $min) return $min;
    if ($n > $max) return $max;
    return $n;
  }

  private function sleepMs(int $ms): void
  {
    if ($ms <= 0) {
      return;
    }
    usleep($ms * 1000);
  }

  private function randJitterMs(int $min, int $max): int
  {
    if ($max <= $min) {
      return $min;
    }
    try {
      return random_int($min, $max);
    } catch (Exception $e) {
      return $min;
    }
  }
}
