<?php

use DBA\Factory;
use DBA\QueryFilter;
use DBA\Config;
use DBA\RegVoucher;

class VastUtils {
    
    /**
     * Country code to continent mapping
     * @return array
     */
    public static function getContinentMapping() {
        return [
            // North America
            'US' => 'North America', 'CA' => 'North America', 'MX' => 'North America',
            'CR' => 'North America', 'PA' => 'North America', 'GT' => 'North America',
            'HN' => 'North America', 'SV' => 'North America', 'NI' => 'North America',
            'BZ' => 'North America', 'CU' => 'North America', 'DO' => 'North America',
            'HT' => 'North America', 'JM' => 'North America', 'PR' => 'North America',
            
            // South America
            'BR' => 'South America', 'AR' => 'South America', 'CL' => 'South America',
            'CO' => 'South America', 'PE' => 'South America', 'VE' => 'South America',
            'EC' => 'South America', 'BO' => 'South America', 'PY' => 'South America',
            'UY' => 'South America', 'GY' => 'South America', 'SR' => 'South America',
            'GF' => 'South America',
            
            // Europe
            'GB' => 'Europe', 'DE' => 'Europe', 'FR' => 'Europe', 'IT' => 'Europe',
            'ES' => 'Europe', 'NL' => 'Europe', 'BE' => 'Europe', 'CH' => 'Europe',
            'AT' => 'Europe', 'SE' => 'Europe', 'NO' => 'Europe', 'DK' => 'Europe',
            'FI' => 'Europe', 'PL' => 'Europe', 'CZ' => 'Europe', 'HU' => 'Europe',
            'RO' => 'Europe', 'BG' => 'Europe', 'GR' => 'Europe', 'PT' => 'Europe',
            'IE' => 'Europe', 'SK' => 'Europe', 'HR' => 'Europe', 'LT' => 'Europe',
            'LV' => 'Europe', 'EE' => 'Europe', 'SI' => 'Europe', 'LU' => 'Europe',
            'MT' => 'Europe', 'CY' => 'Europe', 'IS' => 'Europe', 'UA' => 'Europe',
            'RU' => 'Europe', 'BY' => 'Europe', 'MD' => 'Europe', 'AL' => 'Europe',
            'RS' => 'Europe', 'BA' => 'Europe', 'MK' => 'Europe', 'ME' => 'Europe',
            
            // Asia
            'CN' => 'Asia', 'JP' => 'Asia', 'IN' => 'Asia', 'KR' => 'Asia',
            'ID' => 'Asia', 'TH' => 'Asia', 'VN' => 'Asia', 'PH' => 'Asia',
            'MY' => 'Asia', 'SG' => 'Asia', 'TW' => 'Asia', 'HK' => 'Asia',
            'BD' => 'Asia', 'PK' => 'Asia', 'TR' => 'Asia', 'IR' => 'Asia',
            'IQ' => 'Asia', 'SA' => 'Asia', 'AE' => 'Asia', 'IL' => 'Asia',
            'KZ' => 'Asia', 'UZ' => 'Asia', 'MM' => 'Asia', 'KH' => 'Asia',
            'LA' => 'Asia', 'NP' => 'Asia', 'LK' => 'Asia', 'AF' => 'Asia',
            'MN' => 'Asia', 'KG' => 'Asia', 'TJ' => 'Asia', 'TM' => 'Asia',
            'JO' => 'Asia', 'LB' => 'Asia', 'SY' => 'Asia', 'YE' => 'Asia',
            'OM' => 'Asia', 'KW' => 'Asia', 'QA' => 'Asia', 'BH' => 'Asia',
            
            // Africa
            'ZA' => 'Africa', 'EG' => 'Africa', 'NG' => 'Africa', 'KE' => 'Africa',
            'MA' => 'Africa', 'TN' => 'Africa', 'DZ' => 'Africa', 'LY' => 'Africa',
            'ET' => 'Africa', 'TZ' => 'Africa', 'UG' => 'Africa', 'GH' => 'Africa',
            'SN' => 'Africa', 'CI' => 'Africa', 'CM' => 'Africa', 'ZW' => 'Africa',
            'ZM' => 'Africa', 'MW' => 'Africa', 'BW' => 'Africa', 'MZ' => 'Africa',
            'AO' => 'Africa', 'SD' => 'Africa', 'MG' => 'Africa', 'RW' => 'Africa',
            
            // Oceania
            'AU' => 'Oceania', 'NZ' => 'Oceania', 'FJ' => 'Oceania', 'PG' => 'Oceania',
            'NC' => 'Oceania', 'PF' => 'Oceania', 'WS' => 'Oceania', 'TO' => 'Oceania',
        ];
    }
    
