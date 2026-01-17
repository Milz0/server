<?php

require_once(dirname(__FILE__) . "/inc/load.php");

if (!Login::getInstance()->isLoggedin()) {
  header("Location: index.php?err=4" . time() . "&fw=" . urlencode($_SERVER["PHP_SELF"] . "?" . $_SERVER["QUERY_STRING"]));
  die();
}

AccessControl::getInstance()->checkPermission(DViewControl::AGENTS_VIEW_PERM);

Template::loadInstance("agents/vastai");
Menu::get()->setActive("agents_vastai");

UI::add("vastOffers", []);
UI::add("vastInstances", []);

// catch actions here...
if (isset($_POST["action"]) && CSRF::check($_POST["csrf"])) {
  $handler = new VastAiHandler();
  $handler->handle($_POST["action"], $_POST);

  if (UI::getNumMessages() == 0 && $_POST["action"] != "vastSearch") {
    Util::refresh();
  }
}

try {
  $api = new VastAiApi();
  $res = $api->listInstances();

  $instancesRaw = $res["instances"] ?? [];
  $instances = [];

  if (is_array($instancesRaw)) {
    foreach ($instancesRaw as $inst) {
      if (!is_array($inst)) {
        continue;
      }

      $status =
        (string)($inst["actual_status"] ?? "") !== "" ? (string)$inst["actual_status"] : ((string)($inst["status"] ?? "") !== "" ? (string)$inst["status"] :
          (string)($inst["state"] ?? ""));

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

      $instances[] = $set;
    }
  }

  UI::add("vastInstances", $instances);
} catch (Exception $e) {
  UI::addMessage("warning", "Vast.ai: " . $e->getMessage());
}

UI::add("pageTitle", "Rent Agents | Vast.ai");
echo Template::getInstance()->render(UI::getObjects());
