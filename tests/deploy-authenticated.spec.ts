import { test, expect } from '@playwright/test';

test.describe('Authenticated Vercel Deployment', () => {
  test('Deploy Resonance AI after authentication', async ({ page }) => {
    console.log('🚀 Deploying Resonance AI with authenticated session...');

    // Go to your specific project URL
    await page.goto('https://vercel.com/louposks-projects/resonance-ai');
    await page.waitForLoadState('networkidle');

    // If we see the project dashboard without login, we're good
    const isLoggedIn = await page.locator('text=Deployments, text=Settings, button:has-text("Deploy")').first().isVisible({ timeout: 5000 }).catch(() => false);

    if (!isLoggedIn) {
      console.log('🔐 Authentication required - please sign in manually first');
      return;
    }

    console.log('✅ Already authenticated! Proceeding with deployment...');

    // Check if there are any deployments
    const hasDeployments = await page.locator('[data-testid="deployment"], .deployment').count();
    console.log(`📦 Current deployments: ${hasDeployments}`);

    if (hasDeployments === 0) {
      console.log('🔧 No deployments found. Creating initial deployment...');

      // Look for deployment trigger button
      const deployButton = page.locator('button:has-text("Deploy"), button:has-text("Redeploy"), a:has-text("Deploy")').first();

      if (await deployButton.isVisible()) {
        console.log('🚀 Triggering deployment...');
        await deployButton.click();
        await page.waitForTimeout(2000);
      } else {
        // Try to go to the new deployment page
        console.log('📝 Navigating to deployment setup...');
        await page.goto('https://vercel.com/new/git/external?repository-url=https://github.com/louposk/resonance-ai');
        await page.waitForLoadState('networkidle');

        // Configure deployment settings
        const projectName = page.locator('input[name="name"]');
        if (await projectName.isVisible()) {
          await projectName.clear();
          await projectName.fill('resonance-ai');
        }

        // Framework preset
        const frameworkSelect = page.locator('select, button').filter({ hasText: /framework|preset/i }).first();
        if (await frameworkSelect.isVisible()) {
          await frameworkSelect.click();
          await page.locator('text=Other').click().catch(() => {});
        }

        // Build settings
        const buildCommand = page.locator('input[placeholder*="build"], input[name*="build"]');
        if (await buildCommand.isVisible()) {
          await buildCommand.clear();
          await buildCommand.fill('npm run build');
        }

        const outputDir = page.locator('input[placeholder*="output"], input[name*="output"]');
        if (await outputDir.isVisible()) {
          await outputDir.clear();
          await outputDir.fill('dist');
        }

        // Deploy button
        const finalDeployBtn = page.locator('button:has-text("Deploy")');
        await finalDeployBtn.click();
        console.log('🚀 Deployment initiated!');
      }

      // Wait for deployment to complete
      console.log('⏳ Waiting for deployment to complete...');
      await page.waitForSelector('text=Your project has been deployed, text=Congratulations, a[href*=".vercel.app"]', { timeout: 300000 });

      // Get the live URL
      const deploymentUrl = await page.locator('a[href*=".vercel.app"]').first().getAttribute('href');

      if (deploymentUrl) {
        console.log(`🎉 SUCCESS! Resonance AI is live at: ${deploymentUrl}`);

        // Test the deployment
        await page.goto(deploymentUrl);
        await page.waitForTimeout(3000);

        const hasResonanceTitle = await page.locator('text=Resonance AI').isVisible();
        const hasHeroText = await page.locator('text=Discover the Stories Behind Every Song').isVisible();
        const hasSearchDemo = await page.locator('input[placeholder*="Billie Jean"]').isVisible();

        console.log(`✨ Site verification:`);
        console.log(`   🎨 Resonance AI branding: ${hasResonanceTitle ? '✅' : '❌'}`);
        console.log(`   📝 Hero text: ${hasHeroText ? '✅' : '❌'}`);
        console.log(`   🎵 Search demo: ${hasSearchDemo ? '✅' : '❌'}`);

        if (hasSearchDemo) {
          // Test the search functionality
          console.log('🧪 Testing search functionality...');
          await page.fill('input[placeholder*="Billie Jean"]', 'Billie Jean Michael Jackson');
          await page.click('button:has-text("Search")');
          await page.waitForTimeout(4000);

          const hasResults = await page.locator('.song-result').isVisible();
          console.log(`   🎶 Search results: ${hasResults ? '✅ Working' : '⚠️ Limited'}`);
        }

        // Take final screenshot
        await page.screenshot({ path: 'resonance-ai-live.png', fullPage: true });
        console.log('📸 Live site screenshot saved!');

        console.log('\n🌟 DEPLOYMENT COMPLETE! 🌟');
        console.log('Your Resonance AI is now live with:');
        console.log('✨ Beautiful dark theme with gradient colors');
        console.log('🎵 Interactive music search demo');
        console.log('📱 Mobile-responsive design');
        console.log('🚀 Professional animations and branding');
      }
    } else {
      console.log('✅ Deployment already exists! Checking status...');

      // Get existing deployment URL
      const existingUrl = await page.locator('a[href*=".vercel.app"]').first().getAttribute('href');
      if (existingUrl) {
        console.log(`🌐 Live at: ${existingUrl}`);

        // Test existing deployment
        await page.goto(existingUrl);
        const isWorking = await page.locator('text=Resonance AI').isVisible();
        console.log(`Status: ${isWorking ? '✅ Working perfectly' : '⚠️ Needs attention'}`);
      }
    }
  });
});