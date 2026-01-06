<?php

namespace App\Services;

class AgoraService
{
    protected $appId;
    protected $appCertificate;

    public function __construct()
    {
        $this->appId = config('services.agora.app_id');
        $this->appCertificate = config('services.agora.app_certificate');
    }

    /**
     * Generate Agora RTC Token
     * 
     * @param string $channelName The channel name
     * @param int $uid User ID
     * @param string $role 'publisher' or 'subscriber'
     * @param int $expireTime Token expiry time in seconds
     * @return string The generated token
     */
    public function generateToken(string $channelName, int $uid, string $role = 'publisher', int $expireTime = 3600): string
    {
        if (empty($this->appCertificate)) {
            // If no certificate, return a placeholder (for testing)
            return 'test_token_' . $channelName . '_' . $uid;
        }

        $currentTime = time();
        $privilegeExpireTime = $currentTime + $expireTime;

        // Build token using Agora Token Builder
        $token = $this->buildTokenWithUid(
            $this->appId,
            $this->appCertificate,
            $channelName,
            $uid,
            $role,
            $privilegeExpireTime
        );

        return $token;
    }

    /**
     * Build RTC Token with UID
     * Based on Agora's token generation algorithm
     */
    private function buildTokenWithUid(
        string $appId,
        string $appCertificate,
        string $channelName,
        int $uid,
        string $role,
        int $privilegeExpireTime
    ): string {
        $message = $this->packMessage($uid, $role, $privilegeExpireTime);
        $signature = $this->generateSignature($appCertificate, $appId, $channelName, $uid, $message);
        
        $content = $this->packContent($signature, $uid, $message);
        
        return $this->generateToken006($appId, $content);
    }

    /**
     * Pack privilege message
     */
    private function packMessage(int $uid, string $role, int $privilegeExpireTime): string
    {
        $privileges = [];
        
        // Define privilege bits based on role
        // 1: kJoinChannel
        // 2: kPublishAudioStream  
        // 3: kPublishVideoStream
        // 4: kPublishDataStream
        
        if ($role === 'publisher') {
            $privileges[1] = $privilegeExpireTime; // Join channel
            $privileges[2] = $privilegeExpireTime; // Publish audio
            $privileges[3] = $privilegeExpireTime; // Publish video
            $privileges[4] = $privilegeExpireTime; // Publish data
        } else {
            $privileges[1] = $privilegeExpireTime; // Join channel only
        }

        $message = '';
        $message .= pack('V', time()); // salt (timestamp)
        $message .= pack('V', time()); // ts
        $message .= pack('v', count($privileges)); // privilege count
        
        foreach ($privileges as $key => $value) {
            $message .= pack('v', $key);
            $message .= pack('V', $value);
        }

        return $message;
    }

    /**
     * Generate signature
     */
    private function generateSignature(
        string $appCertificate,
        string $appId,
        string $channelName,
        int $uid,
        string $message
    ): string {
        $data = $appId . $channelName . strval($uid) . $message;
        return hash_hmac('sha256', $data, $appCertificate, true);
    }

    /**
     * Pack content
     */
    private function packContent(string $signature, int $uid, string $message): string
    {
        $content = '';
        $content .= pack('v', strlen($signature)) . $signature;
        $content .= pack('V', $uid);
        $content .= pack('v', strlen($message)) . $message;
        
        return $content;
    }

    /**
     * Generate final token (version 006)
     */
    private function generateToken006(string $appId, string $content): string
    {
        $version = '006';
        $compressed = gzcompress($content);
        $base64Content = base64_encode($compressed);
        
        // Make URL safe
        $base64Content = str_replace(['+', '/'], ['-', '_'], $base64Content);
        
        return $version . $appId . $base64Content;
    }

    /**
     * Validate if a channel name is valid
     */
    public function isValidChannelName(string $channelName): bool
    {
        // Channel name should be alphanumeric and underscore only
        // Length should be 1-64 characters
        return preg_match('/^[a-zA-Z0-9_]{1,64}$/', $channelName) === 1;
    }

    /**
     * Generate a unique channel name
     */
    public function generateChannelName(string $prefix = 'consultation'): string
    {
        return $prefix . '_' . uniqid() . '_' . time();
    }

    /**
     * Get App ID for client
     */
    public function getAppId(): string
    {
        return $this->appId ?? '';
    }
}
