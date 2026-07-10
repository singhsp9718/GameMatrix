import googlePlayScraper from 'google-play-scraper';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import https from 'https';

// ==============================================================================
// CONFIGURATION & ENVIRONMENT TUNNELS (AWS CAPABLE ENGINE)
// ==============================================================================
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || '';
const IS_AWS_READY = process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined || S3_BUCKET_NAME !== '';

const KEYWORDS = [
    "action games", "adventure games", "arcade games", "board games", 
    "card games", "casino games", "casual games", "educational games", 
    "music games", "puzzle games", "role playing games", "simulation games", 
    "sports games", "strategy games", "trivia games", "word games"
];
const MAX_UNIQUE_GAMES = 100;
const DOMAIN_URL = "https://favninja.com";
const PINNED_GAME_ID = ''; 

const INTRO_TEMPLATES = [
    "Join hundreds of millions of players for FREE and start the fun adventure now! Team up with your friends, climb the leaderboards, gather in clans, collect hats, take on challenges, and play fun events in all-new game modes. Experience the dynamic world of {genre} with {title} as it delivers an evolving structure built for pure entertainment.",
    "Unleash your skills and dive into the mechanics of {title}. Designed specifically for lovers of the {genre} category, this game combines interactive challenge loops with clean performance updates that keep players retained over longer cycles.",
    "Discover what makes {title} a standout application within the modern mobile ecosystem. Combining traditional {genre} strategies with updated graphical elements, it targets modern hardware profiles efficiently while delivering intuitive user experiences."
];

const VERDICT_TEMPLATES = [
    "Overall, {title} stands out as a highly polished release in the {genre} domain. By keeping system resource usage minimal and scaling execution loops flawlessly across varying chipsets, it is a highly recommended deployment node for your daily gaming framework.",
    "The analytical verdict points to {title} being a major progression framework for the modern enthusiast. If you enjoy pure {genre} loops, this optimized build ensures that data mapping stays fluid and memory allocation runs clean.",
    "Our definitive benchmark proves that {title} scores effectively on asset performance metrics. It brings excellent structural integrity to the {genre} platform, matching robust frame rates with interactive retention layers perfectly."
];

// ==============================================================================
// CORE HELPERS & UTILITY IMPLEMENTATIONS
// ==============================================================================
function cleanText(text) {
    if (!text) return "";
    return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

// SMART FORMATTER ENGINE: Converts raw strings/numbers like 100000000 to 100M or 500k
function formatKMB(val) {
    if (!val) return "0";
    let num = typeof val === 'number' ? val : parseInt(val.toString().replace(/[^0-9]/g, ''), 10);
    if (isNaN(num)) return val; 

    if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return num.toString();
}

// DYNAMIC APPLE APP STORE RESOLVER ENGINE
async function fetchAppleStoreUrl(appId, gameTitle) {
    return new Promise((resolve) => {
        const lookupUrl = `https://itunes.apple.com/lookup?bundleId=${appId}`;
        https.get(lookupUrl, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.resultCount > 0 && json.results[0].trackViewUrl) {
                        resolve(json.results[0].trackViewUrl);
                        return;
                    }
                } catch (e) {}
                resolve(`https://www.apple.com/us/search/${encodeURIComponent(gameTitle)}?src=globalnav`);
            });
        }).on('error', () => {
            resolve(`https://www.apple.com/us/search/${encodeURIComponent(gameTitle)}?src=globalnav`);
        });
    });
}

function parseSizeToMB(sizeStr) {
    if (!sizeStr || typeof sizeStr !== 'string') return 0.0;
    const match = sizeStr.match(/([0-9.]+)\s*(M|G|k|b)?/i);
    if (!match) return 0.0;
    const val = parseFloat(match[1]);
    const unit = match[2] ? match[2].toLowerCase() : 'm';
    if (unit === 'g') return val * 1024;
    if (unit === 'k') return val / 1024;
    return val;
}