    /**
     * Get country codes for a continent
     * @param string $continent Continent name
     * @return array Array of country codes
     */
    public static function getCountryCodesForContinent($continent) {
        if ($continent === 'Planet Earth' || empty($continent)) {
            return []; // No filtering
        }
        
        $mapping = self::getContinentMapping();
        $codes = [];
        
        foreach ($mapping as $code => $cont) {
            if ($cont === $continent) {
                $codes[] = $code;
            }
        }
        
        return $codes;
    }
    
    /**
     * @param int $length Length of voucher string
     * @param int $maxAttempts Maximum attempts to find unique voucher
     * @return string
     * @throws HTException if unable to generate unique voucher
     */
    public static function generateUniqueVoucher($length = 10, $maxAttempts = 5) {
        for ($i = 0; $i < $maxAttempts; $i++) {
            $voucher = Util::randomString($length);
            $qF = new QueryFilter(RegVoucher::VOUCHER, $voucher, "=");
            $existing = Factory::getRegVoucherFactory()->filter([Factory::FILTER => $qF]);
            
            if (sizeof($existing) == 0) {
                return $voucher;
            }
        }
        
        throw new HTException("Could not generate a unique voucher after $maxAttempts attempts!");
    }
    
    /**
     * @param int|null $vastInstanceId Vast.ai instance ID
     * @return string The voucher key
     */
    public static function createVoucherForVast($vastInstanceId = null) {
        $voucher = self::generateUniqueVoucher();
        $key = htmlentities($voucher, ENT_QUOTES, "UTF-8");
        $regVoucher = new RegVoucher(null, $key, time(), $vastInstanceId, null);
        Factory::getRegVoucherFactory()->save($regVoucher);
        error_log("[VastUtils] Created voucher: $key for Vast.ai instance: " . ($vastInstanceId ?: 'pending'));
        return $key;
    }
    
    /**
     * Get Hashtopolis base URL from config
     * @return string Base URL without trailing slash
     */
    public static function getHashtopolisUrl() {
        $qF = new QueryFilter(Config::ITEM, "baseUrl", "=");
        $config = Factory::getConfigFactory()->filter([Factory::FILTER => $qF], true);
        
        if ($config != null && !empty($config->getValue())) {
            return rtrim($config->getValue(), '/');
        }
        
        // Fallback: automatic detection from current request
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
        $host = $_SERVER['HTTP_HOST'];
        return $protocol . $host;
    }
    
    /**
     * Build onstart script for Vast.ai agent auto-registration
     * @param string $hashtopolisUrl Base Hashtopolis URL
     * @param string $voucher Registration voucher
     * @return string Shell script for onstart
     */
    public static function buildAgentOnstart($hashtopolisUrl, $voucher) {
        $url = rtrim($hashtopolisUrl, '/');
        return "curl \"$url/agents.php?download=1\" -o /tmp/hashtopolis.zip && python3 /tmp/hashtopolis.zip --url \"$url/api/server.php\" --voucher \"$voucher\"";
    }
    
    /**
     * Get voucher by Vast instance ID
     * @param int $vastInstanceId
     * @return RegVoucher|null
     */
    public static function getVoucherByInstanceId($vastInstanceId) {
        $qF = new QueryFilter(RegVoucher::VAST_INSTANCE_ID, $vastInstanceId, "=");
        $vouchers = Factory::getRegVoucherFactory()->filter([Factory::FILTER => $qF]);
        return sizeof($vouchers) > 0 ? $vouchers[0] : null;
    }
    
