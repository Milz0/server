<?php

namespace DBA;

class RegVoucher extends AbstractModel {
  private $regVoucherId;
  private $voucher;
  private $time;
  private $vastInstanceId;
  private $agentId;
  
  function __construct($regVoucherId, $voucher, $time, $vastInstanceId = null, $agentId = null) {
    $this->regVoucherId = $regVoucherId;
    $this->voucher = $voucher;
    $this->time = $time;
    $this->vastInstanceId = $vastInstanceId;
    $this->agentId = $agentId;
  }
  
  function getKeyValueDict() {
    $dict = array();
    $dict['regVoucherId'] = $this->regVoucherId;
    $dict['voucher'] = $this->voucher;
    $dict['time'] = $this->time;
    $dict['vastInstanceId'] = $this->vastInstanceId;
    $dict['agentId'] = $this->agentId;
    
    return $dict;
  }
  
  static function getFeatures() {
    $dict = array();
    $dict['regVoucherId'] = ['read_only' => True, "type" => "int", "subtype" => "unset", "choices" => "unset", "null" => False, "pk" => True, "protected" => True, "private" => False, "alias" => "regVoucherId"];
    $dict['voucher'] = ['read_only' => False, "type" => "str(100)", "subtype" => "unset", "choices" => "unset", "null" => False, "pk" => False, "protected" => False, "private" => False, "alias" => "voucher"];
    $dict['time'] = ['read_only' => True, "type" => "int64", "subtype" => "unset", "choices" => "unset", "null" => False, "pk" => False, "protected" => True, "private" => False, "alias" => "time"];
    $dict['vastInstanceId'] = ['read_only' => False, "type" => "int", "subtype" => "unset", "choices" => "unset", "null" => True, "pk" => False, "protected" => False, "private" => False, "alias" => "vastInstanceId"];
    $dict['agentId'] = ['read_only' => False, "type" => "int", "subtype" => "unset", "choices" => "unset", "null" => True, "pk" => False, "protected" => False, "private" => False, "alias" => "agentId"];

    return $dict;
  }

  function getPrimaryKey() {
    return "regVoucherId";
  }
  
  function getPrimaryKeyValue() {
    return $this->regVoucherId;
  }
  
  function getId() {
    return $this->regVoucherId;
  }
  
  function setId($id) {
    $this->regVoucherId = $id;
  }
  
  /**
   * Used to serialize the data contained in the model
   * @return array
   */
  public function expose() {
    return get_object_vars($this);
  }
  
  function getVoucher() {
    return $this->voucher;
  }
  
  function setVoucher($voucher) {
    $this->voucher = $voucher;
  }
  
  function getTime() {
    return $this->time;
  }
  
  function setTime($time) {
    $this->time = $time;
  }
  
  function getVastInstanceId() {
    return $this->vastInstanceId;
  }
  
  function setVastInstanceId($vastInstanceId) {
    $this->vastInstanceId = $vastInstanceId;
  }
  
  function getAgentId() {
    return $this->agentId;
  }
  
  function setAgentId($agentId) {
    $this->agentId = $agentId;
  }
  
  const REG_VOUCHER_ID = "regVoucherId";
  const VOUCHER = "voucher";
  const TIME = "time";
  const VAST_INSTANCE_ID = "vastInstanceId";
  const AGENT_ID = "agentId";

  const PERM_CREATE = "permRegVoucherCreate";
  const PERM_READ = "permRegVoucherRead";
  const PERM_UPDATE = "permRegVoucherUpdate";
  const PERM_DELETE = "permRegVoucherDelete";
}