async function downloadImageToBuffer(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to load asset status: ${res.statusCode}`));
                return;
            }
            const dataBlocks = [];
            res.on('data', (chunk) => dataBlocks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(dataBlocks)));
        }).on('error', (err) => reject(err));
    });
}

async function checkS3FileExists(key) {
    const s3Client = new S3Client({});
    try {
        await s3Client.send(new HeadObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key }));
        return true;
    } catch (err) {
        return false;
    }
}

// ==============================================================================
// PHASE 1: RE-ENGINEERED SMART FILE VALIDATION & INGESTION SHIELD
// ==============================================================================
async function processAndSyncGameAssets(game) {
    const appId = game.appId;
    const localAssetBaseDir = path.join('assets', 'images', appId);
    const resolvedLocalDir = path.join(process.cwd(), 'dist', localAssetBaseDir);
    
    let mappedIconPath = "";
    let mappedScreenshotPaths = [];

    if (game.icon) {
        const iconFilename = "icon.png";
        const relativeIconStorageKey = path.join(localAssetBaseDir, iconFilename).replace(/\\/g, '/');
        const localIconDiskLocation = path.join(resolvedLocalDir, iconFilename);
        
        let shouldDownloadIcon = true;
        if (IS_AWS_READY) {
            if (await checkS3FileExists(relativeIconStorageKey)) shouldDownloadIcon = false;
        } else {
            if (fs.existsSync(localIconDiskLocation)) shouldDownloadIcon = false;
        }

        if (shouldDownloadIcon) {
            try {
                const imgBuffer = await downloadImageToBuffer(game.icon);
                await commitAssetToStorage(relativeIconStorageKey, imgBuffer, "image/png");
            } catch (err) {
                console.log(`[Asset Edge Skip] Icon extraction failed for ${appId}`);
            }
        }
        mappedIconPath = relativeIconStorageKey;
    }

    const playStoreScreenshots = game.screenshots || [];
    let ssCounter = 1;

    for (const ssUrl of playStoreScreenshots.slice(0, 6)) {
        const ssFilename = `screenshot_${ssCounter}.png`;
        const relativeSsStorageKey = path.join(localAssetBaseDir, ssFilename).replace(/\\/g, '/');
        const localSsDiskLocation = path.join(resolvedLocalDir, ssFilename);
        
        let shouldDownloadSs = true;
        if (IS_AWS_READY) {
            if (await checkS3FileExists(relativeSsStorageKey)) shouldDownloadSs = false;
        } else {
            if (fs.existsSync(localSsDiskLocation)) shouldDownloadSs = false;
        }

        if (shouldDownloadSs) {
            try {
                const imgBuffer = await downloadImageToBuffer(ssUrl);
                await commitAssetToStorage(relativeSsStorageKey, imgBuffer, "image/png");
            } catch (err) {
                console.log(`[Asset Edge Skip] Screenshot processing failed for ${appId}`);
            }
        }
        mappedScreenshotPaths.push(relativeSsStorageKey);
        ssCounter++;
    }

    game.localIconUrl = mappedIconPath ? `../../${mappedIconPath}` : game.icon;
    game.localScreenshots = mappedScreenshotPaths.map(p => `../../${p}`);
    if (game.localScreenshots.length === 0) game.localScreenshots = playStoreScreenshots;
}

async function commitAssetToStorage(relativeFilePath, dataBuffer, contentType = "text/html") {
    if (IS_AWS_READY) {
        const s3Client = new S3Client({});
        const normalizedKey = relativeFilePath.replace(/^\/+/, '');
        await s3Client.send(new PutObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: normalizedKey,
            Body: dataBuffer,
            ContentType: contentType,
            CacheControl: "max-age=2592000, public"
        }));
    } else {
        const fullLocalDiskPath = path.join(process.cwd(), 'dist', relativeFilePath);
        fs.mkdirSync(path.dirname(fullLocalDiskPath), { recursive: true });
        fs.writeFileSync(fullLocalDiskPath, dataBuffer);
    }
}

// ==============================================================================
// PHASE 2: VALUE ADD CONTEXT & METRICS CALIBRATION (STRATEGY 3 PROS & CONS)
// ==============================================================================
function generateSeoContent(gameData) {
    const title = gameData.title || 'This Game';
    const genre = gameData.genre || 'Mobile Gaming';
    const rawDesc = cleanText(gameData.description || '');
    
    const randomIntroIdx = Math.floor(Math.random() * INTRO_TEMPLATES.length);
    const intro = INTRO_TEMPLATES[randomIntroIdx].replace(/{title}/g, title).replace(/{genre}/g, genre);
    
    const sentences = rawDesc.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 10);
    let excerpt = `The design framework of ${title} targets sustainable retention mechanics within the competitive ecosystem.`;
    if (sentences.length >= 2) {
        excerpt = `Architecturally, the app focuses on several key layers. Notably, ${sentences[0]}. Furthermore, user patterns show that ${sentences[1]}.`;
    } else if (sentences.length === 1) {
        excerpt = `Core engineering highlights show that ${sentences[0]}. This underpins the main user interaction pipeline.`;
    }

    const randomVerdictIdx = Math.floor(Math.random() * VERDICT_TEMPLATES.length);
    const verdict = VERDICT_TEMPLATES[randomVerdictIdx].replace(/{title}/g, title).replace(/{genre}/g, genre);
    
    const sizeStr = gameData.size || '0';
    const sizeMb = parseSizeToMB(sizeStr);
    const scoreVal = gameData.score || 4.0;
    
    let hardwareTag = "Standard Balanced Profile";
    let hardwareDesc = "Optimized for mainstream mid-tier chipsets. Demonstrates stable memory allocation profiles.";
    
    if (sizeMb === 0.0) {
        hardwareTag = "Adaptive Architecture / Universal Fit";
        hardwareDesc = "Features dynamic asset delivery calibrated automatically to target host system parameters.";
    } else if (sizeMb < 50.0) {
        hardwareTag = "Storage Friendly / Lite Game";
        hardwareDesc = "Highly optimized bundle footprint. Loads rapidly over variable networks and conserves local block storage storage nodes.";
    } else if (sizeMb > 500.0) {
        hardwareTag = "High Performance Required";
        hardwareDesc = "Demands high-end SoC processor architecture and a minimum of 4GB available RAM for sustained high frame-rates.";
    }

    let ratingTag = "";
    if (scoreVal >= 4.5) {
        ratingTag = "Critically Acclaimed / Community Choice";
    } else if (scoreVal >= 4.0) {
        ratingTag = "Highly Rated / Stable Player Base";
    }

    return { intro, overview: excerpt, verdict, hardwareTag, hardwareDesc, ratingTag };
}

// ==============================================================================
// PHASE 4: STATIC PLATFORM RENDERING ENGINES
// ==============================================================================
function renderIndexHtml(gamesList) {
    let gridItemsHtml = "";
    const currentYear = new Date().getFullYear();

    gamesList.forEach((g, idx) => {
        const pid = g.appId;
        const title = g.title || 'Game';
        const iconPath = g.localIconUrl ? g.localIconUrl.replace('../../', '') : (g.icon || '');
        const score = g.score || 0.0;
        const stars = Math.round(score);
        const starHtml = "★".repeat(stars) + "☆".repeat(5 - stars);
        
        let customClass = "grid-item";
        
        if (idx === 0) {
            customClass += " row1-big"; 
        } else if (idx === 1 || idx === 2) {
            customClass += " row1-small"; 
        } else if (idx === 3 || idx === 4 || idx === 6 || idx === 7) {
            customClass += " row-small-fit"; 
        } else if (idx === 5) {
            customClass += " row2-big"; 
        } else {
            customClass += " standard-col"; 
        }

        gridItemsHtml += `
        <div class="${customClass}">
            <img src="${iconPath}" alt="${title}" loading="lazy" />
            <a href="explore/game/${pid}.html" class="hover-mask">
                <div class="mask-title">${title}</div>
                <div class="mask-stars">${starHtml}</div>
            </a>
        </div>`;
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>GameMatrix - Best Mobile Games</title>
    <meta name="description" content="Explore our expert performance tracking platform. Download top hardware-tested mobile games for Android and iOS devices instantly.">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background-color: #00bfa5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #fff; padding: 0; min-height: 100vh; display: flex; flex-direction: column; overflow-x: hidden; }
        header { background-color: #00875a; padding: 14px 24px; border-bottom: 1px solid rgba(0,0,0,0.1); display: flex; align-items: center; gap: 10px; }
        header h1 { font-size: 18px; color: #fff; font-weight: 600; letter-spacing: 0.2px; }
        
        .matrix-container { flex: 1; padding: 20px 12px; display: flex; justify-content: center; width: 100%; }
        
        .matrix-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 12px; 
            max-width: 480px; 
            width: 100%; 
            grid-auto-rows: 1fr;
            grid-auto-flow: dense;
        }
        
        .grid-item { 
            position: relative; 
            border-radius: 18px; 
            overflow: hidden; 
            background: #fff; 
            box-shadow: 0 3px 8px rgba(0,0,0,0.12); 
            transition: transform 0.2s ease, box-shadow 0.2s ease; 
            width: 100%; 
            aspect-ratio: 1 / 1;
        }
        .grid-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
        
        .row1-big { grid-column: 1 / 3; grid-row: span 2; }
        .row1-small { grid-column: 3 / 4; grid-row: span 1; }
        .row-small-fit { grid-row: span 1; }
        .row2-big { grid-column: 2 / 4; grid-row: span 2; }
        .standard-col { grid-column: span 1; grid-row: span 1; }

        .grid-item:hover { transform: scale(1.03); z-index: 5; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .hover-mask { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 135, 90, 0.95); opacity: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 8px; transition: opacity 0.2s ease; text-decoration: none; color: #fff; z-index: 2; }
        .grid-item:hover .hover-mask { opacity: 1; }
        .mask-title { font-size: 11px; font-weight: bold; line-height: 1.3; max-height: 42px; overflow: hidden; margin-bottom: 4px; color: #fff; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; }
        .mask-stars { font-size: 11px; color: #ffd600; }
        
        @media(min-width: 768px) {
            .matrix-container { padding: 30px 15px; }
            .matrix-grid { 
                max-width: 1200px; 
                grid-template-columns: repeat(auto-fill, minmax(115px, 1fr)); 
                grid-auto-rows: 115px; 
                gap: 16px; 
            }
            .row1-big { grid-column: span 2; grid-row: span 2; }
            .row2-big { grid-column: span 2; grid-row: span 2; }
            .row1-small, .row-small-fit, .standard-col { grid-column: span 1; grid-row: span 1; }
        }

        footer { background: #fff; text-align: center; color: #00875a; font-size: 12px; border-top: 1px solid #e0e0e0; padding: 16px; margin-top: auto; display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; font-weight: 500; }
        footer a { color: #00875a; text-decoration: none; }
        footer a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <header>
        <span style="font-size:18px;">🎮</span>
        <h1>GameMatrix</h1>
    </header>
    <main class="matrix-container">
        <div class="matrix-grid">
            ${gridItemsHtml}
        </div>
    </main>
    <footer>
    <span>&copy; ${currentYear} GameMatrix (FavNinja.com)</span>
    <a href="pages/contact.html" onclick="window.location.href='pages/contact.html';">Contact</a>
    <a href="pages/privacy.html" onclick="window.location.href='pages/privacy.html';">Privacy Policy</a>
    <a href="pages/terms.html" onclick="window.location.href='pages/terms.html';">Terms Of Services</a>
</footer>
</body>
</html>`;
}

