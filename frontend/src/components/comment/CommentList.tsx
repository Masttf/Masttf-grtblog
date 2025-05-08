"use client";

import React, {useState, useEffect, useRef} from 'react';
import {getComments} from '@/api/comment';
import CommentListItem from './CommentListItem';
import styles from '@/styles/comment/CommentList.module.scss';
import {Comment} from '@/types';
import emitter from "@/utils/eventBus";
import CommentListSkeleton from "@/components/comment/CommentListSkeleton";
import {useNotificationUtil} from "@/utils/notification";

const CommentList = ({id, subComments, isModal}: { id?: string, subComments?: Comment[], isModal?: boolean }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef<IntersectionObserver>(null);
    const lastCommentElementRef = useRef<HTMLDivElement>(null);
    const showNotify = useNotificationUtil();

    useEffect(() => {
        const fetchComments = async () => {
            setLoading(true)
            if (id) {
                const newComments = await getComments(id, page, 10)
                setComments((prevComments) => {
                    const updatedComments = [...prevComments]
                    newComments.forEach((newComment: Comment) => {
                        const existingCommentIndex = updatedComments.findIndex((c) => c.id === newComment.id)
                        if (existingCommentIndex !== -1) {
                            updatedComments[existingCommentIndex] = newComment
                        } else {
                            updatedComments.push(newComment)
                        }
                    })
                    return updatedComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                })
                setHasMore(newComments.length === 10)
                setLoading(false)
            } else {
                if (subComments) setComments(subComments)
                setLoading(false)
            }
        }

        fetchComments()
    }, [id, page, subComments])

    useEffect(() => {
        if (loading) return
        if (observer.current) observer.current.disconnect()

        observer.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore) {
                setPage((prevPage) => prevPage + 1)
            }
        })

        if (lastCommentElementRef.current) {
            observer.current.observe(lastCommentElementRef.current)
        }
    }, [loading, hasMore])

    useEffect(() => {
        const handleRefreshCommentList = async () => {
            if (!id) {
                return
            }
            const newComments = await getComments(id, 1, page * 10)
            setComments((prevComments) => {
                const updatedComments = [...prevComments]

                const updateOrAddComment = (newComment: Comment, comments: Comment[]) => {
                    const index = comments.findIndex((comment) => comment.id === newComment.id)
                    if (index !== -1) {
                        comments[index] = newComment
                    } else {
                        comments.unshift(newComment)
                    }
                }

                newComments.forEach((newComment: Comment) => {
                    if (newComment.parentId) {
                        const parentComment = updatedComments.find((comment) => comment.id === newComment.parentId)
                        if (parentComment) {
                            updateOrAddComment(newComment, parentComment.children)
                        }
                    } else {
                        updateOrAddComment(newComment, updatedComments)
                    }
                })

                return updatedComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            })
        }

        emitter.on("refreshCommentList", handleRefreshCommentList)

        return () => {
            emitter.off("refreshCommentList", handleRefreshCommentList)
        }
    }, [id, page, showNotify])

    return (
        <div className={styles.commentListContainer} style={{
            marginLeft: id ? '0' : '3rem',
        }}>
            {comments.map((comment, index) => {
                if (comments.length === index + 1) {
                    return (
                        <div ref={lastCommentElementRef} key={isModal ? "Modal" + comment.id : comment.id}>
                            <CommentListItem comment={comment}/>
                        </div>
                    );
                } else {
                    return <CommentListItem key={isModal ? "Modal" + comment.id : comment.id} comment={comment}/>;
                }
            })}
            {loading && (
                <CommentListSkeleton/>
            )}
            {!hasMore && (
                <div className="text-center text-gray-500 text-sm mt-4 mb-4"> 没有更多啦，不小心让你翻到底了欸
                    〃•ω‹〃</div>
            )}
        </div>
    );
};

export default CommentList;
