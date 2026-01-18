<?php

require_once(dirname(__FILE__) . "/inc/load.php");

if (!Login::getInstance()->isLoggedin()) {
  header("Location: index.php?err=4" . time() . "&fw=" . urlencode($_SERVER["PHP_SELF"] . "?" . $_SERVER["QUERY_STRING"]));
  die();
}

AccessControl::getInstance()->checkPermission(DViewControl::AGENTS_VIEW_PERM);

/**
 * Build the normalized instances array (as DataSet objects) and also a plain array version
 * for JSON responses.
 */
function vastBuildInstances(VastAiApi $api, bool $asPlainArray = false): array
{
  $res = $api->listInstances();

  $instancesRaw = $res["instances"] ?? [];
  $instances = [];

  if (is_array($instancesRaw)) {
    foreach ($instancesRaw as $inst) {
      if (!is_array($inst)) {
        continue;
      }

      $status =
        (string)($inst["actual_status"] ?? "") !== "" ? (string)$inst["actual_status"] :
        (((string)($inst["status"] ?? "") !== "") ? (string)$inst["status"] : (string)($inst["state"] ?? ""));

      // Cost per hour: prefer the computed total if present.
      $costPerHour = "";
      if (isset($inst["dph_total"])) {
        $costPerHour = "$" . number_format((float)$inst["dph_total"], 2);
      } else if (isset($inst["search"]) && is_array($inst["search"]) && isset($inst["search"]["totalHour"])) {
        $costPerHour = "$" . number_format((float)$inst["search"]["totalHour"], 2);
      }

      $sshPort = "";
      if (isset($inst["ssh_port"])) {
        $sshPort = (string)$inst["ssh_port"];
      } else if (isset($inst["ports"]) && is_array($inst["ports"])) {
        // Sometimes ports are keyed as "22/tcp" or "22"
        if (isset($inst["ports"]["22"])) {
          $sshPort = (string)$inst["ports"]["22"];
        } else if (isset($inst["ports"]["22/tcp"])) {
          $sshPort = (string)$inst["ports"]["22/tcp"];
        }
      }

      $start = "";
      if (isset($inst["start_date"])) {
        $ts = (int)floor((float)$inst["start_date"]);
        if ($ts > 0) {
          $start = gmdate("Y-m-d H:i", $ts);
        }
      }

      $gpuArch = (string)($inst["gpu_arch"] ?? "");
      $gpuName = (string)($inst["gpu_name"] ?? "");

      $arch = strtolower(trim($gpuArch));
      if ($arch === "nvidia") $arch = "Nvidia";
      else if ($arch === "amd") $arch = "AMD";
      else if ($arch === "intel") $arch = "Intel";
      else if ($arch !== "") $arch = ucfirst($arch);

      $flops = 0.0;
      if (isset($inst["total_flops"])) {
        $flops = (float)$inst["total_flops"];
      } else if (isset($inst["search"]) && is_array($inst["search"]) && isset($inst["search"]["total_flops"])) {
        $flops = (float)$inst["search"]["total_flops"];
      } else if (isset($inst["gpu_total_flops"])) {
        $flops = (float)$inst["gpu_total_flops"];
      }

      if ($asPlainArray) {
        $instances[] = [
          "id" => (string)($inst["id"] ?? ""),
          "label" => (string)($inst["label"] ?? ""),
          "status" => $status,
          "gpu_name" => trim(($arch !== "" ? ($arch . " ") : "") . $gpuName),
          "num_gpus" => (string)($inst["num_gpus"] ?? ""),
          "cost_per_hour" => $costPerHour,
          "public_ip" => (string)($inst["public_ipaddr"] ?? ""),
          "ssh_port" => $sshPort,
          "image" => (string)($inst["image"] ?? ""),
          "start" => $start,
          "total_flops_raw" => (string)$flops,
        ];
        continue;
      }

      $set = new DataSet();
      $set->addValue("id", (string)($inst["id"] ?? ""));
      $set->addValue("label", (string)($inst["label"] ?? ""));
      $set->addValue("status", $status);

      $set->addValue("gpu_name", trim(($arch !== "" ? ($arch . " ") : "") . $gpuName));
      $set->addValue("num_gpus", (string)($inst["num_gpus"] ?? ""));
      $set->addValue("cost_per_hour", $costPerHour);

      $set->addValue("public_ip", (string)($inst["public_ipaddr"] ?? ""));
      $set->addValue("ssh_port", $sshPort);

      $set->addValue("image", (string)($inst["image"] ?? ""));
      $set->addValue("start", $start);

      $set->addValue("total_flops_raw", (string)$flops);

      $instances[] = $set;
    }
  }

  return $instances;
}

/**
 * AJAX: poll instances (no template render)
 * GET /vastai.php?ajax=instances
 */
if (isset($_GET["ajax"]) && $_GET["ajax"] === "instances") {
  header("Content-Type: application/json; charset=utf-8");

  try {
    $api = new VastAiApi();
    $plain = vastBuildInstances($api, true);

    echo json_encode([
      "ok" => 1,
      "instances" => $plain,
      "ts" => time(),
    ]);
  } catch (Exception $e) {
    echo json_encode([
      "ok" => 0,
      "error" => "Vast.ai: " . $e->getMessage(),
      "ts" => time(),
    ]);
  }
  exit;
}

// Normal page render from here
Template::loadInstance("agents/vastai");
Menu::get()->setActive("agents_vastai");

UI::add("vastOffers", []);
UI::add("vastInstances", []);

// catch actions here...
if (isset($_POST["action"]) && CSRF::check($_POST["csrf"])) {
  $handler = new VastAiHandler();
  $handler->handle($_POST["action"], $_POST);

  // Keep current behaviour for now (we will remove refresh once JS intercepts actions)
  if (UI::getNumMessages() == 0 && $_POST["action"] != "vastSearch") {
    Util::refresh();
  }
}

try {
  $api = new VastAiApi();
  $instances = vastBuildInstances($api, false);
  UI::add("vastInstances", $instances);
} catch (Exception $e) {
  UI::addMessage("warning", "Vast.ai: " . $e->getMessage());
}

UI::add("pageTitle", "Rent Agents | Vast.ai");
echo Template::getInstance()->render(UI::getObjects());