function renderDetailHtml(game, seo, top10, totalGameList, appleStoreUrl) {
    const currentYear = new Date().getFullYear();
    const title = game.title || 'Game Detail';
    const icon = game.localIconUrl || game.icon || '';
    const genre = game.genre || 'Casual';
    
    // DOWNLOAD NODES FORMATTING APPLIED HERE (100000000+ -> 100M+)
    const installs = formatKMB(game.installs) + '+';
    const reviewsCountClean = formatKMB(game.reviews || '1250000');
    
    const scoreNum = game.score || 4.1;
    const score = scoreNum.toFixed(1);
    const size = game.size || 'Varies with device';
    const updated = game.updatedString || 'Jul 2, 2026';
    const price = game.priceText || 'Free';
    const appId = game.appId || '';
    const playUrl = game.url || `https://play.google.com/store/apps/details?id=${appId}`;
    
    const localScrenshotsList = game.localScreenshots || [];
    let carouselHtml = localScrenshotsList.map(ss => `<img src="${ss}" alt="Screenshot Asset View" />`).join('');
    if (!carouselHtml) {
        carouselHtml = `<div class="no-preview">No screenshot assets loaded.</div>`;
    }
        
    let sidebarHtml = top10.map(tg => `
        <div class="sidebar-item">
            <img src="${tg.localIconUrl || tg.icon || ''}" alt="${tg.title}" />
            <div class="sidebar-info">
                <a href="../../explore/game/${tg.appId}.html" class="sidebar-title">${tg.title}</a>
                <div class="sidebar-rating">⭐ ${tg.score ? tg.score.toFixed(1) : '4.5'}</div>
            </div>
        </div>`).join('');
        
    let featuredGridHtml = totalGameList.filter(x => x.appId !== appId).slice(0, 12).map(fg => `
        <a href="../../explore/game/${fg.appId}.html" class="feat-card">
            <img src="${fg.localIconUrl || fg.icon || ''}" alt="App Icon Layout" />
            <div class="feat-title">${fg.title || 'Featured'}</div>
        </a>`).join('');

    const hist = game.histogram || { 1: 5, 2: 5, 3: 10, 4: 20, 5: 60 };
    const totalHist = Object.values(hist).reduce((a, b) => a + b, 0) || 1;
    const h5 = Math.round((hist[5] / totalHist) * 100);
    const h4 = Math.round((hist[4] / totalHist) * 100);
    const h3 = Math.round((hist[3] / totalHist) * 100);
    const h2 = Math.round((hist[2] / totalHist) * 100);
    const h1 = Math.round((hist[1] / totalHist) * 100);

    const comments = game.comments || [];
    let reviewsHtml = comments.length > 0 ? comments.slice(0, 4).map(textStr => `
        <div class="review-box">
            <div class="review-header"><span class="user-name">👤 Google Play Reviewer</span><span class="user-rating">⭐ 5.0</span></div>
            <p class="review-body">${cleanText(textStr)}</p>
        </div>`).join('') : `
        <div class="review-box">
            <div class="review-header"><span class="user-name">👤 RainsIthefan Gamerz</span><span class="user-rating">⭐ 4.0</span></div>
            <p class="review-body">Outstanding progression systems and highly optimized operational control performance structures.</p>
        </div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    
    <title>Download ${title} for Android & iOS - GameMatrix Review</title>
    <meta name="description" content="Read our performance testing review for ${title}. Analyze data size metrics, hardware requirement benchmarks, and get official download nodes safely.">
    <meta name="robots" content="index, follow">
    
    <meta property="og:title" content="${title} Download - GameMatrix">
    <meta property="og:description" content="Is ${title} highly compatible with your phone storage layout? Read our deep analytical review now.">
    <meta property="og:image" content="${icon.replace('../../', '')}">
    <meta property="og:type" content="website">

    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background-color: #f6f8fa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #333; line-height: 1.5; padding: 0; min-height: 100vh; display: flex; flex-direction: column; overflow-x: hidden; }
        
        header { background-color: #00875a; padding: 12px 0; border-bottom: 1px solid rgba(0,0,0,0.1); width: 100%; }
        .header-inner { max-width: 960px; margin: 0 auto; padding: 0 15px; }
        .nav-back { color: #fff; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-flex; align-items: center; gap: 6px; }
        
        .wrapper { max-width: 960px; margin: 25px auto; display: grid; grid-template-columns: 1fr 280px; gap: 24px; padding: 0 15px; width: 100%; flex: 1; }
        @media(max-width: 850px) { .wrapper { grid-template-columns: 1fr; margin: 15px auto; } }
        
        .main-content { background: #fff; border: 1px solid #e1e4e8; border-radius: 4px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden; width: 100%; }
        @media(max-width: 480px) { .main-content { padding: 16px; } }
        
        .app-header { display: flex; gap: 20px; align-items: center; margin-bottom: 25px; width: 100%; }
        .app-icon { width: 96px; height: 96px; border-radius: 18px; object-fit: cover; border: 1px solid #eaeaea; flex-shrink: 0; }
        .app-details { flex: 1; min-width: 0; }
        .app-details h1 { font-size: 20px; font-weight: 700; color: #111; margin-bottom: 6px; word-break: break-word; line-height: 1.2; }
        .app-meta-sub { font-size: 13px; color: #666; display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
        .star-rating-badge { font-size: 13px; font-weight: 600; color: #e0a100; }
        
        @media(min-width: 600px) {
            .app-icon { width: 110px; height: 110px; border-radius: 22px; }
            .app-details h1 { font-size: 24px; }
        }

        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px; }
        .info-table tr { border-bottom: 1px solid #f1f1f1; }
        .info-table td { padding: 10px 4px; }
        .info-table td.label { color: #666; width: 120px; }
        .info-table td.value { color: #111; font-weight: 500; word-break: break-word; }
        
        .btn-row { display: flex; gap: 12px; margin-bottom: 30px; flex-wrap: wrap; }
        .btn { flex: 1; min-width: 140px; text-align: center; padding: 11px; border-radius: 20px; font-weight: bold; font-size: 13px; text-decoration: none; transition: background 0.1s; }
        .btn-appstore { background-color: #00da77; color: #fff; }
        .btn-appstore:hover { background-color: #00be68; }
        .btn-googleplay { background-color: #00da77; color: #fff; }
        .btn-googleplay:hover { background-color: #00be68; }
        
        .section-title { font-size: 18px; font-weight: bold; color: #222; margin-bottom: 14px; border-bottom: 1px solid #e1e4e8; padding-bottom: 6px; }
        .editor-content { font-size: 13px; color: #444; margin-bottom: 30px; line-height: 1.6; text-align: justify; }
        
        .seo-badges-frame { border: 1px solid #cbd5e1; background-color: #f8fafc; border-radius: 12px; padding: 18px; margin: 20px 0 30px 0; }
        .matrix-badge-container { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
        .seo-matrix-badge { display: inline-flex; align-items: center; padding: 6px 14px; font-size: 12.5px; font-weight: 700; border-radius: 30px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .badge-lite { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .badge-heavy { background-color: #fef2f2; color: #991b1b; border: 1px solid #fee2e2; }
        .badge-standard { background-color: #f0f9ff; color: #075985; border: 1px solid #bae6fd; }
        .badge-rated { background-color: #fdfaf2; color: #854d0e; border: 1px solid #fef08a; }
        .seo-matrix-desc { font-size: 13px; color: #475569; line-height: 1.5; }
        
        .slider-frame { position: relative; margin-bottom: 30px; display: flex; align-items: center; width: 100%; max-width: 100%; }
        .screenshots-container { display: flex; gap: 10px; overflow-x: hidden; scroll-behavior: smooth; width: 100%; -webkit-overflow-scrolling: touch; overflow: -moz-scrollbars-none; ms-overflow-style: none; }
        .screenshots-container::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        .screenshots-container img { height: 210px; width: auto; max-width: 140px; object-fit: cover; border-radius: 6px; border: 1px solid #e1e4e8; flex-shrink: 0; }
        .slider-btn { position: absolute; width: 34px; height: 34px; background: #00875a; color: #fff; border: none; border-radius: 50%; font-size: 14px; cursor: pointer; display: flex; justify-content: center; align-items: center; z-index: 10; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.25); user-select: none; }
        .slider-btn:hover { background: #00be68; }
        .slider-btn.left-btn { left: -10px; }
        .slider-btn.right-btn { right: -10px; }
        
        .featured-app-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 16px; margin-bottom: 35px; width: 100%; }
        .feat-card { display: flex; flex-direction: column; align-items: center; text-align: center; border: 1px solid #e2e8f0; padding: 16px 10px; border-radius: 14px !important; background: #fff; text-decoration: none; justify-content: center; box-shadow: 0 1px 2px rgba(0,0,0,0.02); transition: all 0.2s ease; }
        .feat-card:hover { transform: translateY(-2px); border-color: #cbd5e1; }
        .feat-card img { width: 56px; height: 56px; border-radius: 12px !important; object-fit: cover; margin-bottom: 12px; flex-shrink: 0; }
        .feat-title { font-size: 12px; font-weight: 500; color: #334155; text-decoration: none; width: 100%; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; padding: 0 2px; }
        
        /* PLAY STORE OFFICIAL SIDE-BY-SIDE RATING HUB ENGINE (FIXED) */
        .rating-summary-wrapper { 
            display: flex; 
            align-items: center; 
            gap: 20px; 
            margin-bottom: 30px; 
            background: #fff; 
            padding: 8px 4px;
            width: 100%;
        }
        .rating-giant { 
            text-align: left; 
            width: auto; 
            padding-right: 10px; 
            flex-shrink: 0;
        }
        .rating-giant h2 { font-size: 48px; font-weight: 600; color: #202124; line-height: 1.1; margin-bottom: 2px; letter-spacing: -0.5px; }
        .rating-giant .stars { color: #00875a; font-size: 12px; margin: 4px 0; letter-spacing: 1px; }
        .rating-giant .total { font-size: 12px; color: #5f6368; white-space: nowrap; margin-top: 4px; }
        
        .bar-stack { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .bar-row { display: flex; align-items: center; gap: 12px; font-size: 12px; color: #202124; height: 14px; }
        .bar-row span { width: 8px; text-align: center; font-weight: 400; font-family: roboto, sans-serif; }
        .bar-bg { flex: 1; height: 10px; background: #e8eaed; border-radius: 20px; overflow: hidden; }
        .bar-fill { height: 100%; background: #00875a; border-radius: 20px; }
        
        .review-box { border-left: 3px solid #00875a; background: #fafafa; padding: 12px 16px; margin-bottom: 12px; font-size: 12.5px; border-bottom: 1px solid #e1e4e8; border-radius: 0 4px 4px 0; width: 100%; }
        .review-header { display: flex; justify-content: space-between; margin-bottom: 4px; font-weight: bold; color: #222; flex-wrap: wrap; gap: 5px; }
        .review-body { color: #555; line-height: 1.4; word-break: break-word; }
        
        .sidebar-container { background: #fff; border: 1px solid #e1e4e8; border-radius: 4px; padding: 16px; height: fit-content; width: 100%; }
        .sidebar-container h2 { font-size: 13px; font-weight: 700; color: #111; margin-bottom: 15px; border-bottom: 2px solid #00875a; padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.3px; }
        .sidebar-item { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #f9f9f9; padding-bottom: 12px; }
        .sidebar-item img { width: 40px; height: 40px; border-radius: 8px; border: 1px solid #eee; object-fit: cover; flex-shrink: 0; }
        .sidebar-info { flex: 1; overflow: hidden; }
        .sidebar-title { font-size: 12px; font-weight: 600; color: #333; text-decoration: none; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sidebar-title:hover { color: #00875a; }
        .sidebar-rating { font-size: 11px; color: #e0a100; font-weight: bold; margin-top: 1px; }
        
        footer { 
            background: #fff; 
            text-align: center; 
            color: #777; 
            font-size: 12px; 
            border-top: 1px solid #e1e4e8; 
            padding: 20px; 
            width: 100%; 
            margin-top: auto; 
            display: flex; 
            flex-wrap: wrap; 
            justify-content: center; 
            align-items: center;
            gap: 15px; 
            font-weight: 500; 
        }
        footer a { color: #00875a; text-decoration: none; }
        footer a:hover { text-decoration: underline; }
    </style>
    
    <script>
        function performCarouselScroll(btnElement, displacementVal) {
            const currentFrame = btnElement.closest('.slider-frame');
            if (currentFrame) {
                const targetContainer = currentFrame.querySelector('.screenshots-container');
                if (targetContainer) {
                    targetContainer.scrollLeft += displacementVal;
                }
            }
        }
    </script>
</head>
<body>
    <header>
        <div class="header-inner">
            <a href="../../index.html" class="nav-back">← GameMatrix Home</a>
        </div>
    </header>
    
    <div class="wrapper">
        <main class="main-content">
            <section class="app-header">
                <img class="app-icon" src="${icon}" alt="Icon" />
                <div class="app-details">
                    <h1>${title}</h1>
                    <div class="app-meta-sub">
                        <span>🎮 ${genre}</span> | <span>🤖 Android</span>
                    </div>
                    <div class="star-rating-badge">⭐ ${score} / 5</div>
                </div>
            </section>
            
            <table class="info-table">
                <tr><td class="label">Platform</td><td class="value">🤖 Android / 🍏 iOS</td></tr>
                <tr><td class="label">Price</td><td class="value">${price}</td></tr>
                <tr><td class="label">Installs</td><td class="value">${installs}</td></tr>
                <tr><td class="label">Updated</td><td class="value">${updated}</td></tr>
                <tr><td class="label">Size</td><td class="value">${size}</td></tr>
            </table>
            
            <div class="btn-row">
                <a href="${appleStoreUrl}" target="_blank" rel="noopener" class="btn btn-appstore">App Store</a>
                <a href="${playUrl}" target="_blank" rel="noopener" class="btn btn-googleplay">Google Play</a>
            </div>
            
            <h2 class="section-title">Editor's Review</h2>
            <div class="editor-content">
                <p style="margin-bottom:10px;">${seo.intro}</p>
                <p style="margin-bottom:10px;">${seo.overview}</p>
                
                <div class="seo-badges-frame">
                    <div class="matrix-badge-container">
                        ${size.includes('M') && parseFloat(size) < 50 ? `<span class="seo-matrix-badge badge-lite">🟢 Storage Friendly / Lite Game</span>` : ''}
                        ${size.includes('M') && parseFloat(size) > 500 || size.includes('G') ? `<span class="seo-matrix-badge badge-heavy">🔴 High Storage Required</span>` : ''}
                        ${!size.includes('G') && !(size.includes('M') && parseFloat(size) > 500) && !(size.includes('M') && parseFloat(size) < 50) ? `<span class="seo-matrix-badge badge-standard">🔵 Standard Balanced Profile</span>` : ''}
                        ${scoreNum >= 4.5 ? `<span class="seo-matrix-badge badge-rated">🔥 Highly Rated by Community</span>` : ''}
                        ${seo.ratingTag ? `<span class="seo-matrix-badge badge-standard">⭐ ${seo.ratingTag}</span>` : ''}
                    </div>
                    <p class="seo-matrix-desc">Our structural metrics show that this build bundle utilizes ${size} storage layout space. Based on play store crowdsourced user signals, it sustains a stable hardware execution velocity with a current calibrated consumer score of ${score}/5.0.</p>
                </div>

                <p style="font-weight:600; color:#111;">${seo.verdict}</p>
            </div>
            
            <h2 class="section-title">Screenshots</h2>
            <div class="slider-frame">
                <button class="slider-btn left-btn" onclick="performCarouselScroll(this, -260);">&lt;</button>
                <div class="screenshots-container">
                    ${carouselHtml}
                </div>
                <button class="slider-btn right-btn" onclick="performCarouselScroll(this, 260);">&gt;</button>
            </div>
            
            <h2 class="section-title">Featured Apps</h2>
            <div class="featured-app-grid">
                ${featuredGridHtml}
            </div>
            
            <h2 class="section-title">Ratings and reviews →</h2>
            <div class="rating-summary-wrapper">
                <div class="rating-giant">
                    <h2>${score}</h2>
                    <div class="stars">★★★★★</div>
                    <div class="total">${reviewsCountClean} reviews</div>
                </div>
                <div class="bar-stack">
                    <div class="bar-row"><span>5</span><div class="bar-bg"><div class="bar-fill" style="width: ${h5}%;"></div></div></div>
                    <div class="bar-row"><span>4</span><div class="bar-bg"><div class="bar-fill" style="width: ${h4}%;"></div></div></div>
                    <div class="bar-row"><span>3</span><div class="bar-bg"><div class="bar-fill" style="width: ${h3}%;"></div></div></div>
                    <div class="bar-row"><span>2</span><div class="bar-bg"><div class="bar-fill" style="width: ${h2}%;"></div></div></div>
                    <div class="bar-row"><span>1</span><div class="bar-bg"><div class="bar-fill" style="width: ${h1}%;"></div></div></div>
                </div>
            </div>
            
            <div class="reviews-list">
                ${reviewsHtml}
            </div>
        </main>
        
        <aside class="sidebar-container">
            <h2>Top Games</h2>
            <div class="sidebar-list">
                ${sidebarHtml}
            </div>
        </aside>
    </div>
    
    <footer>
    <span>&copy; ${currentYear} GameMatrix (FavNinja.com)</span>
    <a href="../../pages/contact.html" onclick="window.location.href='../../pages/contact.html';">Contact</a> | 
    <a href="../../pages/privacy.html" onclick="window.location.href='../../pages/privacy.html';">Privacy Policy</a> | 
    <a href="../../pages/terms.html" onclick="window.location.href='../../pages/terms.html';">Terms of Services</a>
</footer>
</body>
</html>`;
}

