// Vercel Serverless Function
export default async function handler(request, response) {
  const { url } = request.query;

  if (!url) {
    return response.status(400).json({ error: 'Missing URL parameter' });
  }

  response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  try {
    // === 1. Bilibili 处理逻辑 ===
    const biliMatch = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
    if (biliMatch) {
      const bvid = biliMatch[1];
      const bApiUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
      const bRes = await fetch(bApiUrl);
      const bJson = await bRes.json();

      if (bJson.code === 0) {
        const data = bJson.data;

        // --- 解析分辨率 ---
        let resolution = '1080P';
        // B站 dimension 字段包含 width/height
        if (data.dimension) {
            const { width, height } = data.dimension;
            if (width >= 3840 || height >= 2160) resolution = '4K';
            else if (width >= 2560 || height >= 1440) resolution = '2K';
            else if (width >= 1920 || height >= 1080) resolution = '1080P';
            else resolution = '720P';
        }

        // --- 解析字幕 ---
        let has_zh = false;
        let has_en = false;
        if (data.subtitle && data.subtitle.list) {
            // 遍历字幕列表检查语言
            data.subtitle.list.forEach(sub => {
                const lan = sub.lan; // 语言代码
                const doc = sub.lan_doc; // 显示名称
                if (lan.includes('zh') || doc.includes('中')) has_zh = true;
                if (lan.includes('en') || doc.includes('英')) has_en = true;
            });
        }

        return response.status(200).json({
          title: data.title,
          author_name: data.owner.name,
          thumbnail_url: data.pic,
          provider: 'bilibili',
          // 新增字段
          max_res: resolution,
          has_zh_sub: has_zh,
          has_en_sub: has_en
        });
      } else {
        throw new Error('Bilibili video not found');
      }
    }

    // === 2. YouTube 处理逻辑 ===
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const ytResponse = await fetch(oembedUrl);

    if (ytResponse.ok) {
      const data = await ytResponse.json();
      return response.status(200).json({
        title: data.title,
        author_name: data.author_name,
        thumbnail_url: data.thumbnail_url,
        provider: 'youtube',
        // YouTube oEmbed 无法获取这些信息，设为 null
        max_res: null, 
        has_zh_sub: null,
        has_en_sub: null
      });
    }

    throw new Error('Platform not supported or video not found');

  } catch (error) {
    return response.status(500).json({ error: 'Failed to fetch video details' });
  }
}
