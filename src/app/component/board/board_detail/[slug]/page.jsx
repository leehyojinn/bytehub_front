'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import {useParams, useRouter} from "next/navigation";
import React, {useState, useEffect} from "react";
import Link from "next/link";
import axios from "axios";

export default function BoardDetail() {
    const params = useParams();
    const router = useRouter();
    const {slug} = params;
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [allPosts, setAllPosts] = useState([]);
    const [loginId, setLoginId] = useState(null);
    const [isLogin, setIsLogin] = useState(false);

    // 날짜 포맷팅 함수
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}월 ${day}일`;
    };

    // JWT 토큰에서 사용자 ID를 추출하는 함수
    const getUserIdFromToken = () => {
        const token = localStorage.getItem("token");
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.id || null;
        } catch {
            return null;
        }
    };

    // API 서버 주소
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    // 게시글 목록 가져오기 (이전/다음글용)
    useEffect(() => {
        const fetchAllPosts = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${apiUrl}/post/list/1`, {
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.data.success) {
                    setAllPosts(response.data.list || []);
                }
            } catch (err) {
                console.error('게시글 목록 조회 오류:', err);
            }
        };

        fetchAllPosts();
    }, [apiUrl]);

    // 게시글 상세 정보 가져오기
    useEffect(() => {
        const fetchPostDetail = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                
                if (!token) {
                    setError('로그인이 필요합니다.');
                    setLoading(false);
                    return;
                }

                const response = await axios.get(`${apiUrl}/post/detail/${slug}`, {
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('API 응답:', response.data);

                if (response.data.success) {
                    setPost(response.data);
                    // 프론트엔드에서 직접 토큰에서 사용자 ID 추출
                    const currentUserId = getUserIdFromToken();
                    setLoginId(currentUserId);
                    setIsLogin(currentUserId !== null);
                } else {
                    setError('게시글을 불러올 수 없습니다.');
                }
            } catch (err) {
                console.error('게시글 상세 조회 오류:', err);
                if (err.response?.status === 500) {
                    setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                } else if (err.response?.status === 404) {
                    setError('게시글을 찾을 수 없습니다.');
                } else {
                    setError('게시글을 불러오는 중 오류가 발생했습니다.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchPostDetail();
        }
    }, [slug, apiUrl]);

    // 게시글 삭제 함수
    const handleDelete = async () => {
        if (!confirm('정말 삭제하시겠습니까?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            console.log('삭제 요청 데이터:', {
                post_idx: parseInt(slug),
                token: token ? '토큰 존재' : '토큰 없음'
            });

            const currentUserId = getUserIdFromToken();
            const response = await axios.delete(`${apiUrl}/post/delete`, {
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                data: {
                    post_idx: parseInt(slug),
                    user_id: currentUserId
                }
            });

            console.log('삭제 응답:', response.data);

            if (response.data.success) {
                alert('게시글이 삭제되었습니다.');
                router.push('/component/board');
            } else {
                alert('삭제에 실패했습니다: ' + (response.data.message || '알 수 없는 오류'));
            }
        } catch (err) {
            console.error('게시글 삭제 오류:', err);
            console.error('에러 응답:', err.response?.data);
            alert('삭제 중 오류가 발생했습니다: ' + (err.response?.data?.message || err.message));
        }
    };

    // 이전/다음글 찾기
    const currentIndex = allPosts.findIndex(p => String(p.post_idx) === String(slug));
    const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
    const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

    // 로딩 중
    if (loading) {
        return (
            <div>
                <Header/>
                <div className="wrap padding_60_0">
                    <div className="board_card padding_40">
                        <div className="text_center">
                            <div className="small_text">게시글을 불러오는 중...</div>
                        </div>
                    </div>
                </div>
                <Footer/>
            </div>
        );
    }

    // 에러 발생
    if (error) {
        return (
            <div>
                <Header/>
                <div className="wrap padding_60_0">
                    <div className="board_card padding_40">
                        <h2 className="card_title font_700">오류가 발생했습니다.</h2>
                        <div className="small_text mt_20">{error}</div>
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

    // 게시글이 없는 경우
    if (!post || !post.subject) {
        return (
            <div>
                <Header/>
                <div className="wrap padding_60_0">
                    <div className="board_card padding_40">
                        <h2 className="card_title font_700">게시글을 찾을 수 없습니다.</h2>
                        <div className="small_text mt_20">존재하지 않는 게시글이거나, 삭제된 게시글입니다.</div>
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

    return (
        <div>
            <Header/>
            <div className="wrap padding_60_0">
                <div className="board_card padding_40" style={{position: 'relative'}}>
                    {/* 수정/삭제 버튼 (작성자인 경우만 표시) - 오른쪽 상단 구석 */}
                    {(() => {
                        console.log('버튼 표시 조건 확인:', {
                            isLogin,
                            loginId,
                            postUserId: post.user_id,
                            shouldShow: isLogin && loginId === post.user_id
                        });
                        return isLogin && loginId === post.user_id;
                    })() && (
                        <div className="flex gap_10" style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            zIndex: 10
                        }}>
                            <div className="board_btn" style={{background: '#28a745', padding: '8px 16px'}}>
                                <Link href={`/component/board/board_edit/${post.post_idx}`}>수정</Link>
                            </div>
                            <div className="board_btn" style={{background: '#dc3545', padding: '8px 16px'}}>
                                <button onClick={handleDelete}>삭제</button>
                            </div>
                        </div>
                    )}
                    
                    {/* 제목 - 가운데 정렬 */}
                    <h2 className="card_title font_700 text_center">{post.subject}</h2>
                    
                    <div className="flex gap_20 align_center mt_10 small_text detail_meta">
                        <span>작성자: <b>{post.user_id}</b></span>
                        <span>등록일: {formatDate(post.reg_date)}</span>
                    </div>
                    
                    {/* 본문 */}
                    <div className="su_small_text mt_30 text_left">
                        <div style={{whiteSpace: 'pre-wrap'}}>
                            {post.content || "내용이 없습니다."}
                        </div>
                    </div>

                    {/* 이전/다음글 네비게이션 */}
                    <div className="board_detail_nav">
                        {prevPost && (
                            <div className="board_nav_item">
                                <span className="board_nav_label su_small_text">이전글</span>
                                <Link
                                    href={`/component/board/board_detail/${prevPost.post_idx}`}
                                    className="board_nav_link small_text">
                                    {prevPost.subject}
                                </Link>
                            </div>
                        )}
                        {nextPost && (
                            <div className="board_nav_item">
                                <span className="board_nav_label su_small_text">다음글</span>
                                <Link
                                    href={`/component/board/board_detail/${nextPost.post_idx}`}
                                    className="board_nav_link small_text">
                                    {nextPost.subject}
                                </Link>
                            </div>
                        )}
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