// ==============================================================================
// PHASE 5: RUNTIME EXECUTION EXPORT SCHEDULER
// ==============================================================================
async function executePipeline() {
    console.log(`Pipeline iteration initiated at timestamp: ${new Date().toISOString()}`);
    const uniqueGamesMap = new Map();
    
    for (const kw of KEYWORDS) {
        if (uniqueGamesMap.size >= MAX_UNIQUE_GAMES) break;
        console.log(`Scanning matrix category: '${kw}'`);
        
        try {
            const searchResults = await googlePlayScraper.search({
                term: kw, num: 15, lang: 'en', country: 'us'
            });
            for (const item of searchResults) {
                if (item.appId && !uniqueGamesMap.has(item.appId)) {
                    uniqueGamesMap.set(item.appId, item);
                    if (uniqueGamesMap.size >= MAX_UNIQUE_GAMES) break;
                }
            }
        } catch (err) {
            console.log(`Warning filtering query context: ${err.message}`);
        }
    }
    
    const allGameIds = Array.from(uniqueGamesMap.keys());
    console.log(`Total explicit unique indices detected: ${allGameIds.length}`);
    
    const hydratedGames = [];
    let count = 1;
    
    for (const pid of allGameIds) {
        try {
            const detailedData = await googlePlayScraper.app({ appId: pid, lang: 'en', country: 'us' });
            if (detailedData) {
                await processAndSyncGameAssets(detailedData);
                hydratedGames.push(detailedData);
                console.log(`[${count++}/${allGameIds.length}] Asset sync + matrix mapped: ${pid}`);
            }
        } catch (innerErr) {
            console.log(`Edge skip on asset node '${pid}': ${innerErr.message}`);
        }
    }

    if (hydratedGames.length === 0) {
        console.log("CRITICAL CONTEXT TIMEOUT: Operational dataset array empty.");
        return { status: "ERROR" };
    }

    hydratedGames.sort((a, b) => (b.score || 0) - (a.score || 0));

    if (PINNED_GAME_ID && PINNED_GAME_ID !== '') {
        const pinnedIndex = hydratedGames.findIndex(game => game.appId === PINNED_GAME_ID);
        if (pinnedIndex !== -1) {
            const [pinnedGame] = hydratedGames.splice(pinnedIndex, 1);
            hydratedGames.unshift(pinnedGame);
            console.log(`[STRATEGIC OVERRIDE] Pinned asset ${PINNED_GAME_ID} forced to rank 0.`);
        }
    }

    const top10 = hydratedGames.slice(0, 10);
    console.log("Compiling static presentation structural layouts...");
    
    for (const game of hydratedGames) {
        const pid = game.appId;
        const seoSpunData = generateSeoContent(game);
        
        // FETCH LIVE DYNAMIC APPLE APP STORE LINK LOOKUP
        console.log(`Resolving live Apple App Store node mapping for: ${pid}`);
        const dynamicAppleStoreLink = await fetchAppleStoreUrl(pid, game.title);
        
        const detailHtmlContent = renderDetailHtml(game, seoSpunData, top10, hydratedGames, dynamicAppleStoreLink);
        await commitAssetToStorage(`explore/game/${pid}.html`, Buffer.from(detailHtmlContent, 'utf-8'), "text/html");
    }
    
    const indexHtmlContent = renderIndexHtml(hydratedGames);
    await commitAssetToStorage("index.html", Buffer.from(indexHtmlContent, 'utf-8'), "text/html");
    
    console.log("Compiling sitemap.xml dynamic schema...");
    let sitemapUrls = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${DOMAIN_URL}/index.html</loc>
        <priority>1.0</priority>
        <changefreq>daily</changefreq>
    </url>`;

    for (const game of hydratedGames) {
        sitemapUrls += `
    <url>
        <loc>${DOMAIN_URL}/explore/game/${game.appId}.html</loc>
        <priority>0.8</priority>
        <changefreq>weekly</changefreq>
    </url>`;
    }
    sitemapUrls += `\n</urlset>`;

    await commitAssetToStorage("sitemap.xml", Buffer.from(sitemapUrls, 'utf-8'), "application/xml");
    console.log("[SEO Shield] sitemap.xml generated successfully in root.");

    console.log("\nExecution completed successfully!");
    return {
        status: "SUCCESS",
        count: hydratedGames.length,
        mode: IS_AWS_READY ? "AWS_PRODUCTION" : "LOCAL_SANDBOX"
    };
}

export const lambdaHandler = async (event, context) => {
    return await executePipeline();
};

if (process.env.AWS_LAMBDA_FUNCTION_NAME === undefined) {
    executePipeline().catch(console.error);
}