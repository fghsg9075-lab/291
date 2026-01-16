
from playwright.sync_api import Page, expect, sync_playwright
import json

def verify_ai_studio(page: Page):
    # 1. Arrange: Inject Admin User
    user = {
        "id": "admin-1",
        "name": "Admin User",
        "role": "ADMIN",
        "email": "admin@example.com",
        "credits": 1000,
        "isPremium": True
    }
    
    page.add_init_script(f"""
        localStorage.setItem('nst_current_user', '{json.dumps(user)}');
        localStorage.setItem('nst_terms_accepted', 'true');
        localStorage.setItem('nst_has_seen_welcome', 'true');
        sessionStorage.setItem('nst_ad_seen', 'true');
    """)

    # 2. Act: Go to Home
    page.goto("http://localhost:5000")
    
    try:
        page.get_by_text("I Agree & Continue").click(timeout=3000)
    except:
        pass

    # Wait for Dashboard to load
    expect(page.get_by_text("Admin Console")).to_be_visible(timeout=20000)
    
    # Screenshot Dashboard
    page.screenshot(path="verification/dashboard.png")

    # 3. Navigate to AI Studio
    # It's a button with "AI Studio" text.
    print("Clicking AI Studio...")
    page.get_by_text("AI Studio").click(force=True)

    # 4. Verify AI Studio Page
    # "AI Studio" header
    print("Waiting for header...")
    expect(page.get_by_role("heading", name="AI Studio")).to_be_visible(timeout=5000)
    
    # Check Settings
    expect(page.get_by_text("API Configuration")).to_be_visible()
    
    # 5. Screenshot
    page.screenshot(path="verification/ai_studio.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_ai_studio(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
