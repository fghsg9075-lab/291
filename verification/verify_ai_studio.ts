import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // 1. Navigate
    await page.goto('http://localhost:5000');
    
    // 2. Inject Settings & Admin User
    const adminUser = {
        id: 'admin_123',
        name: 'Admin User',
        email: 'admin@test.com',
        role: 'ADMIN',
        credits: 9999,
        isPremium: true,
        subscriptionTier: 'LIFETIME',
        subscriptionLevel: 'ULTRA',
        createdAt: new Date().toISOString(),
        mobile: '1234567890',
        password: 'admin',
        progress: {},
        redeemedCodes: []
    };

    const systemSettings = {
        appName: 'Test App',
        adminEmail: 'admin@test.com',
        adminCode: '123456',
        startupAd: { enabled: false }, 
    };

    await page.evaluate(({ user, settings }) => {
      localStorage.setItem('nst_current_user', JSON.stringify(user));
      localStorage.setItem('nst_system_settings', JSON.stringify(settings));
    }, { user: adminUser, settings: systemSettings });

    console.log('Injected Admin User & Settings');

    // 3. Reload
    await page.reload();
    console.log('Page reloaded');
    
    // 4. Handle Popups Loop
    console.log('Handling Popups...');
    let popupFound = true;
    let attempts = 0;
    while (popupFound || attempts < 5) {
        popupFound = false;
        attempts++;
        await page.waitForTimeout(500); // Wait for things to appear
        
        // Try Welcome Popup (Resume / Get Started)
        try {
            const welcomeBtn = page.locator('button').filter({ hasText: /Resume Learning|Get Started/ }).first();
            if (await welcomeBtn.isVisible({ timeout: 200 })) {
                console.log('Clicking Welcome Button...');
                await welcomeBtn.click();
                await page.waitForTimeout(1000);
                popupFound = true;
                continue;
            }
        } catch(e) {}

        // Try Continue Learning (Daily Goal)
        try {
            const continueLearningButton = page.getByText('Continue Learning', { exact: true });
             if (await continueLearningButton.isVisible({ timeout: 200 })) {
                console.log('Clicking Continue Learning...');
                await continueLearningButton.click();
                await page.waitForTimeout(1000);
                popupFound = true;
                continue;
            }
        } catch(e) {}

        // Try I Agree & Continue (Terms)
        try {
             const agreeButton = page.getByRole('button', { name: /I Agree & Continue/i });
             if (await agreeButton.isVisible({ timeout: 200 })) {
                console.log('Clicking I Agree & Continue...');
                await agreeButton.click();
                await page.waitForTimeout(1000);
                popupFound = true;
                continue;
            }
        } catch(e) {}
            
        // Try Generic Close Button
        try {
             // Look for generic close buttons (X) usually in top right
             const closeButton = page.locator('button.absolute.right-4.top-4').first();
             if (await closeButton.isVisible({ timeout: 200 })) {
                 console.log('Clicking Generic Close button...');
                 await closeButton.click();
                 await page.waitForTimeout(1000);
                 popupFound = true;
                 continue;
             }
        } catch(e) {}
        
        // If we found nothing this pass, check if we are blocked.
        // If "AI Studio" is clickable, we are good.
        try {
             const aiStudioCard = page.getByText('AI Studio');
             if (await aiStudioCard.isVisible({ timeout: 100 })) {
                 // Try to verify it's not obscured
                 // Playwright's isVisible doesn't guarantee it's not covered? 
                 // Actually isVisible checks opacity/display.
                 // We can try to click it. If it fails, loop continues.
                 break;
             }
        } catch(e) {}
    }
    console.log('Popup handling finished.');
    
    // 7. Click "AI Studio"
    console.log('Looking for AI Studio...');
    const aiStudioCard = page.getByText('AI Studio');
    await aiStudioCard.waitFor({ state: 'visible', timeout: 5000 });
    
    // Force click if needed or just click
    await aiStudioCard.click(); 
    console.log('Clicked AI Studio');

    // 8. Verify UI
    await page.getByText('AI Content Studio').waitFor({ state: 'visible', timeout: 5000 });
    console.log('AI Studio Header Visible');
    
    await page.getByText('API Configuration').waitFor({ state: 'visible' });
    console.log('API Config Visible');

    // Check Prompt Areas
    await page.getByText('Normal Notes Prompt').waitFor({ state: 'visible' });
    await page.getByText('Premium Notes Prompt').waitFor({ state: 'visible' });
    await page.getByText('MCQ Generator Prompt').waitFor({ state: 'visible' });
    console.log('Prompts Visible');

    // Take screenshot
    await page.screenshot({ path: 'verification/ai_studio_success.png', fullPage: true });
    console.log('Success screenshot saved.');

  } catch (error) {
    console.error('Verification failed:', error);
    await page.screenshot({ path: 'verification/error_final_5.png' });
  } finally {
    await browser.close();
  }
})();
