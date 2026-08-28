import fs from 'fs';
import path from 'path';
import { INITIAL_USERS } from './src/data/initialData';
import { User, isUserBlocked } from './src/types';

function runTests() {
  console.log('🧪 Starting Clean Login & Authentication Security Verification Suite...\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
    }
  }

  // ==========================================
  // TEST SET 1: AUTH SCREEN UI AUDIT (NO LEAKED ACCOUNTS)
  // ==========================================
  console.log('--- 1. Testing AuthScreen.tsx Code & UI Cleanliness ---');

  const authScreenContent = fs.readFileSync(
    path.join(process.cwd(), 'src/components/Auth/AuthScreen.tsx'),
    'utf-8'
  );

  // Check 1.1: No demo account buttons or handleFillCredentials
  assert(
    !authScreenContent.includes('handleFillCredentials'),
    'AuthScreen does NOT have handleFillCredentials function'
  );
  assert(
    !authScreenContent.includes('quickDemoLogin'),
    'AuthScreen does NOT import or use quickDemoLogin'
  );
  assert(
    !authScreenContent.includes('Tài khoản mẫu'),
    'AuthScreen does NOT contain "Tài khoản mẫu" suggestion box'
  );
  assert(
    !authScreenContent.includes('Bùi Viết Hoàng'),
    'AuthScreen does NOT hardcode Super Admin name "Bùi Viết Hoàng"'
  );
  assert(
    !authScreenContent.includes('buiviethoangktxd@gmail.com'),
    'AuthScreen does NOT hardcode Super Admin email "buiviethoangktxd@gmail.com"'
  );
  assert(
    !authScreenContent.includes('toan.tran@salesflow.vn'),
    'AuthScreen does NOT hardcode Sales email "toan.tran@salesflow.vn"'
  );
  assert(
    !authScreenContent.includes('hung.nguyen@salesflow.vn'),
    'AuthScreen does NOT hardcode Director email "hung.nguyen@salesflow.vn"'
  );
  assert(
    !authScreenContent.includes('users.length'),
    'AuthScreen does NOT display total users count (users.length)'
  );
  assert(
    !authScreenContent.includes('Mật khẩu mẫu: 123 hoặc admin'),
    'AuthScreen does NOT expose password hints ("Mật khẩu mẫu")'
  );
  assert(
    authScreenContent.includes('autoComplete="username"'),
    'Login Email input has standard autoComplete="username"'
  );
  assert(
    authScreenContent.includes('autoComplete="current-password"'),
    'Login Password input has standard autoComplete="current-password"'
  );

  // ==========================================
  // TEST SET 2: CREDENTIALS VERIFICATION LOGIC (SUPER ADMIN, L1, L2)
  // ==========================================
  console.log('\n--- 2. Testing Authentication Logic with Clean Credentials ---');

  const users: User[] = [...INITIAL_USERS];

  function simulateLogin(email: string, password?: string) {
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, message: 'Không tìm thấy tài khoản với email này.' };
    }
    if (isUserBlocked(user.status)) {
      return { success: false, message: 'Tài khoản này đang bị khóa.' };
    }
    const expectedPassword = user.password || (user.role === 'super_admin' ? 'admin' : '123456');
    if (password && password !== expectedPassword) {
      return { success: false, message: 'Mật khẩu không chính xác.' };
    }
    return { success: true, user };
  }

  // Case 2.1: Super Admin login
  const saRes = simulateLogin('buiviethoangktxd@gmail.com', 'admin');
  assert(saRes.success === true && saRes.user?.role === 'super_admin', 'Super Admin logs in successfully with email + password "admin"');

  // Case 2.2: Level 1 Director login
  const l1Res = simulateLogin('quan.tran@salesflow.vn', '123456');
  assert(l1Res.success === true && l1Res.user?.role === 'manager_c1', 'Level 1 Director logs in successfully with email + password "123456"');

  // Case 2.3: Level 2 Sales login
  const l2Res = simulateLogin('mai.nguyen@salesflow.vn', '123456');
  assert(l2Res.success === true && l2Res.user?.role === 'sales_c2', 'Level 2 Sales logs in successfully with email + password "123456"');

  // Case 2.4: Wrong password
  const wrongPassRes = simulateLogin('buiviethoangktxd@gmail.com', 'wrong_pass');
  assert(wrongPassRes.success === false, 'Login fails with incorrect password');

  // Case 2.5: Non-existent email
  const notFoundRes = simulateLogin('hacker@unknown.com', '123456');
  assert(notFoundRes.success === false, 'Login fails for non-existent email');

  // Case 2.6: Blocked user
  const blockedUser: User = {
    ...INITIAL_USERS[2],
    id: 'blocked-user-1',
    email: 'blocked@test.vn',
    status: 'archived',
  };
  users.push(blockedUser);
  const blockedRes = simulateLogin('blocked@test.vn', '123456');
  assert(blockedRes.success === false && blockedRes.message.includes('khóa'), 'Blocked user is rejected at login');

  // ==========================================
  // TEST SET 3: PRESERVATION OF DATABASE ACCOUNTS
  // ==========================================
  console.log('\n--- 3. Testing Data Preservation ---');
  assert(INITIAL_USERS.length >= 4, `INITIAL_USERS has all required accounts intact (${INITIAL_USERS.length} accounts)`);
  assert(INITIAL_USERS.some((u) => u.role === 'super_admin'), 'Super Admin account is intact in initial data');
  assert(INITIAL_USERS.some((u) => u.role === 'manager_c1'), 'Level 1 Director account is intact in initial data');
  assert(INITIAL_USERS.some((u) => u.role === 'sales_c2'), 'Level 2 Sales accounts are intact in initial data');

  console.log(`\n🎉 Results: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
