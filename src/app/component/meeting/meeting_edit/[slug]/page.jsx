'use client'

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import {useEffect, useState} from "react";
import axios from "axios";
import {useParams, useRouter} from "next/navigation";

export default function MeetingEdit() {

    const params = useParams();
    const {slug} = params;
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        subject: "",
        content: "",
    });
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // JWT 토큰에서 사용자 ID를 추출하는 함수
    const getUserIdFromToken = () => {
        const token = sessionStorage.getItem("token");
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

    // 기존 게시글 데이터 불러오기
    useEffect(() => {
        const fetchPostDetail = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');

                const response = await axios.get(`${apiUrl}/post/detail/${slug}`, {
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data.success) {
                    const postData = response.data;
                    setForm({
                        subject: postData.subject || '',
                        content: postData.content || ''
                    });

                    // 디버깅: 사용자 ID 비교
                    const currentUserId = getUserIdFromToken();
                    console.log('수정 페이지 - 사용자 ID 비교:', {
                        currentUserId,
                        postUserId: postData.user_id,
                        isAuthor: currentUserId === postData.user_id
                    });
                } else {
                    setError('게시글을 불러올 수 없습니다.');
                }
            } catch (err) {
                console.error('게시글 상세 조회 오류:', err);
                setError('게시글을 불러오는 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchPostDetail();
        }
    }, [slug, apiUrl]);

    // 제목/내용 입력 변경 시 상태 업데이트
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // 게시글 수정 제출
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.subject.trim()) {
            alert('제목을 입력해주세요.');
            return;
        }

        if (!form.content.trim()) {
            alert('내용을 입력해주세요.');
            return;
        }

        try {
            setSubmitting(true);
            const token = sessionStorage.getItem('token');

            console.log('수정 요청 데이터:', {
                post_idx: parseInt(slug),
                subject: form.subject.trim(),
                content: form.content.trim(),
                category: "MEETING",
            });

            console.log('JWT 토큰 정보:', {
                token: token ? '토큰 존재' : '토큰 없음',
                tokenLength: token ? token.length : 0
            });

            const currentUserId = getUserIdFromToken();
            const response = await axios.put(`${apiUrl}/board/update`, {
                post_idx: parseInt(slug),
                subject: form.subject.trim(),
                content: form.content.trim(),
                category: "MEETING",
                user_id: currentUserId
            }, {
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            console.log('수정 응답:', response.data);

            if (response.data.success) {
                alert('게시글이 수정되었습니다.');
                router.push(`/component/meeting/meeting_detail/${slug}`);
            } else {
                alert('수정에 실패했습니다: ' + (response.data.message || '알 수 없는 오류'));
            }
        } catch (err) {
            console.error('게시글 수정 오류:', err);
            console.error('에러 응답:', err.response?.data);
            alert('수정 중 오류가 발생했습니다: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

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
    return (
        <div>
            <Header/>
            <div className="wrap padding_60_0">
                <div className="board_card board_write_card">
                    <div className="card_title font_700 text_center">게시글 수정</div>

                    <form className="board_write_form" onSubmit={handleSubmit} autoComplete="off">
                        {/* 제목 입력란 */}
                        <div className="board_write_row">
                            <label htmlFor="subject" className="board_write_label small_text font_600">제목</label>
                            <input
                                id="subject"
                                name="subject"
                                className="board_write_input"
                                type="text"
                                placeholder="제목을 입력하세요"
                                value={form.subject}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* 내용 입력란 */}
                        <div className="board_write_row">
                            <label htmlFor="content" className="board_write_label small_text font_600">내용</label>
                            <textarea
                                id="content"
                                name="content"
                                className="board_write_textarea"
                                placeholder="내용을 입력하세요"
                                value={form.content}
                                onChange={handleChange}
                                rows={7}
                                required
                            />
                        </div>

                        {/* 버튼 영역 */}

                        {/* 등록/취소 버튼 */}
                        <div className="board_write_footer">
                            <button type="submit" className="board_btn board_write_btn"
                                    disabled={submitting}>
                                {submitting ? '수정 중...' : '수정하기'}
                            </button>
                            <button
                                type="button"
                                className="board_btn board_write_btn board_btn_cancel"
                                onClick={() => window.history.back()}
                            >
                                취소
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <Footer/>
        </div>
    );
}