    /**
     * Update voucher with Vast instance ID
     * @param RegVoucher $voucher
     * @param int $instanceId
     */
    public static function updateVoucherWithInstanceId($voucher, $instanceId) {
        Factory::getRegVoucherFactory()->set($voucher, RegVoucher::VAST_INSTANCE_ID, $instanceId);
        error_log("[VastUtils] Linked voucher {$voucher->getVoucher()} to Vast instance $instanceId");
    }
    
    /**
     * Delete agent and voucher associated with Vast instance
     * @param int $vastInstanceId
     * @throws HTException if cleanup fails
     */
    public static function cleanupVastInstance($vastInstanceId) {
        $voucher = self::getVoucherByInstanceId($vastInstanceId);
        
        if ($voucher === null) {
            error_log("[VastUtils] No voucher found for Vast instance $vastInstanceId");
            return;
        }
        
        $agentId = $voucher->getAgentId();
        
        if ($agentId === null) {
            error_log("[VastUtils] Voucher found but no agent registered yet for instance $vastInstanceId");
            Factory::getRegVoucherFactory()->delete($voucher);
            return;
        }
        
        $agent = Factory::getAgentFactory()->get($agentId);
        if ($agent === null) {
            error_log("[VastUtils] Agent $agentId not found (already deleted?)");
            Factory::getRegVoucherFactory()->delete($voucher);
            return;
        }
        
        error_log("[VastUtils] Deleting agent {$agent->getAgentName()} (ID: $agentId) for Vast instance $vastInstanceId");
        
        try {
            AgentUtils::deleteDependencies($agent);
            Factory::getRegVoucherFactory()->delete($voucher);
            error_log("[VastUtils] Successfully deleted agent $agentId and voucher");
        } catch (Exception $e) {
            error_log("[VastUtils] Error deleting agent $agentId: " . $e->getMessage());
            throw new HTException("Failed to cleanup agent: " . $e->getMessage());
        }
    }
    
    /**
     * Get Vast.ai API key from config
     * @return string
     * @throws HTException if not configured
     */
    public static function getVastApiKey() {
        $qF = new QueryFilter(Config::ITEM, DConfig::VAST_API_KEY, "=");
        $config = Factory::getConfigFactory()->filter([Factory::FILTER => $qF], true);

        if ($config == null || empty($config->getValue())) {
            throw new HTException("Vast.ai API key not configured. Please set it in Server Configuration.");
        }

        return $config->getValue();
    }
    
    /**
     * Get Vast.ai default image from config
     * @return string
     * @throws HTException if not configured
     */
    public static function getVastImage() {
        $qF = new QueryFilter(Config::ITEM, DConfig::VAST_IMAGE, "=");
        $config = Factory::getConfigFactory()->filter([Factory::FILTER => $qF], true);

        if ($config == null || empty($config->getValue())) {
            throw new HTException("Vast.ai default image not configured. Please set it in Server Configuration.");
        }

        return $config->getValue();
    }
    
