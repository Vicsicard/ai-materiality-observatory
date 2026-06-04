const https = require('https');

https.get('https://blogs.microsoft.com/ai/feed/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Extract first item
    const itemMatch = data.match(/<item[^>]*>[\s\S]*?<\/item>/);
    if (itemMatch) {
      const itemXml = itemMatch[0];
      const title = itemXml.match(/<title[^>]*>([^<]+)<\/title>/);
      const link = itemXml.match(/<link[^>]*>([^<]+)<\/link>/);
      const pubDate = itemXml.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/);
      const description = itemXml.match(/<description[^>]*>([^<]+)<\/description>/);
      
      console.log('Title:', title ? title[1] : 'N/A');
      console.log('Link:', link ? link[1] : 'N/A');
      console.log('PubDate:', pubDate ? pubDate[1] : 'N/A');
      console.log('Description:', description ? description[1].substring(0, 100) + '...' : 'N/A');
    }
  });
}).on('error', (e) => console.error('Error:', e.message));
