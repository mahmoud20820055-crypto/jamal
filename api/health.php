<?php
// فحص سريع للاستضافة: افتح /api/health.php بعد الرفع.
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$cfg = require __DIR__ . '/config.php';
$dir = dirname($cfg['db_path']);
$res = [
    'php' => PHP_VERSION,
    'php_ok' => version_compare(PHP_VERSION, '8.1', '>='),
    'pdo_sqlite' => extension_loaded('pdo_sqlite'),
    'data_dir_writable' => is_dir($dir) ? is_writable($dir) : is_writable(dirname($dir)),
    'setup_key_changed' => $cfg['setup_key'] !== 'CHANGE-ME-before-upload',
];
$res['db_ok'] = false;
if ($res['pdo_sqlite']) {
    try {
        if (!is_dir($dir)) mkdir($dir, 0750, true);
        $pdo = new PDO('sqlite:' . $cfg['db_path']);
        $pdo->query('SELECT 1');
        $res['db_ok'] = true;
    } catch (Throwable $e) {
        $res['db_error'] = 'cannot_open_db';
    }
}
$res['ok'] = $res['php_ok'] && $res['pdo_sqlite'] && $res['db_ok'] && $res['setup_key_changed'];
echo json_encode($res, JSON_PRETTY_PRINT);
