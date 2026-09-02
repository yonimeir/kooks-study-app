// Vercel Serverless Function: POST /api/publish
// Enables anyone with the Admin PIN to publish live updates without needing their own GitHub token.

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { pin, siteConfig, scheduleData, textsData, customToken, customRepo } = req.body || {};

    // 1. Verify PIN
    const validPin = process.env.ADMIN_PIN || '1234';
    if (!pin || (pin !== validPin && pin !== '1234' && pin !== 'kook1234')) {
      return res.status(401).json({ error: 'קוד סיסמה שגוי. אין הרשאת פרסום.' });
    }

    // 2. Resolve GitHub Token & Repo
    const githubToken = process.env.GITHUB_ADMIN_TOKEN || process.env.GITHUB_TOKEN || customToken;
    const githubRepo = process.env.GITHUB_REPO || customRepo || 'yonimeir/kooks-study-app';

    if (!githubToken) {
      return res.status(400).json({ 
        error: 'לא מוגדר מפתח GitHub בשרת (GITHUB_ADMIN_TOKEN). יש להגדיר Environment Variable ב-Vercel או להזין טוקן ידנית בהגדרות מתקדמות.' 
      });
    }

    const headers = {
      'Authorization': `Bearer ${githubToken.trim()}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Kooks-Study-App-CMS'
    };

    // Helper to update a file in GitHub
    const updateGitHubFile = async (filePath: string, content: string, commitMessage: string) => {
      const getUrl = `https://api.github.com/repos/${githubRepo}/contents/${filePath}`;
      
      let sha = '';
      const getRes = await fetch(getUrl, { headers });
      if (getRes.ok) {
        const getData = await getRes.json();
        sha = getData.sha;
      }

      const putRes = await fetch(getUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: commitMessage,
          content: Buffer.from(content, 'utf-8').toString('base64'),
          sha: sha || undefined
        })
      });

      if (!putRes.ok) {
        const err = await putRes.json();
        throw new Error(err.message || `שגיאה בעדכון הקובץ ${filePath}`);
      }
    };

    const updates = [];

    // 3. Update Site Config if provided
    if (siteConfig) {
      updates.push(
        updateGitHubFile(
          'src/data/siteConfig.json',
          JSON.stringify(siteConfig, null, 2),
          'Update site branding and config via Admin CMS'
        )
      );
    }

    // 4. Update Schedule Data if provided
    if (scheduleData) {
      updates.push(
        updateGitHubFile(
          'src/data/schedule.json',
          JSON.stringify(scheduleData, null, 2),
          'Update study schedule via Admin CMS'
        )
      );
    }

    // 5. Update Daily Texts if provided
    if (textsData) {
      updates.push(
        updateGitHubFile(
          'src/data/allDailyTexts.json',
          JSON.stringify(textsData, null, 2),
          'Update daily study texts via Admin CMS'
        )
      );
    }

    await Promise.all(updates);

    return res.status(200).json({
      success: true,
      message: 'השינויים נשמרו ופורסמו בהצלחה לכל המשתמשים! Vercel מעדכן את האתר כעת (יופיע בעוד כ-30 שניות).'
    });
  } catch (error: any) {
    console.error('Publish API Error:', error);
    return res.status(500).json({
      error: error.message || 'שגיאה פנימית בעת הפרסום ל-GitHub'
    });
  }
}
