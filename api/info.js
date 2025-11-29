// Vercel Serverless Function
export default async function handler(request, response) {
  const { url } = request.query;

  if (!url) {
    return response.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    // 使用 YouTube 官方的 oEmbed 接口获取数据
    // 这个接口返回 JSON，包含标题、作者、封面图等信息
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;

    const ytResponse = await fetch(oembedUrl);

    if (!ytResponse.ok) {
      throw new Error('Failed to fetch video info');
    }

    const data = await ytResponse.json();

    // 设置缓存头，减轻重复请求压力
    response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    response.status(200).json(data);

  } catch (error) {
    response.status(500).json({ error: 'Failed to fetch video details' });
  }
}