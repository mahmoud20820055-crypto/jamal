<?php
// فحص سريع للاستضافة: افتح /api/health.php بعد الرفع.
declare(strict_types=1);
require __DIR__ . '/lib.php';

$cfg = require __DIR__ . '/config.php';
$dir = dirname($cfg['db_path']);
$res = [
    'php' => PHP_VERSION,
    'php_ok' => version_compare(PHP_VERSION, '8.1', '>='),
    'pdo_sqlite' => extension_loaded('pdo_sqlite'),
    'data_dir_writable' => is_dir($dir) ? is_writable($dir) : is_writable(dirname($dir)),
    'setup_key_changed' => $cfg['setup_key'] !== 'CHANGE-ME-before-upload',
    'sessions' => function_exists('session_start'),
];
$res['db_ok'] = false;
if ($res['pdo_sqlite']) {
    try {
        $pdo = db(); // ينشئ الجداول
        $res['sqlite_version'] = $pdo->query('SELECT sqlite_version()')->fetchColumn();
        // نفس الاستعلامات اللي بتستعملها لوحة المدير
        $pdo->query("SELECT COUNT(*) FROM conversations WHERE status = 'open'")->fetchColumn();
        $pdo->query("SELECT CASE WHEN category = '' THEN 'x' ELSE category END, COUNT(*) FROM conversations GROUP BY 1")->fetchAll();
        $pdo->query("SELECT date(created_at, 'unixepoch', 'localtime') FROM conversations LIMIT 1")->fetchAll();
        $res['admin_ready'] = setting('admin_hash') !== null;
        $res['db_ok'] = true;
    } catch (Throwable $e) {
        $res['db_error'] = $e->getMessage();
    }
}
$res['ok'] = $res['php_ok'] && $res['pdo_sqlite'] && $res['db_ok'] && $res['setup_key_changed'] && $res['sessions'];
echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
