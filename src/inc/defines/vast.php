<?php

class DVastAction {
  const LIST_OFFERS      = "listOffers";
  const LIST_OFFERS_PERM = DAccessControl::SERVER_CONFIG_ACCESS;

  const CREATE_INSTANCE      = "createInstance";
  const CREATE_INSTANCE_PERM = DAccessControl::SERVER_CONFIG_ACCESS;

  const LIST_INSTANCES      = "listInstances";
  const LIST_INSTANCES_PERM = DAccessControl::SERVER_CONFIG_ACCESS;

  const GET_INSTANCE_AGENT_STATS      = "getInstanceAgentStats";
  const GET_INSTANCE_AGENT_STATS_PERM = DAccessControl::SERVER_CONFIG_ACCESS;

  const DESTROY_INSTANCE      = "destroyInstance";
  const DESTROY_INSTANCE_PERM = DAccessControl::SERVER_CONFIG_ACCESS;

  const GET_USER_INFO      = "getUserInfo";
  const GET_USER_INFO_PERM = DAccessControl::SERVER_CONFIG_ACCESS;

  const AUTO_DESTROY_CHECK      = "autoDestroyCheck";
  const AUTO_DESTROY_CHECK_PERM = DAccessControl::SERVER_CONFIG_ACCESS;
}