import fs from 'fs';
import path from 'path';
import googlePlayScraper from 'google-play-scraper';

// Configuration Paths
const DIST_DIR = path.join(process.cwd(), 'dist');
const PAGES_DIR = path.join(DIST_DIR, 'pages');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');
const EXPLORE_DIR = path.join(DIST_DIR, 'explore', 'game');

const currentYear = new Date().getFullYear();

/**
 * 🛠️ AUTOMATED LEGAL PAGES GENERATOR
 * Yeh function automatic dist/pages/ folder banakar teeno legal files create karega
 */
function generateLegalPages() {
    // Directories structural check
    if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });
    if (!fs.existsSync(PAGES_DIR)) fs.mkdirSync(PAGES_DIR, { recursive: true });

    // 1. Contact Us Page Code
    const contactHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Contact Us - GameMatrix</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background-color: #00bfa5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #fff; min-height: 100vh; display: flex; flex-direction: column; }
        header { background-color: #00875a; padding: 14px 24px; border-bottom: 1px solid rgba(0,0,0,0.1); display: flex; align-items: center; gap: 10px; }
        header a { color: #fff; text-decoration: none; font-weight: bold; font-size: 16px; }
        header h1 { font-size: 18px; color: #fff; font-weight: 600; }
        .container { flex: 1; max-width: 600px; width: 100%; margin: 40px auto; padding: 24px; background: #fff; color: #333; border-radius: 18px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); }
        h2 { color: #00875a; margin-bottom: 15px; font-size: 22px; }
        p { margin-bottom: 20px; font-size: 14px; color: #555; line-height: 1.6; }
        .form-group { margin-bottom: 15px; }
        label { display: block; font-size: 13px; font-weight: bold; margin-bottom: 5px; color: #333; }
        input, textarea { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 8px; font-size: 14px; }
        textarea { height: 120px; resize: none; }
        .btn { display: inline-block; width: 100%; padding: 12px; background: #00875a; color: #fff; border: none; border-radius: 25px; font-weight: bold; font-size: 14px; cursor: pointer; text-align: center; transition: background 0.2s; }
        .btn:hover { background: #00be68; }
        footer { text-align: center; color: #00875a; font-size: 12px; padding: 16px; background: #fff; margin-top: auto; font-weight: 500; border-top: 1px solid #e0e0e0; }
    </style>
</head>
<body>
    <header>
        <a href="../index.html">←</a>
        <h1>GameMatrix</h1>
    </header>
    <main class="container">
        <h2>Contact Us</h2>
        <p>Have questions, suggestions, or technical inquiries regarding our game optimization metrics? Fill out the form below, and our support infrastructure team will get back to you shortly.</p>
        <form onsubmit="event.preventDefault(); alert('Message transmission layer simulation successful! Form backend will be activated in the next phase.');">
            <div class="form-group">
                <label>Your Name</label>
                <input type="text" placeholder="John Doe" required />
            </div>
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="john@example.com" required />
            </div>
            <div class="form-group">
                <label>Message / Inquiry</label>
                <textarea placeholder="Describe your query here..." required></textarea>
            </div>
            <button type="submit" class="btn">Send Message</button>
        </form>
    </main>
    <footer>
        <span>&copy; ${currentYear} GameMatrix (FavNinja.com)</span>
    </footer>
</body>
</html>`;

    // 2. Privacy Policy Page Code
    const privacyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Privacy Policy - GameMatrix</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background-color: #00bfa5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #fff; min-height: 100vh; display: flex; flex-direction: column; }
        header { background-color: #00875a; padding: 14px 24px; border-bottom: 1px solid rgba(0,0,0,0.1); display: flex; align-items: center; gap: 10px; }
        header a { color: #fff; text-decoration: none; font-weight: bold; font-size: 16px; }
        header h1 { font-size: 18px; color: #fff; font-weight: 600; }
        .container { flex: 1; max-width: 750px; width: 100%; margin: 30px auto; padding: 24px; background: #fff; color: #333; border-radius: 18px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); }
        h2 { color: #00875a; margin-top: 20px; margin-bottom: 10px; font-size: 20px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
        h2:first-of-type { margin-top: 0; }
        p { margin-bottom: 15px; font-size: 13.5px; color: #444; line-height: 1.6; text-align: justify; }
        footer { text-align: center; color: #00875a; font-size: 12px; padding: 16px; background: #fff; margin-top: auto; font-weight: 500; border-top: 1px solid #e0e0e0; }
    </style>
</head>
<body>
    <header>
        <a href="../index.html">←</a>
        <h1>GameMatrix</h1>
    </header>
    <main class="container">
        <h2>Privacy Policy</h2>
        <p><strong>Effective Date: July 9, 2026</strong></p>
        <p>Welcome to GameMatrix (accessible via FavNinja.com). We are deeply committed to protecting your personal privacy. This Privacy Policy document outlines the strategic structures regarding data aggregation, logging, and asset caching layers across our static discovery network.</p>
        
        <h2>1. Information Logging & Tracking</h2>
        <p>Our infrastructure operates strictly as an optimization metrics dashboard. We do not maintain active user profile tracking schemas. Standard server interaction logs may automatically capture your IP address, browser user-agent strings, and redirect configurations to prevent programmatic request spikes and secure server latency levels.</p>
        
        <h2>2. Third-Party API Integrations</h2>
        <p>GameMatrix displays scraped product records, links, and asset buffers from official stores like the Google Play Store and Apple App Store. When you interact with redirect paths or external download triggers, your connection sequences are handled entirely under their respective data governance terms.</p>
        
        <h2>3. Local Web Storage</h2>
        <p>To improve edge speed and prevent layout shifts, our framework may leverage local web storage layers inside your mobile or desktop client framework. No structured analytical footprints are shared with remote data farms.</p>
    </main>
    <footer>
        <span>&copy; ${currentYear} GameMatrix (FavNinja.com)</span>
    </footer>
</body>
</html>`;

    // 3. Terms of Service Page Code
    const termsHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Terms of Service - GameMatrix</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background-color: #00bfa5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #fff; min-height: 100vh; display: flex; flex-direction: column; }
        header { background-color: #00875a; padding: 14px 24px; border-bottom: 1px solid rgba(0,0,0,0.1); display: flex; align-items: center; gap: 10px; }
        header a { color: #fff; text-decoration: none; font-weight: bold; font-size: 16px; }
        header h1 { font-size: 18px; color: #fff; font-weight: 600; }
        .container { flex: 1; max-width: 750px; width: 100%; margin: 30px auto; padding: 24px; background: #fff; color: #333; border-radius: 18px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); }
        h2 { color: #00875a; margin-top: 20px; margin-bottom: 10px; font-size: 20px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
        h2:first-of-type { margin-top: 0; }
        p { margin-bottom: 15px; font-size: 13.5px; color: #444; line-height: 1.6; text-align: justify; }
        footer { text-align: center; color: #00875a; font-size: 12px; padding: 16px; background: #fff; margin-top: auto; font-weight: 500; border-top: 1px solid #e0e0e0; }
    </style>
</head>
<body>
    <header>
        <a href="../index.html">←</a>
        <h1>GameMatrix</h1>
    </header>
    <main class="container">
        <h2>Terms of Service</h2>
        <p><strong>Last Updated: July 9, 2026</strong></p>
        <p>By accessing the GameMatrix analytics delivery platform, you explicitly consent to establish compliance frameworks with the statutory operational rules declared below.</p>
        
        <h2>1. Permitted Platform Use</h2>
        <p>Users are authorized to evaluate platform indexing dashboards, browse localized memory hardware tags, and engage redirect links purely for personal verification cycles. Automated bulk parsing, dynamic network flooding, or extraction of static assets from our local file layouts is strictly prohibited.</p>
        
        <h2>2. Intellectual Property Disclaimer</h2>
        <p>All source trademarks, game icons, product brands, and original promotional layout screenshots indexed inside our system belong strictly to their registered application developers and official store channels. GameMatrix serves purely as an informational evaluation bridge.</p>
        
        <h2>3. Continuous System Adjustments</h2>
        <p>We preserve full rights to alter structural page parameters, drop specific search query keywords, or cycle live application nodes without issuing notification buffers to edge consumers.</p>
    </main>
    <footer>
        <span>&copy; ${currentYear} GameMatrix (FavNinja.com)</span>
    </footer>
</body>
</html>`;

    // Saving files securely inside dist/pages/
    fs.writeFileSync(path.join(PAGES_DIR, 'contact.html'), contactHtml, 'utf-8');
    fs.writeFileSync(path.join(PAGES_DIR, 'privacy.html'), privacyHtml, 'utf-8');
    fs.writeFileSync(path.join(PAGES_DIR, 'terms.html'), termsHtml, 'utf-8');
    console.log("👉 [AUTOMATION] Legal & Contact Pages Generated Successfully in dist/pages/");
}

/**
 * 🏠 INDEX PAGE RENDERING LOGIC (Home Page Layout)
 */
function renderIndexHtml(gamesListHtml) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>GameMatrix - Premium Discovery Platform</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background-color: #00bfa5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding-bottom: 60px; }
        header { background-color: #00875a; padding: 16px; text-align: center; color: white; font-weight: bold; font-size: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .grid-container { max-width: 1200px; margin: 20px auto; padding: 0 16px; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 16px; }
        @media (max-width: 480px) {
            .grid-container { grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 0 8px; }
        }
        .game-card { background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.06); text-align: center; padding: 10px; display: flex; flex-direction: column; align-items: center; text-decoration: none; color: #333; transition: transform 0.2s; }
        .game-card:hover { transform: translateY(-4px); }
        .game-icon { width: 72px; height: 72px; border-radius: 16px; object-fit: cover; margin-bottom: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
        @media (max-width: 480px) { .game-icon { width: 64px; height: 64px; border-radius: 14px; } }
        .game-title { font-size: 12px; font-weight: 600; line-height: 1.3; max-height: 2.6em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        footer { background: #00875a; color: white; text-align: center; padding: 20px; position: fixed; bottom: 0; left: 0; width: 100%; font-size: 12px; display: flex; flex-direction: column; gap: 8px; align-items: center; border-top: 1px solid rgba(0,0,0,0.1); z-index: 100; }
        .footer-links a { color: #fff; text-decoration: underline; margin: 0 10px; font-weight: 500; }
    </style>
</head>
<body>
    <header>GameMatrix Discovery Platform</header>
    <main class="grid-container">
        ${gamesListHtml}
    </main>
    <footer>
        <span>&copy; ${currentYear} GameMatrix (FavNinja.com)</span>
        <div class="footer-links">
            <a href="pages/contact.html">Contact</a>
            <a href="pages/privacy.html">Privacy Policy</a>
            <a href="pages/terms.html">Terms of Services</a>
        </div>
    </footer>
</body>
</html>`;
}

/**
 * 📄 DETAIL PAGE RENDERING LOGIC (Individual Game Pages)
 */
function renderDetailHtml(game) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>${game.title} - GameMatrix Metrics</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background-color: #00bfa5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #333; }
        header { background-color: #00875a; padding: 14px 20px; display: flex; align-items: center; gap: 12px; color: white; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
        header a { color: white; text-decoration: none; font-size: 18px; font-weight: bold; }
        .main-container { max-width: 700px; margin: 24px auto; background: white; border-radius: 20px; padding: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .meta-section { display: flex; gap: 16px; align-items: center; margin-bottom: 20px; }
        .detail-icon { width: 90px; height: 90px; border-radius: 20px; object-fit: cover; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .detail-info h2 { font-size: 20px; font-weight: 700; margin-bottom: 4px; color: #111; }
        .detail-info p { font-size: 13px; color: #666; }
        .btn-container { display: flex; gap: 12px; margin-top: 20px; }
        .store-btn { flex: 1; padding: 12px; text-align: center; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 14px; color: white; box-shadow: 0 3px 8px rgba(0,0,0,0.15); }
        .play-btn { background-color: #01875f; }
        .apple-btn { background-color: #000000; }
        footer { background: #fff; color: #00875a; text-align: center; padding: 16px; margin-top: 40px; font-size: 12px; font-weight: 500; border-top: 1px solid #e0e0e0; display: flex; flex-direction: column; gap: 6px; }
        .footer-links a { color: #00875a; text-decoration: underline; margin: 0 8px; }
    </style>
</head>
<body>
    <header>
        <a href="../../index.html">←</a>
        <span>GameMatrix Analytics</span>
    </header>
    <main class="main-container">
        <div class="meta-section">
            <img class="detail-icon" src="../../assets/images/${game.id}-icon.png" alt="${game.title}">
            <div class="detail-info">
                <h2>${game.title}</h2>
                <p>Developer: ${game.developer || 'Top Game Studio'}</p>
                <p>Score: ⭐ ${game.scoreText || '4.5'}</p>
            </div>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
        <div class="btn-container">
            <a class="store-btn play-btn" href="${game.url}" target="_blank">Google Play</a>
            <a class="store-btn apple-btn" href="https://apps.apple.com/us/charts/iphone/games" target="_blank">App Store</a>
        </div>
    </main>
    <footer>
        <span>&copy; ${currentYear} GameMatrix (FavNinja.com)</span>
        <div class="footer-links">
            <a href="../../pages/contact.html">Contact</a>
            <a href="../../pages/privacy.html">Privacy Policy</a>
            <a href="../../pages/terms.html">Terms of Services</a>
        </div>
    </footer>
</body>
</html>`;
}

/**
 * 🚀 MAIN ENGINE CORE EXECUTION
 */
async function runScraperEngine() {
    try {
        console.log("🚀 [ENGINE] Starting GameMatrix static generation sequence...");

        // Ensure target directories exist safely
        if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });
        if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
        if (!fs.existsSync(EXPLORE_DIR)) fs.mkdirSync(EXPLORE_DIR, { recursive: true });

        // Step 1: Automatic trigger for legal pages injection
        generateLegalPages();

        // Step 2: Fetch Top Free Games from Google Play Api
        const scrapedGames = await googlePlayScraper.list({
            collection: googlePlayScraper.collection.TOP_FREE,
            num: 60, // Limiting for lightweight optimization
            lang: 'en',
            country: 'us'
        });

        let gamesListHtml = '';
        let sitemapUrls = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        
        // Base production URL simulation
        const productionUrl = 'https://game-matrix-rho.vercel.app';
        sitemapUrls += `  <url><loc>${productionUrl}/</loc><priority>1.0</priority></url>\n`;
        sitemapUrls += `  <url><loc>${productionUrl}/pages/contact.html</loc><priority>0.5</priority></url>\n`;
        sitemapUrls += `  <url><loc>${productionUrl}/pages/privacy.html</loc><priority>0.5</priority></url>\n`;
        sitemapUrls += `  <url><loc>${productionUrl}/pages/terms.html</loc><priority>0.5</priority></url>\n`;

        console.log(`📦 [ENGINE] Scraped ${scrapedGames.length} asset instances. Building files...`);

        for (const game of scrapedGames) {
            // Placeholder mockup for local images fallback
            const localIconPath = path.join(ASSETS_DIR, 'images', `${game.appId}-icon.png`);
            
            // Grid dynamic cards injection string
            gamesListHtml += `
            <a class="game-card" href="explore/game/${game.appId}.html">
                <img class="game-icon" src="assets/images/${game.appId}-icon.png" onerror="this.src='${game.icon}'" loading="lazy" alt="${game.title}">
                <span class="game-title">${game.title}</span>
            </a>`;

            // Individual Detail HTML files dynamic writing
            const detailHtmlContent = renderDetailHtml({
                id: game.appId,
                title: game.title,
                developer: game.developer,
                scoreText: game.scoreText,
                url: game.url
            });

            fs.writeFileSync(path.join(EXPLORE_DIR, `${game.appId}.html`), detailHtmlContent, 'utf-8');
            sitemapUrls += `  <url><loc>${productionUrl}/explore/game/${game.appId}.html</loc><priority>0.8</priority></url>\n`;
        }

        // Write Home Page Index File
        const completeIndexHtml = renderIndexHtml(gamesListHtml);
        fs.writeFileSync(path.join(DIST_DIR, 'index.html'), completeIndexHtml, 'utf-8');

        // Close and Write Sitemap file for Google SEO crawling
        sitemapUrls += `</urlset>`;
        fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapUrls, 'utf-8');

        console.log("🎯 [SUCCESS] Whole architecture compiled smoothly. GameMatrix layout operational!");

    } catch (error) {
        console.error("❌ [CRITICAL_ERROR] Pipeline engine failed:", error);
    }
}

// Fire the core function
runScraperEngine();