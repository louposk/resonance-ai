import { test, expect } from '@playwright/test';

test.describe('Debug Vercel Dashboard', () => {
  test('Investigate Resonance AI deployment issues', async ({ page }) => {
    console.log('🔍 Investigating Vercel deployment issues...');

    // Navigate to the specific Vercel project
    await page.goto('https://vercel.com/louposks-projects/resonance-ai');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    try {
      // Check if we need to sign in
      const signInButton = page.locator('text=Sign in, button:has-text("Sign in")');
      if (await signInButton.isVisible()) {
        console.log('🔐 Need to sign in to Vercel...');
        await signInButton.click();

        // Continue with GitHub
        await page.locator('text=Continue with GitHub').click();
        await page.waitForLoadState('networkidle');

        console.log('⏳ Please complete authentication...');
        // Wait for redirect back
        await page.waitForURL('**/resonance-ai**', { timeout: 60000 });
      }

      // Take a screenshot of the current state
      await page.screenshot({ path: 'vercel-dashboard.png', fullPage: true });
      console.log('📸 Screenshot saved as vercel-dashboard.png');

      // Check for deployment errors
      const errorMessages = await page.locator('.error, [data-testid="error"], .text-red-500, .text-danger').allTextContents();
      if (errorMessages.length > 0) {
        console.log('❌ Found error messages:');
        errorMessages.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }

      // Check deployment status
      const statusElements = await page.locator('[data-testid="deployment-status"], .status, .badge').allTextContents();
      if (statusElements.length > 0) {
        console.log('📊 Deployment statuses found:');
        statusElements.forEach((status, index) => {
          console.log(`   ${index + 1}. ${status}`);
        });
      }

      // Look for build logs
      const buildLogButton = page.locator('text=View Build Logs, button:has-text("Build"), a:has-text("Logs")');
      if (await buildLogButton.first().isVisible()) {
        console.log('📋 Build logs available - clicking to view...');
        await buildLogButton.first().click();
        await page.waitForTimeout(2000);

        // Capture build logs
        const buildLogs = await page.locator('pre, .log-line, .console-line').allTextContents();
        if (buildLogs.length > 0) {
          console.log('🔨 Build logs:');
          buildLogs.slice(-20).forEach((log, index) => { // Show last 20 lines
            console.log(`   ${log}`);
          });
        }
      }

      // Check for configuration issues
      const configSection = page.locator('text=Build & Output Settings, text=Configuration');
      if (await configSection.isVisible()) {
        console.log('⚙️ Checking configuration settings...');

        // Look for build command
        const buildCommand = await page.locator('input[name*="build"], input[placeholder*="build"]').inputValue().catch(() => 'Not found');
        console.log(`   Build Command: ${buildCommand}`);

        // Look for output directory
        const outputDir = await page.locator('input[name*="output"], input[placeholder*="output"]').inputValue().catch(() => 'Not found');
        console.log(`   Output Directory: ${outputDir}`);

        // Look for install command
        const installCommand = await page.locator('input[name*="install"], input[placeholder*="install"]').inputValue().catch(() => 'Not found');
        console.log(`   Install Command: ${installCommand}`);
      }

      // Check recent deployments
      const deploymentsList = await page.locator('[data-testid="deployment"], .deployment-item').count();
      console.log(`📦 Found ${deploymentsList} deployment(s)`);

      // Get deployment URLs if any
      const deploymentUrls = await page.locator('a[href*=".vercel.app"]').allTextContents();
      if (deploymentUrls.length > 0) {
        console.log('🌐 Found deployment URLs:');
        deploymentUrls.forEach((url, index) => {
          console.log(`   ${index + 1}. ${url}`);
        });

        // Test the first URL if available
        if (deploymentUrls[0]) {
          console.log(`🧪 Testing deployment at: ${deploymentUrls[0]}`);
          await page.goto(deploymentUrls[0]);
          await page.waitForTimeout(3000);

          const pageTitle = await page.title();
          console.log(`   Page title: ${pageTitle}`);

          const hasResonanceAI = await page.locator('text=Resonance AI').isVisible();
          console.log(`   Resonance AI branding: ${hasResonanceAI ? '✅ Found' : '❌ Missing'}`);

          const hasSearchDemo = await page.locator('input[placeholder*="Billie Jean"]').isVisible();
          console.log(`   Search demo: ${hasSearchDemo ? '✅ Working' : '❌ Missing'}`);

          // Take screenshot of live site
          await page.screenshot({ path: 'live-site.png', fullPage: true });
          console.log('📸 Live site screenshot saved as live-site.png');
        }
      }

      // Check for environment variables if needed
      const envSection = page.locator('text=Environment Variables');
      if (await envSection.isVisible()) {
        console.log('🔧 Environment variables section found');
      }

      // Look for any warnings or notices
      const warnings = await page.locator('.warning, .notice, .text-yellow-500, .text-orange-500').allTextContents();
      if (warnings.length > 0) {
        console.log('⚠️ Warnings/Notices:');
        warnings.forEach((warning, index) => {
          console.log(`   ${index + 1}. ${warning}`);
        });
      }

      console.log('\n🔍 Investigation complete! Check the screenshots and logs above for issues.');

    } catch (error) {
      console.error('❌ Investigation error:', error);
      await page.screenshot({ path: 'debug-error.png', fullPage: true });
      console.log('📸 Error screenshot saved as debug-error.png');

      // Get current page info
      console.log(`Current URL: ${page.url()}`);
      console.log(`Page title: ${await page.title()}`);
    }
  });
});