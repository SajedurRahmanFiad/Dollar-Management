<?php
declare(strict_types=1);

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/auth_helper.php';

$db = Database::getConnection();

echo "=== Dollar Exchange Management - Database Seeder ===\n\n";

// 1. Create customers
echo "Seeding customers...\n";
$customers = [
    ['name' => 'Tanvir Ahmed', 'phone' => '+880 1711-234567', 'location' => 'Gulshan 2, Dhaka', 'notes' => 'Major SaaS & software importer. Reliable payer, prefers BRAC Bank or City Bank.', 'preferred_channel' => 'WhatsApp', 'avatar_color' => 'bg-blue-600', 'created_at' => '2026-06-10 10:00:00'],
    ['name' => 'Nusrat Jahan', 'phone' => '+880 1819-876543', 'location' => 'Banani, Dhaka', 'notes' => 'Digital agency founder. Buys $1,500-$3,000 bi-weekly for Facebook and Google ad spends.', 'preferred_channel' => 'Telegram', 'avatar_color' => 'bg-emerald-600', 'created_at' => '2026-07-02 14:30:00'],
    ['name' => 'Rafiqul Islam', 'phone' => '+880 1912-334455', 'location' => 'Agrabad, Chattogram', 'notes' => 'Import goods merchant. Deals in bulk $2,000-$5,000. Pays via bKash Merchant and BEFTN.', 'preferred_channel' => 'Phone', 'avatar_color' => 'bg-amber-600', 'created_at' => '2026-07-15 09:15:00'],
    ['name' => 'Farhan Chowdhury', 'phone' => '+880 1622-998877', 'location' => 'Uttara Sector 7, Dhaka', 'notes' => 'Tech consultant. Occasional large purchases. Very communicative on WhatsApp.', 'preferred_channel' => 'WhatsApp', 'avatar_color' => 'bg-violet-600', 'created_at' => '2026-08-01 11:45:00'],
    ['name' => 'Tahmid Rahman', 'phone' => '+880 1755-443322', 'location' => 'Dhanmondi, Dhaka', 'notes' => 'Cloud architect. Regular small-to-medium transfers for cloud infrastructure.', 'preferred_channel' => 'Messenger', 'avatar_color' => 'bg-cyan-600', 'created_at' => '2026-08-10 16:20:00'],
    ['name' => 'Shuvo Karim', 'phone' => '+880 1533-112233', 'location' => 'Mirpur DOHS, Dhaka', 'notes' => 'New client referred by Tanvir Ahmed. Needs USD for advertising credits.', 'preferred_channel' => 'WhatsApp', 'avatar_color' => 'bg-rose-600', 'created_at' => '2026-08-25 08:00:00'],
];

