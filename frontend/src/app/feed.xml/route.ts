import RSS from 'rss'
import {getFeedList} from "@/api/feed";

interface FeedPostItem {
    id: string;
    url: string;
    title: string;
    content: string;
    publishedAt: string;
    cover: string | null;
}

interface FeedFormat {
    title: string;
    description: string;
    url: string;
    guid: string;
    date: string;
    enclosure?: {
        url: string;
        type: string;
    };
}

export async function GET() {
    const feed = new RSS({
        title: 'Grtsinry43\'s Blog',
        description: '一个认真学习前端的大二学生 总之岁月漫长，然而值得等待',
        site_url: 'https://blog.grtsinry43.com', // 你的网站域名
        feed_url: 'https://blog.grtsinry43.com/feed.xml', // 尽可能用绝对 URL
        language: 'zh-CN', // 网站语言代码
        image_url: 'https://dogeoss.grtsinry43.com/img/author.jpeg',
        generator: 'Grtblog v0.1.1-Technical Preview', // 想写什么就写什么，也可以不提供
        custom_elements: [ // 你可以添加任何自定义元素，这个用于添加 follow
            {
                'follow_challenge': [
                    {'feedId': '95323440721463296'},
                    {'userId': '77652777463264256'}
                ]
            }
        ]
    })

    const data = await getFeedList();
    data.forEach((item: FeedPostItem) => {
        const feedItem: FeedFormat = {
            title: item.title,
            description: item.content,
            url: item.url,
            guid: item.id,
            date: item.publishedAt
        };

        if (item.cover) {
            feedItem.enclosure = {
                url: item.cover,
                type: 'image/jpeg'
            };
        }

        feed.item(feedItem);
    });

    return new Response(feed.xml(), {
        headers: {
            'content-type': 'application/xml'
        }
    });
}
