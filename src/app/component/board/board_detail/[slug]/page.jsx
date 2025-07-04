'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import {useParams} from "next/navigation";
import React from "react";
import Link from "next/link";

export default function BoardDetail() {
    const params = useParams();
    const {slug} = params;

    // id 타입 일치
    const post = boardPosts.find(p => String(p.id) === String(slug));

    // 이전/다음글 찾기
    const idx = boardPosts.findIndex(p => String(p.id) === String(slug));
    const prevPost = boardPosts[idx - 1];
    const nextPost = boardPosts[idx + 1];

    if (!post) {
        return (
            <div>
                <Header/>
                <div className="wrap padding_60_0">
                    <div className="board_card padding_40">
                        <h2 className="card_title font_700">게시글을 찾을 수 없습니다.</h2>
                        <div className="small_text mt_20">존재하지 않는 게시글이거나, 삭제된 게시글입니다.</div>
                    </div>
                </div>
                <Footer/>
            </div>
        );
    }

    return (
        <div>
            <Header/>
            <div className="wrap padding_60_0">
                <div className="board_card padding_40">
                    <h2 className="card_title font_700">{post.title}</h2>
                    <div className="flex gap_20 align_center mt_10 small_text detail_meta">
                        <span>작성자:
                            <b>{post.author}</b>
                        </span>
                        <span>등록일: {post.date}</span>
                        <span>조회수: {post.views}</span>
                    </div>
                    {/* 본문 */}
                    <div className="su_small_text mt_30 text_left">
                        <p>
                            {post.content || "이곳에 게시글 본문 내용이 들어갑니다. 실제 서비스에서는 줄바꿈, 이미지, 첨부파일 등 다양한 요소가 들어갈 수 있습니다."}
                        </p>
                        {/* 첨부파일 예시 */}
                        {
                            post.files && post.files.length > 0 && (
                                <div className="mt_20">
                                    <span className="font_600 small_text">첨부파일:</span>
                                    <ul>
                                        {
                                            post
                                                .files
                                                .map((file, idx) => (
                                                    <li key={idx}>
                                                        <a href={file.url} download="download" className="board_file_link">{file.name}</a>
                                                    </li>
                                                ))
                                        }
                                    </ul>
                                </div>
                            )
                        }
                    </div>
                    <div className="board_detail_nav">
                        {
                            prevPost && (
                                <div className="board_nav_item">
                                    <span className="board_nav_label su_small_text">이전글</span>
                                    <Link
                                        href={`/component/board/board_detail/${prevPost.id}`}
                                        className="board_nav_link small_text">
                                        {prevPost.title}
                                    </Link>
                                </div>
                            )
                        }
                        {
                            nextPost && (
                                <div className="board_nav_item">
                                    <span className="board_nav_label su_small_text">다음글</span>
                                    <Link
                                        href={`/component/board/board_detail/${nextPost.id}`}
                                        className="board_nav_link small_text">
                                        {nextPost.title}
                                    </Link>
                                </div>
                            )
                        }
                    </div>

                    {/* 목록 버튼 */}
                    <div className="width_100 mt_30 flex justify_end">
                        <div className="board_btn">
                            <Link href="/component/board">목록으로</Link>
                        </div>
                    </div>
                </div>
            </div>
            <Footer/>
        </div>
    );
}