$stmt = $db->prepare('INSERT INTO customers (name, phone, location, notes, preferred_channel, avatar_color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
foreach ($customers as $c) {
    $stmt->execute([$c['name'], $c['phone'], $c['location'], $c['notes'], $c['preferred_channel'], $c['avatar_color'], $c['created_at']]);
}
echo "  - Inserted " . count($customers) . " customers\n";

// 2. Create requests
echo "Seeding requests...\n";
$requests = [
    ['request_number' => 'REQ-108', 'customer_id' => 5, 'requested_usd_amount' => 3500, 'target_rate' => 122.80, 'notes' => 'Urgent USD needed for annual AWS Reserved Instances renewal. Payment ready in City Bank.', 'status' => 'pending', 'preferred_channel' => 'Messenger', 'created_at' => date('Y-m-d H:i:s', strtotime('-8 hours'))],
    ['request_number' => 'REQ-109', 'customer_id' => 6, 'requested_usd_amount' => 1200, 'target_rate' => 123.00, 'notes' => 'Facebook Ad Account prepaid top-up. Can pay via bKash immediately.', 'status' => 'pending', 'preferred_channel' => 'WhatsApp', 'created_at' => date('Y-m-d H:i:s', strtotime('-2 hours'))],
    ['request_number' => 'REQ-107', 'customer_id' => 2, 'requested_usd_amount' => 1500, 'target_rate' => 122.50, 'notes' => 'Agency advertising budget.', 'status' => 'converted', 'preferred_channel' => 'Telegram', 'created_at' => date('Y-m-d H:i:s', strtotime('-6 hours'))],
];

$stmt = $db->prepare('INSERT INTO requests (request_number, customer_id, requested_usd_amount, target_rate, notes, status, preferred_channel, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
foreach ($requests as $r) {
    $stmt->execute([$r['request_number'], $r['customer_id'], $r['requested_usd_amount'], $r['target_rate'], $r['notes'], $r['status'], $r['preferred_channel'], $r['created_at']]);
}
echo "  - Inserted " . count($requests) . " requests\n";

// 3. Create deals
echo "Seeding deals...\n";
$deals = [
    // DL-2405 - Partially paid, Rafiqul
    ['deal_number' => 'DL-2405', 'customer_id' => 3, 'dollar_amount' => 2000, 'exchange_rate' => 123.00, 'expected_bdt_amount' => 246000, 'paid_amount' => 150000, 'due_amount' => 96000, 'status' => 'partially_paid', 'notes' => 'Customer transferred initial ৳150,000. Recently submitted second receipt of ৳96,000 for final settlement.', 'confirmed_at' => date('Y-m-d H:i:s', strtotime('-2 days')), 'created_at' => date('Y-m-d H:i:s', strtotime('-2 days'))],
    // DL-2404 - Awaiting confirmation, Nusrat
    ['deal_number' => 'DL-2404', 'customer_id' => 2, 'dollar_amount' => 1500, 'exchange_rate' => 122.50, 'expected_bdt_amount' => 183750, 'paid_amount' => 0, 'due_amount' => 0, 'status' => 'awaiting_confirmation', 'notes' => 'Converted from inquiry REQ-107. $1,500 transferred to Wise account.', 'linked_request_id' => 3, 'dollar_proof_uploaded_at' => date('Y-m-d H:i:s', strtotime('-4 hours')), 'created_at' => date('Y-m-d H:i:s', strtotime('-5 hours'))],
    // DL-2406 - Active due, Tanvir
    ['deal_number' => 'DL-2406', 'customer_id' => 1, 'dollar_amount' => 4000, 'exchange_rate' => 123.20, 'expected_bdt_amount' => 492800, 'paid_amount' => 0, 'due_amount' => 492800, 'status' => 'active_due', 'notes' => 'Large purchase for quarterly SaaS billings. Expected to pay via BRAC Bank wire within 5 days.', 'confirmed_at' => date('Y-m-d H:i:s', strtotime('-3 days')), 'created_at' => date('Y-m-d H:i:s', strtotime('-3 days'))],
    // DL-2403 - Partially paid, Farhan
    ['deal_number' => 'DL-2403', 'customer_id' => 4, 'dollar_amount' => 3200, 'exchange_rate' => 122.00, 'expected_bdt_amount' => 390400, 'paid_amount' => 200000, 'due_amount' => 190400, 'status' => 'partially_paid', 'notes' => 'Split payment agreed: ৳200k upfront, remaining ৳190.4k this weekend.', 'confirmed_at' => date('Y-m-d H:i:s', strtotime('-6 days')), 'created_at' => date('Y-m-d H:i:s', strtotime('-6 days'))],
    // DL-2402 - Completed, Tanvir
    ['deal_number' => 'DL-2402', 'customer_id' => 1, 'dollar_amount' => 5000, 'exchange_rate' => 121.80, 'expected_bdt_amount' => 609000, 'paid_amount' => 609000, 'due_amount' => 0, 'status' => 'completed', 'notes' => 'Completed in full with zero disputes. Smooth transaction.', 'confirmed_at' => date('Y-m-d H:i:s', strtotime('-14 days')), 'completed_at' => date('Y-m-d H:i:s', strtotime('-12 days')), 'created_at' => date('Y-m-d H:i:s', strtotime('-14 days'))],
    // DL-2401 - Completed, Tahmid
    ['deal_number' => 'DL-2401', 'customer_id' => 5, 'dollar_amount' => 850, 'exchange_rate' => 123.50, 'expected_bdt_amount' => 104975, 'paid_amount' => 104975, 'due_amount' => 0, 'status' => 'completed', 'confirmed_at' => date('Y-m-d H:i:s', strtotime('-20 days')), 'completed_at' => date('Y-m-d H:i:s', strtotime('-19 days')), 'created_at' => date('Y-m-d H:i:s', strtotime('-20 days'))],
];

$stmt = $db->prepare('INSERT INTO deals (deal_number, customer_id, dollar_amount, exchange_rate, expected_bdt_amount, paid_amount, due_amount, status, notes, linked_request_id, dollar_proof_uploaded_at, confirmed_at, completed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
foreach ($deals as $d) {
    $stmt->execute([
        $d['deal_number'], $d['customer_id'], $d['dollar_amount'], $d['exchange_rate'],
        $d['expected_bdt_amount'], $d['paid_amount'], $d['due_amount'], $d['status'],
        $d['notes'] ?? null, $d['linked_request_id'] ?? null,
        $d['dollar_proof_uploaded_at'] ?? null, $d['confirmed_at'] ?? null,
        $d['completed_at'] ?? null, $d['created_at'],
    ]);
}
echo "  - Inserted " . count($deals) . " deals\n";

// Update REQ-107 with converted_deal_id
$db->exec("UPDATE requests SET converted_deal_id = 2 WHERE id = 3");

// 4. Create timeline events for each deal
echo "Seeding timeline events...\n";
$timelineEvents = [
    // DL-2405 (deal_id=1) timeline
    [1, 'deal_created', 'owner', 'Business Owner', 'Deal Created', 'Agreement finalized for $2,000 at rate ৳123.00/USD. Expected total: ৳246,000.', 2000, 246000, 123.00, null, null, null, null, null, date('Y-m-d H:i:s', strtotime('-2 days'))],
    [1, 'dollar_proof_uploaded', 'owner', 'Business Owner', 'Dollar Transfer Proof Sent', 'Dispatched $2,000 to customer wallet via Binance Pay. Awaiting customer confirmation.', 2000, null, null, null, 'usd_sent', null, null, null, date('Y-m-d H:i:s', strtotime('-2 days'))],
    [1, 'receipt_confirmed', 'customer', 'Rafiqul Islam', 'Dollar Receipt Confirmed', 'Customer verified receipt of $2,000. Active outstanding balance established at ৳246,000.', null, 246000, null, null, null, null, null, null, date('Y-m-d H:i:s', strtotime('-2 days'))],
    [1, 'payment_proof_submitted', 'customer', 'Rafiqul Islam', 'Payment Proof Submitted (৳150,000)', 'Customer submitted payment proof via City Bank Transfer.', null, 150000, null, null, 'bdt_paid', 'approved', 'pay-2405-a', null, date('Y-m-d H:i:s', strtotime('-1 day'))],
    [1, 'payment_approved', 'owner', 'Business Owner', 'Payment Approved (৳150,000)', 'Bank receipt verified. ৳150,000 deducted from outstanding balance. Remaining due: ৳96,000.', null, 150000, null, null, null, null, 'pay-2405-a', null, date('Y-m-d H:i:s', strtotime('-1 day'))],
    [1, 'payment_proof_submitted', 'customer', 'Rafiqul Islam', 'Payment Proof Submitted (৳96,000)', 'Customer uploaded final settlement screenshot via bKash. Needs verification.', null, 96000, null, null, 'bdt_paid', 'pending', 'pay-2405-b', null, date('Y-m-d H:i:s', strtotime('-3 hours'))],

    // DL-2404 (deal_id=2) timeline
    [2, 'deal_created', 'owner', 'Business Owner', 'Deal Created from Request REQ-107', 'Agreement for $1,500 @ ৳122.50 = ৳183,750.', 1500, 183750, 122.50, null, null, null, null, null, date('Y-m-d H:i:s', strtotime('-5 hours'))],
    [2, 'dollar_proof_uploaded', 'owner', 'Business Owner', 'Dollar Transfer Proof Sent', 'Transferred $1,500 via Wise USD. Screenshot attached. Waiting for customer confirmation.', 1500, null, null, null, 'usd_sent', null, null, null, date('Y-m-d H:i:s', strtotime('-4 hours'))],

    // DL-2406 (deal_id=3) timeline
    [3, 'deal_created', 'owner', 'Business Owner', 'Deal Created', 'Agreement finalized for $4,000 at rate ৳123.20. Expected total: ৳492,800.', 4000, 492800, 123.20, null, null, null, null, null, date('Y-m-d H:i:s', strtotime('-3 days'))],
    [3, 'dollar_proof_uploaded', 'owner', 'Business Owner', 'Dollar Transfer Proof Sent', '$4,000 sent via Payoneer. Screenshot attached.', 4000, null, null, null, 'usd_sent', null, null, null, date('Y-m-d H:i:s', strtotime('-3 days'))],
    [3, 'receipt_confirmed', 'customer', 'Tanvir Ahmed', 'Dollar Receipt Confirmed', 'Customer confirmed receipt of $4,000. Balance of ৳492,800 is now active due.', null, 492800, null, null, null, null, null, null, date('Y-m-d H:i:s', strtotime('-3 days'))],

    // DL-2403 (deal_id=4) timeline
    [4, 'deal_created', 'owner', 'Business Owner', 'Deal Created', 'Deal agreed for $3,200 @ ৳122.00 = ৳390,400.', 3200, 390400, 122.00, null, null, null, null, null, date('Y-m-d H:i:s', strtotime('-6 days'))],
    [4, 'dollar_proof_uploaded', 'owner', 'Business Owner', 'Dollar Proof Uploaded', 'Sent $3,200 via Binance Pay.', 3200, null, null, null, 'usd_sent', null, null, null, date('Y-m-d H:i:s', strtotime('-6 days'))],
    [4, 'receipt_confirmed', 'customer', 'Farhan Chowdhury', 'Dollar Receipt Confirmed', 'Customer confirmed receiving $3,200. Outstanding ৳390,400 activated.', null, 390400, null, null, null, null, null, null, date('Y-m-d H:i:s', strtotime('-6 days'))],
    [4, 'payment_proof_submitted', 'customer', 'Farhan Chowdhury', 'Payment Proof Submitted (৳200,000)', 'Submitted ৳200,000 transfer slip.', null, 200000, null, null, 'bdt_paid', 'approved', 'pay-2403-a', null, date('Y-m-d H:i:s', strtotime('-5 days'))],
    [4, 'payment_approved', 'owner', 'Business Owner', 'Payment Approved (৳200,000)', 'Applied ৳200,000 payment. Outstanding balance reduced to ৳190,400.', null, 200000, null, null, null, null, 'pay-2403-a', null, date('Y-m-d H:i:s', strtotime('-5 days'))],

    // DL-2402 (deal_id=5) timeline
    [5, 'deal_created', 'owner', 'Business Owner', 'Deal Created', '$5,000 @ ৳121.80 = ৳609,000.', 5000, 609000, 121.80, null, null, null, null, null, date('Y-m-d H:i:s', strtotime('-14 days'))],
    [5, 'dollar_proof_uploaded', 'owner', 'Business Owner', 'Dollar Proof Uploaded', 'Sent $5,000 to Wise account.', 5000, null, null, null, 'usd_sent', null, null, null, date('Y-m-d H:i:s', strtotime('-14 days'))],
    [5, 'receipt_confirmed', 'customer', 'Tanvir Ahmed', 'Dollar Receipt Confirmed', 'Customer confirmed receipt.', null, 609000, null, null, null, null, null, null, date('Y-m-d H:i:s', strtotime('-14 days'))],
    [5, 'payment_proof_submitted', 'customer', 'Tanvir Ahmed', 'Payment Proof Submitted (৳609,000)', 'Full payment via RTGS transfer.', null, 609000, null, null, 'bdt_paid', 'approved', 'pay-2402-a', null, date('Y-m-d H:i:s', strtotime('-12 days'))],
    [5, 'payment_approved', 'owner', 'Business Owner', 'Payment Approved (৳609,000)', 'Payment verified in bank account.', null, 609000, null, null, null, null, 'pay-2402-a', null, date('Y-m-d H:i:s', strtotime('-12 days'))],
    [5, 'deal_completed', 'system', 'System', 'Deal Completed Successfully', 'Outstanding balance reached ৳0. Transaction closed.', null, 609000, null, null, null, null, null, null, date('Y-m-d H:i:s', strtotime('-12 days'))],

    // DL-2401 (deal_id=6) timeline
    [6, 'deal_created', 'owner', 'Business Owner', 'Deal Created', '$850 @ ৳123.50 = ৳104,975.', 850, 104975, 123.50, null, null, null, null, null, date('Y-m-d H:i:s', strtotime('-20 days'))],
    [6, 'dollar_proof_uploaded', 'owner', 'Business Owner', 'Dollar Proof Uploaded', '$850 sent to customer wallet.', 850, null, null, null, 'usd_sent', null, null, null, date('Y-m-d H:i:s', strtotime('-20 days'))],
    [6, 'receipt_confirmed', 'customer', 'Tahmid Rahman', 'Receipt Confirmed', 'Customer confirmed receipt.', null, 104975, null, null, null, null, null, null, date('Y-m-d H:i:s', strtotime('-20 days'))],
    [6, 'payment_proof_submitted', 'customer', 'Tahmid Rahman', 'Payment Proof Submitted (৳104,975)', 'Paid via bKash Personal.', null, 104975, null, null, 'bdt_paid', 'approved', 'pay-2401-a', null, date('Y-m-d H:i:s', strtotime('-19 days'))],
    [6, 'payment_approved', 'owner', 'Business Owner', 'Payment Approved', 'Full payment verified.', null, 104975, null, null, null, null, 'pay-2401-a', null, date('Y-m-d H:i:s', strtotime('-19 days'))],
    [6, 'deal_completed', 'system', 'System', 'Deal Completed', 'Balance ৳0. Complete.', null, 104975, null, null, null, null, null, null, date('Y-m-d H:i:s', strtotime('-19 days'))],
];

$stmt = $db->prepare('INSERT INTO deal_timeline_events (deal_id, event_type, actor_role, actor_name, title, description, amount_usd, amount_bdt, exchange_rate, proof_image_url, proof_type, proof_status, payment_event_id, rejection_reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
foreach ($timelineEvents as $e) {
    $stmt->execute($e);
}
echo "  - Inserted " . count($timelineEvents) . " timeline events\n";

// 5. Create activities
echo "Seeding activities...\n";
$activities = [
    [1, 'DL-2405', 3, 'Rafiqul Islam', 'payment_proof_submitted', 'Payment Proof Submitted', 'Submitted proof for ৳96,000 via bKash. Awaiting owner verification.', null, 96000, 'warning', date('Y-m-d H:i:s', strtotime('-3 hours'))],
    [2, 'DL-2404', 2, 'Nusrat Jahan', 'dollar_proof_uploaded', 'Dollar Proof Sent', 'Owner dispatched $1,500 via Wise. Awaiting customer confirmation.', 1500, null, 'info', date('Y-m-d H:i:s', strtotime('-4 hours'))],
    [null, null, 5, 'Tahmid Rahman', 'request_created', 'New Dollar Request', 'Customer requested $3,500 @ ৳122.80 target rate.', 3500, null, 'purple', date('Y-m-d H:i:s', strtotime('-8 hours'))],
    [1, 'DL-2405', 3, 'Rafiqul Islam', 'payment_approved', 'Payment Approved (৳150,000)', 'City Bank transfer approved. Balance reduced to ৳96,000.', null, 150000, 'success', date('Y-m-d H:i:s', strtotime('-1 day'))],
    [3, 'DL-2406', 1, 'Tanvir Ahmed', 'receipt_confirmed', 'Dollar Receipt Confirmed', '$4,000 received. Active due balance of ৳492,800 created.', null, 492800, 'info', date('Y-m-d H:i:s', strtotime('-3 days'))],
];

$stmt = $db->prepare('INSERT INTO activities (deal_id, deal_number, customer_id, customer_name, event_type, title, description, amount_usd, amount_bdt, badge_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
foreach ($activities as $a) {
    $stmt->execute($a);
}
echo "  - Inserted " . count($activities) . " activities\n";

// 6. Create user accounts
echo "Seeding user accounts...\n";
$users = [
    ['role' => 'owner', 'customer_id' => null, 'username' => 'admin', 'password' => 'admin123'],
    ['role' => 'customer', 'customer_id' => 1, 'username' => '+880 1711-234567', 'password' => 'password123'],
    ['role' => 'customer', 'customer_id' => 2, 'username' => '+880 1819-876543', 'password' => 'password123'],
    ['role' => 'customer', 'customer_id' => 3, 'username' => '+880 1912-334455', 'password' => 'password123'],
    ['role' => 'customer', 'customer_id' => 4, 'username' => '+880 1622-998877', 'password' => 'password123'],
    ['role' => 'customer', 'customer_id' => 5, 'username' => '+880 1755-443322', 'password' => 'password123'],
    ['role' => 'customer', 'customer_id' => 6, 'username' => '+880 1533-112233', 'password' => 'password123'],
];

$stmt = $db->prepare('INSERT INTO users (role, customer_id, username, password_hash) VALUES (?, ?, ?, ?)');
foreach ($users as $u) {
    $stmt->execute([$u['role'], $u['customer_id'], $u['username'], hashPassword($u['password'])]);
}
echo "  - Inserted " . count($users) . " user accounts\n";

echo "\n=== Seeding complete! ===\n\n";
echo "Login credentials:\n";
echo "  Admin:  username=admin, password=admin123\n";
echo "  Customer accounts: use phone number as username, password=password123\n";
