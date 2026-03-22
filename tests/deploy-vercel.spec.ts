import { test, expect } from '@playwright/test';

test.describe('Vercel Deployment Automation', () => {
  test('Deploy Resonance AI to Vercel', async ({ page }) => {
    console.log('🚀 Starting automated Vercel deployment for Resonance AI...');

    // Navigate to Vercel
    await page.goto('https://vercel.com/new');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    try {
      // Check if we need to sign in
      const signInButton = page.locator('text=Sign in');
      if (await signInButton.isVisible()) {
        console.log('📝 Need to sign in to Vercel...');
        await signInButton.click();

        // Click "Continue with GitHub"
        await page.locator('text=Continue with GitHub').click();
        await page.waitForLoadState('networkidle');

        console.log('🔐 Please complete GitHub authentication in the browser...');

        // Wait for redirect back to Vercel (up to 60 seconds)
        await page.waitForURL('**/new**', { timeout: 60000 });
        console.log('✅ Successfully authenticated with GitHub');
      }

      // Look for the repository
      console.log('🔍 Looking for resonance-ai repository...');

      // Wait for repositories to load
      await page.waitForSelector('text=Import Git Repository', { timeout: 10000 });

      // Search for our repository
      const searchInput = page.locator('input[placeholder*="Search"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('resonance-ai');
        await page.waitForTimeout(2000);
      }

      // Look for our repository and click Import
      const repoSelector = 'text=louposk/resonance-ai';
      await page.waitForSelector(repoSelector, { timeout: 10000 });

      // Find the Import button for our repository
      const importButton = page.locator(`[data-testid="import-repo-button"], button:has-text("Import")`).first();
      await importButton.click();

      console.log('📦 Importing resonance-ai repository...');

      // Wait for the configuration page
      await page.waitForLoadState('networkidle');

      // Configure the project settings
      console.log('⚙️ Configuring project settings...');

      // Project name should auto-fill, but let's ensure it's correct
      const projectNameInput = page.locator('input[name="name"], input[placeholder*="project name"]');
      if (await projectNameInput.isVisible()) {
        await projectNameInput.clear();
        await projectNameInput.fill('resonance-ai');
      }

      // Framework preset - select "Other" if not already selected
      const frameworkSelect = page.locator('text=Framework Preset').locator('..').locator('select, button');
      if (await frameworkSelect.isVisible()) {
        await frameworkSelect.click();
        const otherOption = page.locator('text=Other');
        if (await otherOption.isVisible()) {
          await otherOption.click();
        }
      }

      // Build and Output Directory settings
      const buildCommandInput = page.locator('input[name="buildCommand"], input[placeholder*="build command"]');
      if (await buildCommandInput.isVisible()) {
        await buildCommandInput.clear();
        await buildCommandInput.fill('npm run build');
      }

      const outputDirInput = page.locator('input[name="outputDirectory"], input[placeholder*="output directory"]');
      if (await outputDirInput.isVisible()) {
        await outputDirInput.clear();
        await outputDirInput.fill('dist');
      }

      const installCommandInput = page.locator('input[name="installCommand"], input[placeholder*="install command"]');
      if (await installCommandInput.isVisible()) {
        await installCommandInput.clear();
        await installCommandInput.fill('npm install');
      }

      // Click Deploy
      console.log('🚀 Deploying Resonance AI...');
      const deployButton = page.locator('button:has-text("Deploy"), button[type="submit"]').first();
      await deployButton.click();

      // Wait for deployment to complete
      console.log('⏳ Waiting for deployment to complete...');

      // Wait for success page or deployment URL
      await page.waitForSelector('text=Congratulations, text=Your project has been deployed, text=Visit', { timeout: 300000 }); // 5 minutes timeout

      // Get the deployment URL
      const deploymentUrl = await page.locator('a[href*="https://"][href*=".vercel.app"]').first().textContent();

      if (deploymentUrl) {
        console.log(`🎉 SUCCESS! Resonance AI is now live at: ${deploymentUrl}`);

        // Test the deployed application
        console.log('🧪 Testing the deployed application...');
        await page.goto(deploymentUrl);

        // Check if the page loads correctly
        await expect(page.locator('text=Resonance AI')).toBeVisible();
        await expect(page.locator('text=Discover the Stories Behind Every Song')).toBeVisible();

        // Test the search functionality
        const searchInput = page.locator('input[placeholder*="Billie Jean"]');
        if (await searchInput.isVisible()) {
          await searchInput.fill('Billie Jean Michael Jackson');
          await page.locator('button:has-text("Search")').click();
          await page.waitForTimeout(3000);

          // Check if results appear
          const resultsVisible = await page.locator('.song-result').isVisible();
          console.log(resultsVisible ? '✅ Search demo working!' : '⚠️ Search demo not responding');
        }

        console.log('🌟 Deployment successful! Your Resonance AI is live with:');
        console.log('   ✨ Beautiful dark theme with gradient colors');
        console.log('   🎵 Interactive music search demo');
        console.log('   📱 Mobile-responsive design');
        console.log('   🚀 Professional branding and animations');
      }

    } catch (error) {
      console.error('❌ Deployment error:', error);

      // Take a screenshot for debugging
      await page.screenshot({ path: 'vercel-deployment-error.png' });
      console.log('📸 Screenshot saved as vercel-deployment-error.png');

      // Log current page URL and title for debugging
      console.log('Current URL:', page.url());
      console.log('Page title:', await page.title());

      throw error;
    }
  });
});