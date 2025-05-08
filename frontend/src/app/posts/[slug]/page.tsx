import ArticleView from '@/components/article/ArticleView';
import CommentArea from '@/components/comment/CommentArea';
import RelatedRecommend from '@/components/article/RelatedRecommend';
import {notFound} from 'next/navigation';
import FloatingMenu from "@/components/menu/FloatingMenu";

// 定义 API 请求的 URL
const API_URL = process.env.NEXT_PUBLIC_BASE_API_URL;


interface Params {
    slug: string;
}

export async function generateStaticParams() {
    // 向 Spring Boot 后端获取所有文章的 slug
    const res = await fetch(API_URL + '/article/shortLinks', {
        next: {revalidate: 60},
    });

    const posts = await res.json(); // 假设返回的数据是一个包含文章列表的 JSON 数组

    // 检查 posts 和 posts.data 是否存在且 posts.data 是一个数组
    if (!posts || !Array.isArray(posts.data)) {
        console.error("Failed to fetch posts or posts.data is not an array:", posts);
        return []; // 返回空数组，避免在 null 或非数组上调用 map
    }

    // 返回所有文章的 slug，以便 Next.js 生成静态页面
    return posts.data.map((post: string) => ({
        slug: post,
    }));
}

interface BlogPostProps {
    params: Promise<Params>;
}

export async function generateMetadata({params}: BlogPostProps) {
    const {slug} = await params;
    const res = await fetch(`${API_URL}/article/${slug}`, {
        next: {revalidate: 60},
    });
    const post = await res.json();
    if (post.code !== 0) {
        notFound();
    }
    return {
        title: post.data.title,
        description: post.data.summary,
    };
}

export default async function BlogPost({params}: BlogPostProps) {
    // 直接使用 await 来确保 params 被正确解析
    const {slug} = await params; // 确保 params 被解析

    // 获取单篇文章的详细内容
    const res = await fetch(`${API_URL}/article/${slug}`, {
        next: {revalidate: 60},
    });
    const post = await res.json();

    // 检查 post.code 是否为 0 并且 post.data 是否存在
    if (post.code !== 0 || !post.data) {
        notFound(); // 如果数据有问题，触发 notFound
    }

    return (
        <div className="article-container">
            {/* 确保 post.data 存在再传递给 ArticleView */}
            <ArticleView post={post.data}/>
            <RelatedRecommend id={slug}/>
            {/* 确保 post.data.commentId 存在再传递给 CommentArea */}
            {post.data.commentId && <CommentArea id={post.data.commentId}/>}
            <FloatingMenu items={[]}/>
        </div>
    );
}
