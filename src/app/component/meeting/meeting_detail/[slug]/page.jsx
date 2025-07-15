'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const MIN_LENGTH = 50;
const MAX_LENGTH = 5000;

export default function MeetingDetail() {
  const params = useParams();
  const router = useRouter();
  const { slug } = params;

  const [post, setPost] = useState(null);
  const [summary, setSummary] = useState("");         // AI 요약 결과
  const [editing, setEditing] = useState(false);      // 직접수정 모드
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [error, setError] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [loginId, setLoginId] = useState(null);
  const [isLogin, setIsLogin] = useState(false);
  const [editValue, setEditValue] = useState("");     // 직접수정 값

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

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
    const token = sessionStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || null;
    } catch {
      return null;
    }
  };

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
        const token = sessionStorage.getItem('token');
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

        if (response.data.success) {
          setPost(response.data);
          const currentUserId = getUserIdFromToken();
          setLoginId(currentUserId);
          setIsLogin(currentUserId !== null);
        } else {
          setError('게시글을 불러올 수 없습니다.');
        }
      } catch (err) {
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

  // AI 요약 불러오기 (최초 1회)
  useEffect(() => {
    const fetchAiSummary = async () => {
      if (!slug) return;
      try {
        const response = await axios.post(`${apiUrl}/ai/list`, { post_idx: slug });
        if (response.data.list && response.data.list.length > 0) {
          setSummary(response.data.list[0].summary);
        }
      } catch (e) {
        // 요약이 없어도 무시
      }
    };
    fetchAiSummary();
  }, [slug, apiUrl]);

  // 게시글 삭제 함수
  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
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

      if (response.data.success) {
        alert('게시글이 삭제되었습니다.');
        router.push('/component/meeting');
      } else {
        alert('삭제에 실패했습니다: ' + (response.data.message || '알 수 없는 오류'));
      }
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다: ' + (err.response?.data?.message || err.message));
    }
  };

  // 이전/다음글 찾기
  const currentIndex = allPosts.findIndex(p => String(p.post_idx) === String(slug));
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  // 본문 텍스트 정제
  const contentText =
    typeof post?.content === "string"
      ? post.content.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
      : "";

  const contentLength = contentText.length;
  const canSummarize =
    contentLength >= MIN_LENGTH && contentLength <= MAX_LENGTH;

  // ------------------------------
  // AI 요약 함수 (Gemini API → /ai/insert)
  // ------------------------------
  const fetchGeminiSummary = async () => {
    setLoading(true);
    setAiError("");
    setSummary("");
    setEditing(false);
    try {
      const prompt = `
다음은 회의록 내용입니다. 
회의 내용 상세정보만 짧게 요약해주세요.

[회의록]
${contentText}
      `.trim();

      // 1. Gemini 요약
      const res = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY,
        {
          contents: [
            { parts: [{ text: prompt }] }
          ]
        },
        { headers: { "Content-Type": "application/json" } }
      );
      const data = res.data;
      const answer =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "요약에 실패했습니다.";

      // 2. /ai/insert로 저장
      await axios.post(`${apiUrl}/ai/insert`, {
        post_idx: slug,
        summary: answer
      });

      setSummary(answer);
      setEditValue(answer);
    } catch (e) {
      setAiError("AI 요약 중 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  // 직접 요약/수정
  const handleEdit = () => {
    setEditing(true);
    setEditValue(summary || "");
  };

  // 직접수정 저장 → /ai/update
  const handleEditSave = async () => {
    setLoading(true);
    setAiError("");
    try {
      await axios.post(`${apiUrl}/ai/update`, {
        post_idx: slug,
        summary: editValue
      });
      setSummary(editValue);
      setEditing(false);
    } catch (e) {
      setAiError("AI 요약 수정 중 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  // 로딩 중
  if (loading) {
    return (
      <div>
        <Header />
        <div className="wrap padding_60_0">
          <div className="board_card padding_40">
            <div className="text_center">
              <div className="small_text">게시글을 불러오는 중...</div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // 에러 발생
  if (error) {
    return (
      <div>
        <Header />
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
        <Footer />
      </div>
    );
  }

  // 게시글이 없는 경우
  if (!post || !post.subject) {
    return (
      <div>
        <Header />
        <div className="wrap padding_60_0">
          <div className="board_card padding_40">
            <h2 className="card_title font_700">게시글을 찾을 수 없습니다.</h2>
            <div className="small_text mt_20">존재하지 않는 게시글이거나, 삭제된 게시글입니다.</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="board_card padding_40" style={{ position: 'relative' }}>
          {/* 수정/삭제 버튼 (작성자인 경우만 표시) */}
          {isLogin && loginId === post.user_id && (
            <div className="flex gap_10" style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              zIndex: 10
            }}>
              <div className="board_btn" style={{ background: '#28a745', padding: '8px 16px' }}>
                <Link href={`/component/meeting/meeting_edit/${post.post_idx}`}>수정</Link>
              </div>
              <div className="board_btn" style={{ background: '#dc3545', padding: '8px 16px' }}>
                <button onClick={handleDelete}>삭제</button>
              </div>
            </div>
          )}

          {/* 제목 */}
          <h2 className="card_title font_700 text_center">{post.subject}</h2>

          <div className="flex gap_20 align_center mt_10 small_text detail_meta">
            <span>작성자: <b>{post.user_id}</b></span>
            <span>등록일: {formatDate(post.reg_date)}</span>
          </div>

          {/* 본문 */}
          <div className="su_small_text mt_30 text_left">
            <p>
              {post.content ||
                "이곳에 게시글 본문 내용이 들어갑니다. 실제 서비스에서는 줄바꿈, 이미지, 첨부파일 등 다양한 요소가 들어갈 수 있습니다."}
            </p>
            {/* 첨부파일 */}
            {post.files && post.files.length > 0 && (
              <div className="mt_20">
                <span className="font_600 small_text">첨부파일:</span>
                <div className="file_attachment_wrap mt_10">
                  {post.files.map((file, idx) => {
                    const fileExtension = file.name.split('.').pop().toLowerCase();
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension);
                    
                    return (
                      <div key={idx} className="file_item mb_15">
                        {isImage ? (
                          // 이미지 파일인 경우 미리보기 표시
                          <div className="image_preview_wrap">
                            <img 
                              src={`${apiUrl}/file/download/${file.file_idx}`} 
                              alt={file.name}
                              className="image_preview"
                              style={{
                                maxWidth: '300px',
                                maxHeight: '200px',
                                objectFit: 'contain',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                marginBottom: '10px'
                              }}
                            />
                            <div className="file_info">
                              <span className="file_name">{file.name}</span>
                              <a 
                                href={`${apiUrl}/file/download/${file.file_idx}`} 
                                download={file.name}
                                className="download_btn"
                                style={{
                                  marginLeft: '10px',
                                  padding: '5px 10px',
                                  backgroundColor: '#007bff',
                                  color: 'white',
                                  textDecoration: 'none',
                                  borderRadius: '4px',
                                  fontSize: '12px'
                                }}
                              >
                                다운로드
                              </a>
                            </div>
                          </div>
                        ) : (
                          // 일반 파일인 경우 파일명과 다운로드 버튼
                          <div className="file_info" style={{ display: 'flex', alignItems: 'center' }}>
                            <span className="file_name">{file.name}</span>
                            <a 
                              href={`${apiUrl}/file/download/${file.file_idx}`} 
                              download={file.name}
                              className="download_btn"
                              style={{
                                marginLeft: '10px',
                                padding: '5px 10px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}
                            >
                              다운로드
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* AI 요약 버튼 및 결과 */}
          <div className="ai_summary_wrap mt_30">
            <div className="ai_summary_label font_600 mb_8">AI 요약</div>
            <div className="ai_summary_guide su_small_text mb_8">
              {`본문 글자 수: ${contentLength} / 최소 ${MIN_LENGTH}자, 최대 ${MAX_LENGTH}자`}
            </div>
            {!summary && (
              <>
                {!canSummarize && (
                  <div className="ai_summary_error mb_10">
                    {contentLength < MIN_LENGTH
                      ? `본문이 너무 짧아 요약할 수 없습니다. (${MIN_LENGTH}자 이상)`
                      : `본문이 너무 깁니다. (${MAX_LENGTH}자 이하)`}
                  </div>
                )}
                <button
                  className="ai_summary_btn"
                  onClick={fetchGeminiSummary}
                  disabled={!canSummarize || loading}
                >
                  {loading ? "AI 요약 중..." : "AI로 요약하기"}
                </button>
                {aiError && (
                  <div className="ai_summary_error mt_10">{aiError}</div>
                )}
              </>
            )}
            {summary && (
              <div className="ai_summary_result mt_20">
                <div className="ai_summary_label font_600 mb_6">
                  {editing ? "직접 요약/수정" : "AI 요약 결과"}
                </div>
                {editing ? (
                  <div>
                    <textarea
                      className="ai_summary_textarea"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      rows={5}
                      maxLength={MAX_LENGTH}
                      style={{ width: "100%", fontSize: "1.08rem", padding: "10px", borderRadius: "7px", border: "1.5px solid var(--primary-color2)" }}
                    />
                    <div className="flex gap_10 mt_8">
                      <button className="ai_summary_btn" onClick={handleEditSave}>저장</button>
                      <button className="ai_summary_btn" style={{ background: "#eee", color: "#888" }} onClick={() => setEditing(false)}>취소</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="ai_summary_text">{summary}</div>
                    <button className="ai_summary_btn mt_10" onClick={handleEdit}>직접 요약/수정</button>
                  </div>
                )}
                {aiError && (
                  <div className="ai_summary_error mt_10">{aiError}</div>
                )}
              </div>
            )}
          </div>

          {/* 이전/다음글 */}
          <div className="board_detail_nav mt_30 width_100 flex flex_column gap_10">
            {prevPost && (
              <div className="board_nav_item">
                <span className="board_nav_label su_small_text">이전글</span>
                <Link href={`/component/meeting/meeting_detail/${prevPost.post_idx}`}
                  className="board_nav_link small_text">
                  {prevPost.subject}
                </Link>
              </div>
            )}
            {nextPost && (
              <div className="board_nav_item">
                <span className="board_nav_label su_small_text">다음글</span>
                <Link href={`/component/meeting/meeting_detail/${nextPost.post_idx}`}
                  className="board_nav_link small_text">
                  {nextPost.subject}
                </Link>
              </div>
            )}
          </div>

          {/* 목록 버튼 */}
          <div className="width_100 mt_30 flex justify_end">
            <div className="board_btn">
              <Link href="/component/meeting">목록으로</Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