    /**
     * Call Vast.ai API
     * @param string $endpoint API endpoint (e.g., '/bundles/')
     * @param string $method HTTP method (GET, POST, PUT, DELETE)
     * @param array|null $data Request payload
     * @return array Decoded JSON response
     * @throws HTException on API errors
     */
    public static function callVastApi($endpoint, $method = 'GET', $data = null) {
        $apiKey = self::getVastApiKey();
        $url = 'https://console.vast.ai/api/v0' . $endpoint;

        error_log("[VastUtils] ===== VAST.AI API CALL =====");
        error_log("[VastUtils] URL: $url");
        error_log("[VastUtils] Method: $method");
        error_log("[VastUtils] Payload: " . json_encode($data));

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
            'Accept: application/json'
        ]);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($data !== null) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        } else if ($method === 'PUT') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
            if ($data !== null) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        } else if ($method === 'DELETE') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        error_log("[VastUtils] Response HTTP Code: $httpCode");
        
        // Only log first 2000 chars of response (it can be huge)
        $responsePreview = strlen($response) > 2000 ? substr($response, 0, 2000) . '...[TRUNCATED]' : $response;
        $responsePreview = str_replace($apiKey, '[REDACTED]', $responsePreview);
        error_log("[VastUtils] Response Preview: " . $responsePreview);
        
        // Decode and count offers
        $decoded = json_decode($response, true);
        if (isset($decoded['offers'])) {
            error_log("[VastUtils] Offers in API response: " . count($decoded['offers']));
            
            // Sample first 3 offers for debugging
            if (count($decoded['offers']) > 0) {
                $sampleCount = min(3, count($decoded['offers']));
                for ($i = 0; $i < $sampleCount; $i++) {
                    $offer = $decoded['offers'][$i];
                    error_log("[VastUtils] Sample offer #" . ($i + 1) . ": " .
                              "ID=" . ($offer['id'] ?? 'N/A') . 
                              ", GPU=" . ($offer['gpu_name'] ?? 'N/A') . 
                              ", Verification=" . ($offer['verification'] ?? 'N/A') . 
                              ", Hosting=" . ($offer['hosting_type'] ?? 'N/A') .
                              ", Price=$" . ($offer['dph_total'] ?? 'N/A'));
                }
            }
        }
        error_log("[VastUtils] ================================");

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new HTException("Vast.ai API error: " . $error);
        }

        curl_close($ch);

        if ($httpCode >= 400) {
            $errorMsg = isset($decoded['msg']) ? $decoded['msg'] : 'Unknown error';
            throw new HTException("Vast.ai API returned error (HTTP $httpCode): " . $errorMsg);
        }

        return $decoded;
    }
    
    /**
     * Build default filters for searching GPU offers
     * @param array $overrides Optional filter overrides from request
     * @return array Complete filters array with proper structure
     */
    public static function buildOfferFilters($overrides = []) {
        error_log("[VastUtils] ===== BUILD OFFER FILTERS =====");
        error_log("[VastUtils] Input overrides: " . json_encode($overrides));
        
        // Extract and validate limit
        $limit = 100; // default
        if (isset($overrides['limit'])) {
            $limit = intval($overrides['limit']);
            $limit = max(1, min(1000, $limit));
            unset($overrides['limit']);
        }
        
        $filters = [
            'limit' => $limit,
            'rentable' => ['eq' => true],
            'rented' => ['eq' => false]
        ];
        
        // Add instance type if specified
        if (isset($overrides['type'])) {
            $filters['type'] = $overrides['type'];
            unset($overrides['type']);
        } else {
            $filters['type'] = 'on-demand';
        }
        
        // Handle continent filtering (not supported by API - will be client-side)
        if (isset($overrides['continent'])) {
            error_log("[VastUtils] Removing continent filter (client-side only): " . $overrides['continent']);
            unset($overrides['continent']);
        }
        
        // Handle datacenter filtering (not supported by API - will be client-side)
        if (isset($overrides['datacenter_only'])) {
            error_log("[VastUtils] Removing datacenter_only filter (client-side only): " . $overrides['datacenter_only']);
            unset($overrides['datacenter_only']);
        }
        
        // Merge remaining overrides at top level
        foreach ($overrides as $key => $value) {
            $filters[$key] = $value;
        }
        
        error_log("[VastUtils] Final filters to send to Vast.ai API: " . json_encode($filters));
        error_log("[VastUtils] =====================================");
        
        return $filters;
    }
    
    /**
     * Search for GPU offers on Vast.ai
     * @param array $filters Search filters
     * @return array List of offers
     * @throws HTException on API errors
     */
    public static function searchOffers($filters = []) {
        $filters = self::buildOfferFilters($filters);
        error_log("[VastUtils] Searching offers with filters: " . json_encode($filters));
        
        $result = self::callVastApi('/bundles/', 'POST', $filters);
        $offers = $result['offers'] ?? [];
        
        error_log("[VastUtils] Returning " . count($offers) . " offers to handler");
        
        return $offers;
    }
    
    /**
     * Get list of current instances
     * @return array Instance data with instances array and count
     * @throws HTException on API errors
     */
    public static function listInstances() {
        $result = self::callVastApi('/instances/', 'GET');
        return [
            'instances' => $result['instances'] ?? [],
            'instances_found' => $result['instances_found'] ?? 0
        ];
    }
    
    /**
     * Create a new Vast.ai instance
     * @param int $offerId Offer ID to rent
     * @param array $options Instance configuration options
     * @return array Result with instance_id and voucher
     * @throws HTException on API or validation errors
     */
    public static function createInstance($offerId, $options = []) {
        if ($offerId <= 0) {
            throw new HTException("Invalid offer ID.");
        }
        
        $image = self::getVastImage();
        $label = $options['label'] ?? 'agent-' . time();
        
        // Generate voucher
        $voucher = self::generateUniqueVoucher();
        $key = htmlentities($voucher, ENT_QUOTES, "UTF-8");
        $regVoucher = new RegVoucher(null, $key, time(), null, null);
        Factory::getRegVoucherFactory()->save($regVoucher);
        
        // Build onstart script
        $hashtopolisUrl = self::getHashtopolisUrl();
        $onstart = self::buildAgentOnstart($hashtopolisUrl, $voucher);
        
        // Build instance creation payload
        $payload = [
            'image' => $image,
            'disk' => $options['disk'] ?? 10,
            'label' => $label,
            'runtype' => $options['runtype'] ?? 'ssh',
            'onstart' => $onstart,
        ];
        
        // Add optional parameters
        $optionalFields = ['env', 'jupyter_dir', 'use_jupyter_lab', 'python_utf8', 'lang_utf8', 'price'];
        foreach ($optionalFields as $field) {
            if (isset($options[$field])) {
                $payload[$field] = $options[$field];
            }
        }
        
        error_log("[VastUtils] Creating instance from offer $offerId with payload: " . json_encode($payload));
        
        $result = self::callVastApi('/asks/' . $offerId . '/', 'PUT', $payload);
        
        if (isset($result['success']) && $result['success']) {
            $instanceId = $result['new_contract'] ?? null;
            
            // Update voucher with instance ID
            if ($instanceId) {
                self::updateVoucherWithInstanceId($regVoucher, $instanceId);
            }
            
            return [
                'success' => true,
                'instance_id' => $instanceId,
                'voucher' => $voucher,
                'message' => 'Instance created successfully! Agent will auto-register with voucher: ' . $voucher
            ];
        } else {
            // If instance creation failed, delete the orphaned voucher
            Factory::getRegVoucherFactory()->delete($regVoucher);
            throw new HTException($result['msg'] ?? 'Failed to create instance');
        }
    }
    
    /**
     * Destroy a Vast.ai instance and cleanup associated resources
     * @param int $instanceId Instance ID to destroy
     * @return array Result with success message
     * @throws HTException on errors
     */
    public static function destroyInstance($instanceId) {
        if ($instanceId <= 0) {
            throw new HTException("Invalid instance ID.");
        }
        
        // Clean up agent and voucher first
        try {
            self::cleanupVastInstance($instanceId);
        } catch (Exception $e) {
            error_log("[VastUtils] Agent cleanup failed: " . $e->getMessage());
            // Continue with instance destruction anyway
        }
        
        // Destroy the Vast instance
        $result = self::callVastApi('/instances/' . $instanceId . '/', 'DELETE');
        
        return [
            'success' => true,
            'message' => ($result['msg'] ?? 'Instance destroyed successfully') . ' Agent cleaned up.'
        ];
    }
    
    /**
     * Get current user information from Vast.ai
     * @return array User data
     * @throws HTException on API errors
     */
    public static function getUserInfo() {
        return self::callVastApi('/users/current/', 'GET');
    }
}