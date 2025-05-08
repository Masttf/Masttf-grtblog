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

    if (post.code !== 0) {
        notFound();
    }
    return (
        <div className="article-container">
            <ArticleView post={post.data}/>
            <RelatedRecommend id={slug}/>
            <CommentArea id={post.data.commentId}/>
            <FloatingMenu items={[]}/>
        </div>
    );
}
