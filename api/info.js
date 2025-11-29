// Vercel Serverless Function
export default async function handler(request, response) {
  const { url } = request.query;

  if (!url) {
    return response.status(400).json({ error: 'Missing URL parameter' });
  }

  // 设置通用的缓存头
  response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  try {
    // === 1. Bilibili 处理逻辑 ===
    // 匹配 B 站 BV 号 (如 BV1xx411c7Xh)
    const biliMatch = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
    if (biliMatch) {
      const bvid = biliMatch[1];
      // 调用 Bilibili 官方 API
      const bApiUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
      const bRes = await fetch(bApiUrl);
      const bJson = await bRes.json();

      if (bJson.code === 0) {
        const data = bJson.data;
        return response.status(200).json({
          title: data.title,
          author_name: data.owner.name,
          thumbnail_url: data.pic, // B站封面通常是 http，部分浏览器可能会因为混内容警告而需要处理，但通常现代浏览器会自动升级或允许
          provider: 'bilibili'
        });
      } else {
        throw new Error('Bilibili video not found');
      }
    }

    // === 2. YouTube 处理逻辑 (原有的 oEmbed) ===
    // 如果不是 B 站，尝试按 YouTube 处理
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const ytResponse = await fetch(oembedUrl);

    if (ytResponse.ok) {
      const data = await ytResponse.json();
      return response.status(200).json({
        title: data.title,
        author_name: data.author_name,
        thumbnail_url: data.thumbnail_url,
        provider: 'youtube'
      });
    }

    throw new Error('Platform not supported or video not found');

  } catch (error) {
    return response.status(500).json({ error: 'Failed to fetch video details' });
  }
}